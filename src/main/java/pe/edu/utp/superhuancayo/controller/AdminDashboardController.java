package pe.edu.utp.superhuancayo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.service.AuditService;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminDashboardController {

    private final JdbcTemplate jdbc;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminDashboardController(JdbcTemplate jdbc, AuditService auditService) {
        this.jdbc = jdbc;
        this.auditService = auditService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> resumen() {
        BigDecimal ingresosTotales = jdbc.queryForObject(
                "SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado <> 'CANCELADO'", BigDecimal.class
        );
        BigDecimal ingresosUltimos7 = jdbc.queryForObject(
                "SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado <> 'CANCELADO' AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'",
                BigDecimal.class
        );
        Integer totalPedidos = jdbc.queryForObject("SELECT count(*) FROM pedidos", Integer.class);
        Integer pedidosPendientes = jdbc.queryForObject(
                "SELECT count(*) FROM pedidos WHERE estado IN ('PENDIENTE','CONFIRMADO','PREPARANDO')", Integer.class
        );
        Integer totalProductos = jdbc.queryForObject("SELECT count(*) FROM productos WHERE activo = TRUE", Integer.class);
        Integer stockBajo = jdbc.queryForObject("SELECT count(*) FROM productos WHERE activo = TRUE AND stock <= stock_minimo", Integer.class);
        Integer consultasNuevas = jdbc.queryForObject("SELECT count(*) FROM contactos WHERE estado = 'NUEVO'", Integer.class);
        Integer reclamosAbiertos = jdbc.queryForObject("SELECT count(*) FROM reclamos WHERE estado <> 'RESUELTO'", Integer.class);
        Integer totalEmpleados = jdbc.queryForObject("SELECT count(*) FROM empleados", Integer.class);

        List<Map<String, Object>> pedidosPorEstado = jdbc.queryForList(
                "SELECT estado, count(*) AS cantidad, COALESCE(SUM(total), 0) AS monto FROM pedidos GROUP BY estado ORDER BY cantidad DESC"
        );
        List<Map<String, Object>> ventasPorDia = jdbc.queryForList(
                "SELECT TO_CHAR(created_at::date, 'DD/MM') AS dia, created_at::date AS fecha, COALESCE(SUM(total), 0) AS total, count(*) AS pedidos FROM pedidos WHERE estado <> 'CANCELADO' AND created_at >= CURRENT_DATE - INTERVAL '14 days' GROUP BY created_at::date ORDER BY created_at::date ASC"
        );
        List<Map<String, Object>> ingresosPorCategoria = jdbc.queryForList(
                "SELECT pr.categoria, COALESCE(SUM(pi.subtotal), 0) AS total FROM pedido_items pi JOIN productos pr ON pi.producto_id = pr.id JOIN pedidos pe ON pi.pedido_id = pe.id WHERE pe.estado <> 'CANCELADO' GROUP BY pr.categoria ORDER BY total DESC"
        );

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ingresosTotales", ingresosTotales);
        out.put("ingresosUltimos7Dias", ingresosUltimos7);
        out.put("totalPedidos", totalPedidos);
        out.put("pedidosPendientes", pedidosPendientes);
        out.put("totalProductos", totalProductos);
        out.put("productosStockBajo", stockBajo);
        out.put("consultasNuevas", consultasNuevas);
        out.put("reclamosAbiertos", reclamosAbiertos);
        out.put("totalEmpleados", totalEmpleados);
        out.put("pedidosPorEstado", pedidosPorEstado);
        out.put("ventasPorDia", ventasPorDia);
        out.put("ingresosPorCategoria", ingresosPorCategoria);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, Object>>> listarUsuarios() {
        return ResponseEntity.ok(jdbc.queryForList(
                "SELECT id, username, email, nombre, dni, telefono, rol, activo, created_at FROM usuarios ORDER BY id ASC"
        ));
    }

    @PostMapping("/usuarios")
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        String username = str(body.get("username")).toLowerCase().replaceAll("\\s+", "");
        String email = str(body.get("email")).toLowerCase();
        String password = str(body.get("password"));
        String nombre = str(body.get("nombre"));
        String rol = str(body.get("rol")).toUpperCase();
        String dni = str(body.get("dni"));
        String telefono = str(body.get("telefono"));

        if (username.length() < 3 || email.isBlank() || password.length() < 6 || nombre.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Complete usuario, correo, nombre y contraseña (mín. 6 caracteres)."));
        }
        if (!List.of("ADMIN", "VENDEDOR", "CLIENTE").contains(rol)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rol inválido. Use ADMIN, VENDEDOR o CLIENTE."));
        }
        Integer dup = jdbc.queryForObject("SELECT count(*) FROM usuarios WHERE LOWER(username)=? OR LOWER(email)=?", Integer.class, username, email);
        if (dup != null && dup > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Usuario o correo ya existente."));
        }

        Long id = jdbc.queryForObject(
                "INSERT INTO usuarios (username, email, password_hash, nombre, dni, telefono, rol) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
                Long.class, username, email, passwordEncoder.encode(password), nombre, dni.isBlank() ? null : dni, telefono.isBlank() ? null : telefono, rol
        );
        auditService.logFromRequest(req, "CREAR_USUARIO", "USUARIOS", "Usuario " + username + " con rol " + rol);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "id", id, "mensaje", "Usuario creado con rol " + rol));
    }

    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> cambiarRol(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        String rol = str(body.get("rol")).toUpperCase();
        if (!List.of("ADMIN", "VENDEDOR", "CLIENTE").contains(rol)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rol inválido."));
        }
        int upd = jdbc.update("UPDATE usuarios SET rol = ? WHERE id = ?", rol, id);
        if (upd == 0) return ResponseEntity.notFound().build();
        auditService.logFromRequest(req, "CAMBIAR_ROL", "USUARIOS", "Usuario #" + id + " -> " + rol);
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Rol actualizado a " + rol));
    }

    @DeleteMapping("/usuarios/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, HttpServletRequest req) {
        if (req.getAttribute("authUser") instanceof Map<?, ?> claims) {
            Long myId = ((Number) claims.get("id")).longValue();
            if (myId.equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "No puede eliminar su propia sesión de administrador."));
            }
        }
        int del = jdbc.update("DELETE FROM usuarios WHERE id = ?", id);
        if (del == 0) return ResponseEntity.notFound().build();
        auditService.logFromRequest(req, "ELIMINAR_USUARIO", "USUARIOS", "Usuario #" + id + " eliminado");
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Usuario eliminado correctamente."));
    }

    @GetMapping("/auditoria")
    public ResponseEntity<List<Map<String, Object>>> listarAuditoria() {
        return ResponseEntity.ok(jdbc.queryForList("SELECT * FROM auditoria ORDER BY created_at DESC LIMIT 120"));
    }

    private String str(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
}
