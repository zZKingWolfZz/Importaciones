package pe.edu.utp.superhuancayo.security;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000L;
    private final ConcurrentHashMap<String, List<Long>> attempts = new ConcurrentHashMap<>();

    public synchronized boolean isBlocked(String key) {
        long now = System.currentTimeMillis();
        List<Long> list = attempts.get(key);
        if (list == null) return false;
        list.removeIf(t -> now - t > WINDOW_MS);
        return list.size() >= MAX_ATTEMPTS;
    }

    public synchronized void recordFailure(String key) {
        long now = System.currentTimeMillis();
        List<Long> list = attempts.computeIfAbsent(key, k -> new ArrayList<>());
        list.removeIf(t -> now - t > WINDOW_MS);
        list.add(now);
    }

    public synchronized void clear(String key) {
        attempts.remove(key);
    }
}
