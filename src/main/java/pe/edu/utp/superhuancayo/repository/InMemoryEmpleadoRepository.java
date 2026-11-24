package pe.edu.utp.superhuancayo.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import pe.edu.utp.superhuancayo.model.Empleado;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryEmpleadoRepository implements EmpleadoRepository {

    private final ConcurrentHashMap<Long, Empleado> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final File dataFile = new File("data/empleados_data.json");

    @PostConstruct
    public void initDefaultData() {
        if (!loadFromDisk() || store.isEmpty()) {
            seedDefaults();
            persistToDisk();
        }
    }

    private void seedDefaults() {
        store.clear();
        idSequence.set(1);
        putInternal(new Empleado(null, "45215847", "Carhuamaca Salinas", "Annie Fiorella", "987654147", "carmencita@hotmail.com", "Av. Wilson 123", "Telecomunicaciones"));
        putInternal(new Empleado(null, "54145784", "Chávez Cavero", "Noldia", "963254789", "chavez@utp.edu.pe", "Av. Lima 123", "Software"));
        putInternal(new Empleado(null, "09876789", "Carmona Solís", "Carlos Felipe", "989878989", "carlos@utp.edu.pe", "Jr. Lima 1234", "Telecomunicaciones"));
        putInternal(new Empleado(null, "07654321", "Castillo Cajamalqui", "Pablo Alberto", "987654321", "pabloacr@utp.edu.pe", "Jr. Lima 123", "Sistemas e Informática"));
        putInternal(new Empleado(null, "72849102", "Orellana & Arniel", "Soporte Técnico Huancayo", "952000000", "soporte@superimportacioneshuancayo.pe", "Av. Giraldez 442", "Sistemas e Informática"));
    }

    private Empleado putInternal(Empleado empleado) {
        if (empleado.getId() == null) {
            empleado.setId(idSequence.getAndIncrement());
        } else {
            idSequence.updateAndGet(cur -> Math.max(cur, empleado.getId() + 1));
        }
        store.put(empleado.getId(), empleado);
        return empleado;
    }

    private synchronized boolean loadFromDisk() {
        try {
            if (!dataFile.exists() || dataFile.length() == 0) {
                return false;
            }
            List<Empleado> list = objectMapper.readValue(dataFile, new TypeReference<List<Empleado>>() {});
            if (list == null) return false;
            store.clear();
            long maxId = 0;
            for (Empleado e : list) {
                if (e.getId() != null) {
                    maxId = Math.max(maxId, e.getId());
                }
                putInternal(e);
            }
            idSequence.set(maxId + 1);
            return true;
        } catch (Exception ex) {
            System.err.println("No se pudo cargar empleados_data.json: " + ex.getMessage());
            return false;
        }
    }

    private synchronized void persistToDisk() {
        try {
            File parent = dataFile.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            objectMapper.writeValue(dataFile, findAll());
        } catch (Exception ex) {
            System.err.println("No se pudo guardar empleados_data.json: " + ex.getMessage());
        }
    }

    @Override
    public List<Empleado> findAll() {
        List<Empleado> list = new ArrayList<>(store.values());
        list.sort(Comparator.comparing(e -> e.getId() == null ? 0L : e.getId()));
        return list;
    }

    @Override
    public Optional<Empleado> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<Empleado> findByDni(String dni) {
        return store.values().stream()
                .filter(e -> e.getDni().equalsIgnoreCase(dni))
                .findFirst();
    }

    @Override
    public Empleado save(Empleado empleado) {
        Empleado saved = putInternal(empleado);
        persistToDisk();
        return saved;
    }

    @Override
    public boolean deleteById(Long id) {
        boolean removed = store.remove(id) != null;
        if (removed) {
            persistToDisk();
        }
        return removed;
    }

    @Override
    public boolean existsByDni(String dni) {
        return store.values().stream().anyMatch(e -> e.getDni().equalsIgnoreCase(dni));
    }

    @Override
    public long count() {
        return store.size();
    }

    @Override
    public synchronized List<Empleado> resetDefaults() {
        seedDefaults();
        persistToDisk();
        return findAll();
    }
}
