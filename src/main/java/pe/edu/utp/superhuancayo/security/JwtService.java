package pe.edu.utp.superhuancayo.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private final byte[] secretBytes;
    private final long expirationMs;
    private final ObjectMapper mapper = new ObjectMapper();

    public JwtService(
            @Value("${app.jwt.secret:CambiaEstaClaveSecretaDeMinimo32Caracteres2026}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long id, String username, String nombre, String rol) {
        try {
            long now = System.currentTimeMillis();
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", id);
            payload.put("username", username);
            payload.put("nombre", nombre);
            payload.put("rol", rol);
            payload.put("iat", now / 1000);
            payload.put("exp", (now + expirationMs) / 1000);

            Base64.Encoder urlEnc = Base64.getUrlEncoder().withoutPadding();
            String hB64 = urlEnc.encodeToString(mapper.writeValueAsBytes(header));
            String pB64 = urlEnc.encodeToString(mapper.writeValueAsBytes(payload));
            String signingInput = hB64 + "." + pB64;
            String sigB64 = urlEnc.encodeToString(hmacSha256(signingInput));
            return signingInput + "." + sigB64;
        } catch (Exception e) {
            throw new IllegalStateException("Error generando token JWT", e);
        }
    }

    public Map<String, Object> verifyAndParse(String token) {
        if (token == null || token.isBlank()) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 3) return null;
        try {
            String signingInput = parts[0] + "." + parts[1];
            byte[] expected = hmacSha256(signingInput);
            byte[] actual = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) {
                return null;
            }
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> claims = mapper.readValue(payloadBytes, new TypeReference<Map<String, Object>>() {});
            Object expObj = claims.get("exp");
            if (expObj instanceof Number n) {
                if (System.currentTimeMillis() / 1000 > n.longValue()) {
                    return null;
                }
            }
            return claims;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] hmacSha256(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }
}
