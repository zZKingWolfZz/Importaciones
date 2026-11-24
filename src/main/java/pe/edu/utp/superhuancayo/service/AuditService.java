package pe.edu.utp.superhuancayo.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuditService {

    private final JdbcTemplate jdbc;

    public AuditService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void log(HttpServletRequest req, String usuario, String rol, String accion, String entidad, String detalle) {
        try {
            String ip = "unknown";
            if (req != null) {
                String xff = req.getHeader("X-Forwarded-For");
                ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
            }
            jdbc.update(
                    "INSERT INTO auditoria (usuario, rol, accion, entidad, detalle, ip) VALUES (?, ?, ?, ?, ?, ?)",
                    usuario != null ? usuario : "anonimo",
                    rol != null ? rol : "PUBLICO",
                    accion,
                    entidad,
                    detalle,
                    ip
            );
        } catch (Exception e) {
            // No interrumpir operación principal si falla auditoría
        }
    }

    @SuppressWarnings("unchecked")
    public void logFromRequest(HttpServletRequest req, String accion, String entidad, String detalle) {
        String usuario = "sistema";
        String rol = "SISTEMA";
        if (req != null && req.getAttribute("authUser") instanceof Map<?, ?> map) {
            usuario = String.valueOf(map.get("username"));
            rol = String.valueOf(map.get("rol"));
        }
        log(req, usuario, rol, accion, entidad, detalle);
    }
}
