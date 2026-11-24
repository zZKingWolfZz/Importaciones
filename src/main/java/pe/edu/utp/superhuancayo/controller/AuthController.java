package pe.edu.utp.superhuancayo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.security.JwtService;
import pe.edu.utp.superhuancayo.security.LoginRateLimiter;
import pe.edu.utp.superhuancayo.service.AuditService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    private final JdbcTemplate jdbc;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(JdbcTemplate jdbc, JwtService jwtService, LoginRateLimiter rateLimiter, AuditService auditService) {
        this.jdbc = jdbc;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        String ip = extractIp(req);
        String username = str(body.get("username")).toLowerCase();
        String password = str(body.get("password"));

        if (rateLimiter.isBlocked(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Demasiados intentos fallidos. Intente nuevamente en 15 minutos."));
        }
        if (username.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario/correo y contraseña requeridos."));
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, username, email, password_hash, nombre, dni, telefono, direccion, rol, activo FROM usuarios WHERE LOWER(username) = ? OR LOWER(email) = ?",
                username, username
        );

        if (rows.isEmpty()) {
            rateLimiter.recordFailure(ip);
            auditService.log(req, username, "ANONIMO", "LOGIN_FALLIDO", "USUARIOS", "Usuario no encontrado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales inválidas."));
        }

        Map<String, Object> user = rows.get(0);
        if (!Boolean.TRUE.equals(user.get("activo"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cuenta desactivada por administración."));
        }

        String hash = str(user.get("password_hash"));
        if (!passwordEncoder.matches(password, hash)) {
            rateLimiter.recordFailure(ip);
            auditService.log(req, str(user.get("username")), str(user.get("rol")), "LOGIN_FALLIDO", "USUARIOS", "Contraseña incorrecta");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales inválidas."));
        }

        rateLimiter.clear(ip);
        Long id = ((Number) user.get("id")).longValue();
        String uName = str(user.get("username"));
        String nombre = str(user.get("nombre"));
        String rol = str(user.get("rol"));

        String token = jwtService.generateToken(id, uName, nombre, rol);
        auditService.log(req, uName, rol, "LOGIN_EXITOSO", "USUARIOS", "Inicio de sesión en Importaciones Super");

        Map<String, Object> safeUser = new LinkedHashMap<>();
        safeUser.put("id", id);
        safeUser.put("username", uName);
        safeUser.put("email", user.get("email"));
        safeUser.put("nombre", nombre);
        safeUser.put("dni", user.get("dni"));
        safeUser.put("telefono", user.get("telefono"));
        safeUser.put("direccion", user.get("direccion"));
        safeUser.put("rol", rol);

        return ResponseEntity.ok(Map.of(
                "mensaje", "Autenticación exitosa",
                "token", token,
                "usuario", safeUser
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        String username = str(body.get("username")).toLowerCase().replaceAll("\\s+", "");
        String email = str(body.get("email")).toLowerCase();
        String password = str(body.get("password"));
        String nombre = str(body.get("nombre"));
        String dni = str(body.get("dni")).replaceAll("[^0-9]", "");
        String telefono = str(body.get("telefono")).replaceAll("[^0-9]", "");
        String direccion = str(body.get("direccion"));

        if (username.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "El usuario debe tener al menos 3 caracteres."));
        }
        if (email.isBlank() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese un correo electrónico válido."));
        }
        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 6 caracteres."));
        }
        if (nombre.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingrese su nombre completo."));
        }

        Integer dup = jdbc.queryForObject(
                "SELECT count(*) FROM usuarios WHERE LOWER(username) = ? OR LOWER(email) = ?",
                Integer.class, username, email
        );
        if (dup != null && dup > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El nombre de usuario o correo ya está registrado."));
        }

        String hash = passwordEncoder.encode(password);
        Long newId = jdbc.queryForObject(
                "INSERT INTO usuarios (username, email, password_hash, nombre, dni, telefono, direccion, rol) VALUES (?, ?, ?, ?, ?, ?, ?, 'CLIENTE') RETURNING id",
                Long.class, username, email, hash, nombre, dni.isBlank() ? null : dni, telefono.isBlank() ? null : telefono, direccion.isBlank() ? null : direccion
        );

        String token = jwtService.generateToken(newId, username, nombre, "CLIENTE");
        auditService.log(req, username, "CLIENTE", "REGISTRO_CLIENTE", "USUARIOS", "Registro de nueva cuenta cliente: " + email);

        Map<String, Object> safeUser = new LinkedHashMap<>();
        safeUser.put("id", newId);
        safeUser.put("username", username);
        safeUser.put("email", email);
        safeUser.put("nombre", nombre);
        safeUser.put("dni", dni);
        safeUser.put("telefono", telefono);
        safeUser.put("direccion", direccion);
        safeUser.put("rol", "CLIENTE");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Cuenta creada exitosamente",
                "token", token,
                "usuario", safeUser
        ));
    }

    @GetMapping("/me")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> me(HttpServletRequest req) {
        Map<String, Object> claims = (Map<String, Object>) req.getAttribute("authUser");
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autenticado"));
        }
        Long id = ((Number) claims.get("id")).longValue();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, username, email, nombre, dni, telefono, direccion, rol, activo, created_at FROM usuarios WHERE id = ?",
                id
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }
        return ResponseEntity.ok(Map.of("usuario", rows.get(0)));
    }

    @PutMapping("/password")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        Map<String, Object> claims = (Map<String, Object>) req.getAttribute("authUser");
        if (claims == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autenticado"));

        String actual = str(body.get("passwordActual"));
        String nueva = str(body.get("passwordNueva"));
        if (actual.isBlank() || nueva.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña debe tener al menos 6 caracteres."));
        }

        Long id = ((Number) claims.get("id")).longValue();
        Map<String, Object> u = jdbc.queryForMap("SELECT username, rol, password_hash FROM usuarios WHERE id = ?", id);
        if (!passwordEncoder.matches(actual, str(u.get("password_hash")))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "La contraseña actual es incorrecta."));
        }

        jdbc.update("UPDATE usuarios SET password_hash = ? WHERE id = ?", passwordEncoder.encode(nueva), id);
        auditService.log(req, str(u.get("username")), str(u.get("rol")), "CAMBIO_PASSWORD", "USUARIOS", "Actualizó su contraseña");
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Contraseña actualizada correctamente."));
    }

    private String str(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    private String extractIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
