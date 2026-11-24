package pe.edu.utp.superhuancayo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.service.AuditService;

import java.math.BigDecimal;
import java.util.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductoController {

    private final JdbcTemplate jdbc;
    private final AuditService auditService;

    public ProductoController(JdbcTemplate jdbc, AuditService auditService) {
        this.jdbc = jdbc;
        this.auditService = auditService;
    }

    @GetMapping("/api/productos")
    public ResponseEntity<List<Map<String, Object>>> listarPublico(
            @RequestParam(required = false) String cat,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal min,
            @RequestParam(required = false) BigDecimal max,
            @RequestParam(required = false) Boolean destacado,
            @RequestParam(required = false, defaultValue = "relevancia") String sort) {

        StringBuilder sql = new StringBuilder("SELECT * FROM productos WHERE activo = TRUE");
        List<Object> params = new ArrayList<>();

        if (cat != null && !cat.isBlank() && !"all".equalsIgnoreCase(cat)) {
            sql.append(" AND LOWER(categoria) = LOWER(?)");
            params.add(cat.trim());
        }
        if (marca != null && !marca.isBlank()) {
            sql.append(" AND LOWER(marca) = LOWER(?)");
            params.add(marca.trim());
        }
        if (destacado != null && destacado) {
            sql.append(" AND destacado = TRUE");
        }
        if (min != null) {
            sql.append(" AND precio >= ?");
            params.add(min);
        }
        if (max != null) {
            sql.append(" AND precio <= ?");
            params.add(max);
        }
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            sql.append(" AND (LOWER(nombre) LIKE ? OR LOWER(marca) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(descripcion) LIKE ?)");
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }

        switch (sort) {
            case "menor-precio" -> sql.append(" ORDER BY precio ASC");
            case "mayor-precio" -> sql.append(" ORDER BY precio DESC");
            case "descuento" -> sql.append(" ORDER BY descuento_pct DESC, id ASC");
            default -> sql.append(" ORDER BY destacado DESC, id ASC");
        }

        return ResponseEntity.ok(jdbc.queryForList(sql.toString(), params.toArray()));
    }

    @GetMapping("/api/productos/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM productos WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @GetMapping("/api/admin/productos")
    public ResponseEntity<List<Map<String, Object>>> listarAdmin() {
        return ResponseEntity.ok(jdbc.queryForList("SELECT * FROM productos ORDER BY id ASC"));
    }

    @PostMapping("/api/productos")
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        String sku = str(body.get("sku")).toUpperCase();
        String nombre = str(body.get("nombre"));
        String marca = str(body.get("marca"));
        String categoria = str(body.get("categoria")).toLowerCase();
        String descripcion = str(body.get("descripcion"));
        String especificaciones = str(body.get("especificaciones"));
        String imagenUrl = str(body.get("imagen_url"));
        BigDecimal precio = dec(body.get("precio"));
        BigDecimal precioAnterior = decNullable(body.get("precio_anterior"));
        Integer descuento = intVal(body.get("descuento_pct"), 0);
        Integer stock = intVal(body.get("stock"), 0);
        Integer stockMin = intVal(body.get("stock_minimo"), 5);
        boolean destacado = Boolean.TRUE.equals(body.get("destacado")) || "true".equalsIgnoreCase(str(body.get("destacado")));
        boolean activo = body.get("activo") == null || Boolean.TRUE.equals(body.get("activo")) || "true".equalsIgnoreCase(str(body.get("activo")));

        if (sku.isBlank() || nombre.isBlank() || marca.isBlank() || categoria.isBlank() || precio == null || precio.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "SKU, nombre, marca, categoría y precio válido son obligatorios."));
        }
        if (imagenUrl.isBlank()) {
            imagenUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";
        }
        if (descripcion.isBlank()) {
            descripcion = "Producto tecnológico original con garantía en Av. Giraldez N.º 442, Huancayo.";
        }

        Integer dup = jdbc.queryForObject("SELECT count(*) FROM productos WHERE UPPER(sku) = ?", Integer.class, sku);
        if (dup != null && dup > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Ya existe un producto con el SKU " + sku));
        }

        Long id = jdbc.queryForObject(
                "INSERT INTO productos (sku, nombre, marca, categoria, descripcion, especificaciones, precio, precio_anterior, descuento_pct, stock, stock_minimo, imagen_url, destacado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                Long.class, sku, nombre, marca, categoria, descripcion, especificaciones, precio, precioAnterior, descuento, Math.max(0, stock), Math.max(1, stockMin), imagenUrl, destacado, activo
        );

        auditService.logFromRequest(req, "CREAR_PRODUCTO", "PRODUCTOS", "SKU " + sku + " - " + nombre + " (S/ " + precio + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "id", id, "mensaje", "Producto creado correctamente."));
    }

    @PutMapping("/api/productos/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        List<Map<String, Object>> existing = jdbc.queryForList("SELECT * FROM productos WHERE id = ?", id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado."));
        }
        Map<String, Object> cur = existing.get(0);

        String sku = body.containsKey("sku") ? str(body.get("sku")).toUpperCase() : str(cur.get("sku"));
        String nombre = body.containsKey("nombre") ? str(body.get("nombre")) : str(cur.get("nombre"));
        String marca = body.containsKey("marca") ? str(body.get("marca")) : str(cur.get("marca"));
        String categoria = body.containsKey("categoria") ? str(body.get("categoria")).toLowerCase() : str(cur.get("categoria"));
        String descripcion = body.containsKey("descripcion") ? str(body.get("descripcion")) : str(cur.get("descripcion"));
        String especificaciones = body.containsKey("especificaciones") ? str(body.get("especificaciones")) : str(cur.get("especificaciones"));
        String imagenUrl = body.containsKey("imagen_url") && !str(body.get("imagen_url")).isBlank() ? str(body.get("imagen_url")) : str(cur.get("imagen_url"));
        BigDecimal precio = body.containsKey("precio") ? dec(body.get("precio")) : (BigDecimal) cur.get("precio");
        BigDecimal precioAnterior = body.containsKey("precio_anterior") ? decNullable(body.get("precio_anterior")) : (BigDecimal) cur.get("precio_anterior");
        int descuento = body.containsKey("descuento_pct") ? intVal(body.get("descuento_pct"), 0) : ((Number) cur.get("descuento_pct")).intValue();
        int stock = body.containsKey("stock") ? intVal(body.get("stock"), 0) : ((Number) cur.get("stock")).intValue();
        int stockMin = body.containsKey("stock_minimo") ? intVal(body.get("stock_minimo"), 5) : ((Number) cur.get("stock_minimo")).intValue();
        boolean destacado = body.containsKey("destacado") ? Boolean.TRUE.equals(body.get("destacado")) : Boolean.TRUE.equals(cur.get("destacado"));
        boolean activo = body.containsKey("activo") ? Boolean.TRUE.equals(body.get("activo")) : Boolean.TRUE.equals(cur.get("activo"));

        jdbc.update(
                "UPDATE productos SET sku=?, nombre=?, marca=?, categoria=?, descripcion=?, especificaciones=?, precio=?, precio_anterior=?, descuento_pct=?, stock=?, stock_minimo=?, imagen_url=?, destacado=?, activo=? WHERE id=?",
                sku, nombre, marca, categoria, descripcion, especificaciones, precio, precioAnterior, descuento, Math.max(0, stock), Math.max(1, stockMin), imagenUrl, destacado, activo, id
        );

        auditService.logFromRequest(req, "ACTUALIZAR_PRODUCTO", "PRODUCTOS", "ID #" + id + " (" + sku + ") stock=" + stock + " precio=S/" + precio);
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Producto actualizado correctamente."));
    }

    @DeleteMapping("/api/productos/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, HttpServletRequest req) {
        Integer refs = jdbc.queryForObject("SELECT count(*) FROM pedido_items WHERE producto_id = ?", Integer.class, id);
        if (refs != null && refs > 0) {
            int upd = jdbc.update("UPDATE productos SET activo = FALSE WHERE id = ?", id);
            if (upd == 0) return ResponseEntity.notFound().build();
            auditService.logFromRequest(req, "DESACTIVAR_PRODUCTO", "PRODUCTOS", "Producto #" + id + " desactivado (tiene pedidos históricos)");
            return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Producto desactivado del catálogo (conserva historial de pedidos)."));
        }
        int del = jdbc.update("DELETE FROM productos WHERE id = ?", id);
        if (del == 0) return ResponseEntity.notFound().build();
        auditService.logFromRequest(req, "ELIMINAR_PRODUCTO", "PRODUCTOS", "Producto #" + id + " eliminado");
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Producto eliminado del inventario."));
    }

    private String str(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private BigDecimal dec(Object o) {
        try { return o == null || str(o).isEmpty() ? null : new BigDecimal(str(o)); } catch (Exception e) { return null; }
    }
    private BigDecimal decNullable(Object o) {
        BigDecimal d = dec(o);
        return (d != null && d.compareTo(BigDecimal.ZERO) > 0) ? d : null;
    }
    private int intVal(Object o, int def) {
        try { return o == null || str(o).isEmpty() ? def : Integer.parseInt(str(o)); } catch (Exception e) { return def; }
    }
}
