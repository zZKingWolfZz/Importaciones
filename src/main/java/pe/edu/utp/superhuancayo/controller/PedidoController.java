package pe.edu.utp.superhuancayo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.service.AuditService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PedidoController {

    private final JdbcTemplate jdbc;
    private final AuditService auditService;

    public PedidoController(JdbcTemplate jdbc, AuditService auditService) {
        this.jdbc = jdbc;
        this.auditService = auditService;
    }

    @PostMapping("/api/cupones/validar")
    public ResponseEntity<?> validarCupon(@RequestBody Map<String, Object> body) {
        String codigo = str(body.get("codigo")).toUpperCase();
        BigDecimal subtotal = dec(body.get("subtotal"));
        if (subtotal == null) subtotal = BigDecimal.ZERO;

        if (codigo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese un código de cupón."));
        }

        Map<String, Object> eval = evaluarCupon(codigo, subtotal);
        if (!Boolean.TRUE.equals(eval.get("valido"))) {
            return ResponseEntity.badRequest().body(Map.of("error", eval.get("error")));
        }
        return ResponseEntity.ok(eval);
    }

    @PostMapping("/api/pedidos")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> crearPedido(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        String clienteNombre = str(body.get("cliente_nombre"));
        String tipoComprobante = str(body.get("tipo_comprobante")).toUpperCase();
        if (tipoComprobante.isBlank()) tipoComprobante = "BOLETA";
        String clienteDoc = str(body.get("cliente_dni_ruc")).replaceAll("[^0-9]", "");
        String razonSocial = str(body.get("razon_social"));
        String telefono = str(body.get("cliente_telefono")).replaceAll("[^0-9]", "");
        String correo = str(body.get("cliente_correo"));
        String tipoEntrega = str(body.get("tipo_entrega")).toUpperCase();
        String direccion = str(body.get("direccion_entrega"));
        String metodoPago = str(body.get("metodo_pago")).toUpperCase();
        String referenciaPago = str(body.get("referencia_pago"));
        String cuponCodigo = str(body.get("cupon_codigo")).toUpperCase();
        String notas = str(body.get("notas"));

        Object itemsObj = body.get("items");
        if (!(itemsObj instanceof List<?> rawItems) || rawItems.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El carrito de compras está vacío."));
        }
        if (clienteNombre.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese el nombre completo del titular."));
        }
        if ("FACTURA".equals(tipoComprobante)) {
            if (!clienteDoc.matches("^[0-9]{11}$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Para Factura Electrónica el RUC debe tener exactamente 11 dígitos."));
            }
            if (razonSocial.length() < 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ingrese la Razón Social de la empresa."));
            }
        } else {
            tipoComprobante = "BOLETA";
            if (!clienteDoc.matches("^[0-9]{8}$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Para Boleta Electrónica el DNI debe tener exactamente 8 dígitos."));
            }
        }
        if (!telefono.matches("^[0-9]{9}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El celular de contacto debe tener exactamente 9 dígitos."));
        }
        if (!List.of("RETIRO_TIENDA", "EXPRESS_180", "PROVINCIA").contains(tipoEntrega)) {
            tipoEntrega = "RETIRO_TIENDA";
        }
        if (!"RETIRO_TIENDA".equals(tipoEntrega) && direccion.length() < 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese la dirección exacta de entrega."));
        }
        if ("RETIRO_TIENDA".equals(tipoEntrega) && direccion.isBlank()) {
            direccion = "Av. Giraldez N.º 442, Huancayo (Retiro en Tienda)";
        }
        if (!List.of("YAPE", "PLIN", "TARJETA", "CONTRAENTREGA").contains(metodoPago)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Seleccione un método de pago válido."));
        }
        if (("YAPE".equals(metodoPago) || "PLIN".equals(metodoPago)) && referenciaPago.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese el N.º de Operación de su transferencia Yape/Plin."));
        }

        // Recalcular subtotal y descontar stock atómicamente desde la BD
        BigDecimal subtotal = BigDecimal.ZERO;
        List<Map<String, Object>> verifiedItems = new ArrayList<>();

        for (Object obj : rawItems) {
            if (!(obj instanceof Map<?, ?> itemMap)) continue;
            Long prodId = longVal(itemMap.get("producto_id"));
            int cantidad = intVal(itemMap.get("cantidad"), 0);
            if (prodId == null || cantidad <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ítem de carrito inválido."));
            }

            List<Map<String, Object>> prodRows = jdbc.queryForList(
                    "SELECT id, sku, nombre, precio, stock, activo FROM productos WHERE id = ? FOR UPDATE",
                    prodId
            );
            if (prodRows.isEmpty() || !Boolean.TRUE.equals(prodRows.get(0).get("activo"))) {
                throw new IllegalArgumentException("Uno de los productos seleccionados ya no está disponible.");
            }
            Map<String, Object> prod = prodRows.get(0);
            int stockActual = ((Number) prod.get("stock")).intValue();
            if (stockActual < cantidad) {
                throw new IllegalArgumentException("Stock insuficiente para \"" + prod.get("nombre") + "\" (disponible: " + stockActual + ").");
            }

            jdbc.update("UPDATE productos SET stock = stock - ? WHERE id = ?", cantidad, prodId);

            BigDecimal precioUnit = (BigDecimal) prod.get("precio");
            BigDecimal itemSub = precioUnit.multiply(BigDecimal.valueOf(cantidad)).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemSub);

            Map<String, Object> vi = new LinkedHashMap<>();
            vi.put("producto_id", prodId);
            vi.put("sku", prod.get("sku"));
            vi.put("nombre_producto", prod.get("nombre"));
            vi.put("cantidad", cantidad);
            vi.put("precio_unitario", precioUnit);
            vi.put("subtotal", itemSub);
            verifiedItems.add(vi);
        }

        // Costo de envío según modalidad
        BigDecimal costoEnvio = BigDecimal.ZERO;
        if ("EXPRESS_180".equals(tipoEntrega)) {
            costoEnvio = subtotal.compareTo(new BigDecimal("250.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("12.00");
        } else if ("PROVINCIA".equals(tipoEntrega)) {
            costoEnvio = new BigDecimal("18.00");
        }

        // Aplicar cupón si fue ingresado
        BigDecimal descuento = BigDecimal.ZERO;
        String cuponAplicado = null;
        if (!cuponCodigo.isBlank()) {
            Map<String, Object> eval = evaluarCupon(cuponCodigo, subtotal);
            if (!Boolean.TRUE.equals(eval.get("valido"))) {
                throw new IllegalArgumentException(String.valueOf(eval.get("error")));
            }
            cuponAplicado = cuponCodigo;
            String tipoCup = String.valueOf(eval.get("tipo"));
            if ("ENVIO_GRATIS".equals(tipoCup)) {
                descuento = costoEnvio;
            } else {
                descuento = (BigDecimal) eval.get("descuento");
            }
            jdbc.update("UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE UPPER(codigo) = ?", cuponCodigo);
        }

        BigDecimal total = subtotal.add(costoEnvio).subtract(descuento).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal opGravada = total.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(opGravada).setScale(2, RoundingMode.HALF_UP);

        String estadoInicial = "CONTRAENTREGA".equals(metodoPago) ? "PENDIENTE" : "CONFIRMADO";
        String codigoPedido = "PED-2026-" + String.format("%06d", 100000 + new Random().nextInt(899999));

        Long usuarioId = null;
        String authUsername = clienteNombre;
        String authRol = "CLIENTE";
        if (req.getAttribute("authUser") instanceof Map<?, ?> claims) {
            usuarioId = ((Number) claims.get("id")).longValue();
            authUsername = String.valueOf(claims.get("username"));
            authRol = String.valueOf(claims.get("rol"));
        }

        Long pedidoId = jdbc.queryForObject(
                """
                INSERT INTO pedidos (
                  codigo, usuario_id, cliente_nombre, cliente_dni_ruc, tipo_comprobante, razon_social,
                  cliente_telefono, cliente_correo, tipo_entrega, direccion_entrega, metodo_pago,
                  referencia_pago, cupon_codigo, subtotal, descuento, costo_envio, op_gravada, igv, total, estado, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """,
                Long.class,
                codigoPedido, usuarioId, clienteNombre, clienteDoc, tipoComprobante,
                razonSocial.isBlank() ? null : razonSocial,
                telefono, correo.isBlank() ? null : correo, tipoEntrega, direccion, metodoPago,
                referenciaPago.isBlank() ? null : referenciaPago, cuponAplicado,
                subtotal, descuento, costoEnvio, opGravada, igv, total, estadoInicial,
                notas.isBlank() ? null : notas
        );

        for (Map<String, Object> vi : verifiedItems) {
            jdbc.update(
                    "INSERT INTO pedido_items (pedido_id, producto_id, sku, nombre_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    pedidoId, vi.get("producto_id"), vi.get("sku"), vi.get("nombre_producto"),
                    vi.get("cantidad"), vi.get("precio_unitario"), vi.get("subtotal")
            );
        }

        auditService.log(req, authUsername, authRol, "NUEVO_PEDIDO", "PEDIDOS",
                "Pedido " + codigoPedido + " por S/ " + total + " (" + metodoPago + ")");

        Map<String, Object> pedido = obtenerPedidoCompleto(pedidoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "ok", true,
                "mensaje", "Pedido registrado exitosamente",
                "codigo", codigoPedido,
                "pedido", pedido
        ));
    }

    @GetMapping("/api/pedidos/seguimiento/{codigo}")
    public ResponseEntity<?> seguimiento(@PathVariable String codigo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, codigo, cliente_nombre, tipo_comprobante, tipo_entrega, direccion_entrega, metodo_pago, cupon_codigo, subtotal, descuento, costo_envio, op_gravada, igv, total, estado, created_at, updated_at FROM pedidos WHERE UPPER(codigo) = UPPER(?)",
                codigo.trim()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No encontramos ningún pedido con el código " + codigo));
        }
        Map<String, Object> pedido = new LinkedHashMap<>(rows.get(0));
        Long pedidoId = ((Number) pedido.get("id")).longValue();
        List<Map<String, Object>> items = jdbc.queryForList(
                "SELECT sku, nombre_producto, cantidad, precio_unitario, subtotal FROM pedido_items WHERE pedido_id = ? ORDER BY id ASC",
                pedidoId
        );
        pedido.put("items", items);
        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/api/mis-pedidos")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> misPedidos(HttpServletRequest req) {
        Map<String, Object> claims = (Map<String, Object>) req.getAttribute("authUser");
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debe iniciar sesión"));
        }
        Long uid = ((Number) claims.get("id")).longValue();
        List<Map<String, Object>> list = jdbc.queryForList(
                "SELECT id, codigo, tipo_comprobante, tipo_entrega, metodo_pago, total, estado, created_at FROM pedidos WHERE usuario_id = ? ORDER BY created_at DESC",
                uid
        );
        for (Map<String, Object> p : list) {
            Long pid = ((Number) p.get("id")).longValue();
            p.put("items", jdbc.queryForList("SELECT sku, nombre_producto, cantidad, precio_unitario, subtotal FROM pedido_items WHERE pedido_id = ?", pid));
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/api/admin/pedidos")
    public ResponseEntity<List<Map<String, Object>>> listarAdmin(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String q) {

        StringBuilder sql = new StringBuilder("SELECT * FROM pedidos WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (estado != null && !estado.isBlank() && !"ALL".equalsIgnoreCase(estado)) {
            sql.append(" AND UPPER(estado) = UPPER(?)");
            params.add(estado.trim());
        }
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            sql.append(" AND (LOWER(codigo) LIKE ? OR LOWER(cliente_nombre) LIKE ? OR LOWER(cliente_dni_ruc) LIKE ?)");
            params.add(like);
            params.add(like);
            params.add(like);
        }
        sql.append(" ORDER BY created_at DESC");

        List<Map<String, Object>> list = jdbc.queryForList(sql.toString(), params.toArray());
        for (Map<String, Object> p : list) {
            Long pid = ((Number) p.get("id")).longValue();
            p.put("items", jdbc.queryForList("SELECT * FROM pedido_items WHERE pedido_id = ? ORDER BY id ASC", pid));
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/api/admin/pedidos/{id}/estado")
    @Transactional
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        String nuevoEstado = str(body.get("estado")).toUpperCase();
        if (!List.of("PENDIENTE", "CONFIRMADO", "PREPARANDO", "EN_CAMINO", "ENTREGADO", "CANCELADO").contains(nuevoEstado)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado de pedido inválido."));
        }

        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, codigo, estado FROM pedidos WHERE id = ? FOR UPDATE", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Pedido no encontrado."));
        }
        String estadoActual = str(rows.get(0).get("estado"));
        String codigo = str(rows.get(0).get("codigo"));

        if ("CANCELADO".equals(nuevoEstado) && !"CANCELADO".equals(estadoActual)) {
            List<Map<String, Object>> items = jdbc.queryForList("SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?", id);
            for (Map<String, Object> it : items) {
                jdbc.update("UPDATE productos SET stock = stock + ? WHERE id = ?", it.get("cantidad"), it.get("producto_id"));
            }
        } else if (!"CANCELADO".equals(nuevoEstado) && "CANCELADO".equals(estadoActual)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Un pedido cancelado no puede reactivarse directamente."));
        }

        jdbc.update("UPDATE pedidos SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", nuevoEstado, id);
        auditService.logFromRequest(req, "ESTADO_PEDIDO", "PEDIDOS",
                codigo + ": " + estadoActual + " -> " + nuevoEstado);

        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Pedido " + codigo + " actualizado a " + nuevoEstado));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadReq(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    private Map<String, Object> evaluarCupon(String codigo, BigDecimal subtotal) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM cupones WHERE UPPER(codigo) = UPPER(?)", codigo
        );
        if (rows.isEmpty()) {
            return Map.of("valido", false, "error", "El cupón \"" + codigo + "\" no existe.");
        }
        Map<String, Object> c = rows.get(0);
        if (!Boolean.TRUE.equals(c.get("activo"))) {
            return Map.of("valido", false, "error", "El cupón está inactivo.");
        }
        java.sql.Date exp = (java.sql.Date) c.get("fecha_expiracion");
        if (exp != null && exp.toLocalDate().isBefore(LocalDate.now())) {
            return Map.of("valido", false, "error", "El cupón ha expirado.");
        }
        int usosAct = ((Number) c.get("usos_actuales")).intValue();
        int usosMax = ((Number) c.get("usos_maximos")).intValue();
        if (usosAct >= usosMax) {
            return Map.of("valido", false, "error", "El cupón alcanzó su límite máximo de usos.");
        }
        BigDecimal min = (BigDecimal) c.get("monto_minimo");
        if (subtotal.compareTo(min) < 0) {
            return Map.of("valido", false, "error", "El cupón " + codigo + " requiere una compra mínima de S/ " + min);
        }

        String tipo = str(c.get("tipo"));
        BigDecimal valor = (BigDecimal) c.get("valor");
        BigDecimal desc;
        if ("PORCENTAJE".equals(tipo)) {
            desc = subtotal.multiply(valor).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if ("MONTO_FIJO".equals(tipo)) {
            desc = valor.min(subtotal);
        } else {
            desc = BigDecimal.ZERO;
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("valido", true);
        res.put("codigo", c.get("codigo"));
        res.put("tipo", tipo);
        res.put("valor", valor);
        res.put("descuento", desc);
        res.put("mensaje", "ENVIO_GRATIS".equals(tipo) ? "Cupón aplicado: Envío Express gratis" : "Cupón " + c.get("codigo") + " aplicado (-S/ " + desc + ")");
        return res;
    }

    private Map<String, Object> obtenerPedidoCompleto(Long pedidoId) {
        Map<String, Object> p = new LinkedHashMap<>(jdbc.queryForMap("SELECT * FROM pedidos WHERE id = ?", pedidoId));
        p.put("items", jdbc.queryForList("SELECT * FROM pedido_items WHERE pedido_id = ? ORDER BY id ASC", pedidoId));
        return p;
    }

    private String str(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private BigDecimal dec(Object o) {
        try { return o == null || str(o).isEmpty() ? null : new BigDecimal(str(o)); } catch (Exception e) { return null; }
    }
    private Long longVal(Object o) {
        try { return o == null ? null : Long.parseLong(str(o)); } catch (Exception e) { return null; }
    }
    private int intVal(Object o, int def) {
        try { return o == null ? def : Integer.parseInt(str(o)); } catch (Exception e) { return def; }
    }
}
