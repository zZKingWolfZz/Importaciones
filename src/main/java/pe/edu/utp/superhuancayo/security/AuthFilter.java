package pe.edu.utp.superhuancayo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class AuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public AuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String path = req.getRequestURI();
        String method = req.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method) || !path.startsWith("/api/")) {
            chain.doFilter(req, res);
            return;
        }

        String authHeader = req.getHeader("Authorization");
        Map<String, Object> claims = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            claims = jwtService.verifyAndParse(authHeader.substring(7).trim());
        }
        if (claims != null) {
            req.setAttribute("authUser", claims);
        }

        // Rutas públicas explícitas
        if (isPublicEndpoint(path, method)) {
            chain.doFilter(req, res);
            return;
        }

        // A partir de aquí, todo /api/* requiere JWT válido
        if (claims == null) {
            sendJsonError(res, HttpServletResponse.SC_UNAUTHORIZED,
                    "Acceso no autorizado. Inicie sesión con una cuenta autorizada.");
            return;
        }

        String rol = String.valueOf(claims.getOrDefault("rol", "")).toUpperCase();

        // Rutas exclusivas ADMIN
        if (path.startsWith("/api/admin/usuarios") || path.startsWith("/api/admin/auditoria")
                || (path.startsWith("/api/productos") && "DELETE".equalsIgnoreCase(method))) {
            if (!"ADMIN".equals(rol)) {
                sendJsonError(res, HttpServletResponse.SC_FORBIDDEN,
                        "Acceso denegado: esta acción requiere rol de Administrador.");
                return;
            }
        }

        // Rutas operativas Backoffice (ADMIN o VENDEDOR)
        if (path.startsWith("/api/admin/")
                || path.startsWith("/api/empleados")
                || (path.startsWith("/api/productos") && !"GET".equalsIgnoreCase(method))
                || (path.startsWith("/api/contactos") && !"POST".equalsIgnoreCase(method))
                || (path.startsWith("/api/reclamos") && !"POST".equalsIgnoreCase(method))) {
            if (!"ADMIN".equals(rol) && !"VENDEDOR".equals(rol)) {
                sendJsonError(res, HttpServletResponse.SC_FORBIDDEN,
                        "Acceso denegado: se requiere rol ADMIN o VENDEDOR.");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private boolean isPublicEndpoint(String path, String method) {
        if ("GET".equalsIgnoreCase(method) && "/api/health".equals(path)) return true;
        if ("POST".equalsIgnoreCase(method) && ("/api/auth/login".equals(path) || "/api/auth/register".equals(path))) return true;
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/productos")) return true;
        if ("POST".equalsIgnoreCase(method) && "/api/cupones/validar".equals(path)) return true;
        if ("POST".equalsIgnoreCase(method) && "/api/pedidos".equals(path)) return true;
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/pedidos/seguimiento/")) return true;
        if ("POST".equalsIgnoreCase(method) && ("/api/contactos".equals(path) || "/api/reclamos".equals(path))) return true;
        return false;
    }

    private void sendJsonError(HttpServletResponse res, int status, String msg) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        String escaped = msg.replace("\"", "\\\"");
        res.getWriter().write("{\"error\":\"" + escaped + "\"}");
    }
}
