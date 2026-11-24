package pe.edu.utp.superhuancayo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.service.AuditService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ContactoReclamoController {

    private final JdbcTemplate jdbc;
    private final AuditService auditService;

    public ContactoReclamoController(JdbcTemplate jdbc, AuditService auditService) {
        this.jdbc = jdbc;
        this.auditService = auditService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Integer prodCount = jdbc.queryForObject("SELECT count(*) FROM productos WHERE activo = TRUE", Integer.class);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "UP");
        resp.put("db", "PostgreSQL");
        resp.put("productosActivos", prodCount);
        resp.put("service", "Importaciones Super Huancayo API Comercial");
        resp.put("sede", "Av. Giraldez N.º 442, Huancayo");
        resp.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/contactos")
    public ResponseEntity<List<Map<String, Object>>> listarContactos() {
        return ResponseEntity.ok(jdbc.queryForList("SELECT * FROM contactos ORDER BY created_at DESC"));
    }

    @PostMapping("/contactos")
    public ResponseEntity<?> registrarContacto(@RequestBody Map<String, Object> payload) {
        String nombre = str(payload.get("nombre"));
        String telefono = str(payload.get("telefono")).replaceAll("[^0-9]", "");
        String correo = str(payload.get("correo"));
        String producto = str(payload.get("producto"));
        String mensaje = str(payload.get("mensaje"));

        if (nombre.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre completo es obligatorio."));
        }
        if (!telefono.matches("^[0-9]{9}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El número de celular debe tener exactamente 9 dígitos."));
        }
        if (mensaje.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El mensaje o detalle de consulta es obligatorio."));
        }

        String codigo = "COT-" + String.format("%06d", 100000 + new Random().nextInt(899999));
        jdbc.update(
                "INSERT INTO contactos (codigo, nombre, telefono, correo, producto, mensaje, estado) VALUES (?, ?, ?, ?, ?, ?, 'NUEVO')",
                codigo, nombre, telefono, correo.isBlank() ? null : correo,
                producto.isBlank() ? "Consulta general" : producto, mensaje
        );

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("codigo", codigo);
        resp.put("mensaje", "Consulta registrada con éxito.");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PutMapping("/contactos/{id}/estado")
    public ResponseEntity<?> actualizarContacto(@PathVariable Long id, @RequestBody Map<String, Object> payload, HttpServletRequest req) {
        String estado = str(payload.get("estado")).toUpperCase();
        String respuesta = str(payload.get("respuesta_admin"));
        if (estado.isBlank()) estado = "ATENDIDO";
        int upd = jdbc.update("UPDATE contactos SET estado = ?, respuesta_admin = ? WHERE id = ?", estado, respuesta, id);
        if (upd == 0) return ResponseEntity.notFound().build();
        auditService.logFromRequest(req, "ATENDER_CONSULTA", "CONTACTOS", "Consulta #" + id + " marcada como " + estado);
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Consulta actualizada a " + estado));
    }

    @GetMapping("/reclamos")
    public ResponseEntity<List<Map<String, Object>>> listarReclamos() {
        return ResponseEntity.ok(jdbc.queryForList("SELECT * FROM reclamos ORDER BY created_at DESC"));
    }

    @PostMapping("/reclamos")
    public ResponseEntity<?> registrarReclamo(@RequestBody Map<String, Object> payload) {
        String nombre = str(payload.get("nombre"));
        String dni = str(payload.get("dni")).replaceAll("[^0-9]", "");
        String telefono = str(payload.get("telefono")).replaceAll("[^0-9]", "");
        String correo = str(payload.get("correo"));
        String tipo = str(payload.get("tipo"));
        String detalle = str(payload.get("detalle"));

        if (nombre.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Los nombres y apellidos son obligatorios."));
        }
        if (!dni.matches("^[0-9]{8}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El DNI debe contener exactamente 8 dígitos numéricos."));
        }
        if (telefono.length() < 9) {
            return ResponseEntity.badRequest().body(Map.of("error", "El teléfono de contacto debe tener al menos 9 dígitos."));
        }
        if (correo.isBlank() || !correo.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese un correo electrónico válido."));
        }
        if (detalle.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debe detallar los hechos de la reclamación o queja."));
        }

        String codigo = "R-2026-" + String.format("%06d", 100000 + new Random().nextInt(899999));
        jdbc.update(
                "INSERT INTO reclamos (codigo, nombre, dni, telefono, correo, tipo, detalle, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'REGISTRADO')",
                codigo, nombre, dni, telefono, correo, tipo.isBlank() ? "Reclamo" : tipo, detalle
        );

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("codigo", codigo);
        resp.put("mensaje", "Hoja de Reclamación registrada conforme a normativa INDECOPI.");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PutMapping("/reclamos/{id}/estado")
    public ResponseEntity<?> actualizarReclamo(@PathVariable Long id, @RequestBody Map<String, Object> payload, HttpServletRequest req) {
        String estado = str(payload.get("estado")).toUpperCase();
        String respuesta = str(payload.get("respuesta_admin"));
        if (estado.isBlank()) estado = "RESUELTO";
        int upd = jdbc.update("UPDATE reclamos SET estado = ?, respuesta_admin = ? WHERE id = ?", estado, respuesta, id);
        if (upd == 0) return ResponseEntity.notFound().build();
        auditService.logFromRequest(req, "RESOLVER_RECLAMO", "RECLAMOS", "Reclamo #" + id + " actualizado a " + estado);
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Reclamo actualizado a " + estado));
    }

    private String str(Object val) {
        return val == null ? "" : String.valueOf(val).trim();
    }
}
