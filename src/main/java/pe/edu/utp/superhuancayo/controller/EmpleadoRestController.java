package pe.edu.utp.superhuancayo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.superhuancayo.model.Empleado;
import pe.edu.utp.superhuancayo.service.EmpleadoService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/empleados")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EmpleadoRestController {

    private final EmpleadoService empleadoService;

    public EmpleadoRestController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    @GetMapping
    public ResponseEntity<List<Empleado>> listarTodos() {
        return ResponseEntity.ok(empleadoService.listarTodos());
    }

    @GetMapping({"/stats", "/estadisticas"})
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        return ResponseEntity.ok(empleadoService.obtenerEstadisticasDashboard());
    }

    @PostMapping("/restablecer")
    public ResponseEntity<Map<String, Object>> restablecerPorDefecto() {
        List<Empleado> empleados = empleadoService.restablecerPorDefecto();
        Map<String, Object> resp = new HashMap<>();
        resp.put("mensaje", "Datos iniciales restablecidos correctamente");
        resp.put("empleados", empleados);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return empleadoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> registrar(@Valid @RequestBody Empleado empleado) {
        try {
            empleado.setId(null);
            Empleado creado = empleadoService.registrar(empleado);
            Map<String, Object> resp = new HashMap<>();
            resp.put("mensaje", "Empleado registrado exitosamente");
            resp.put("empleado", creado);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody Empleado empleado) {
        try {
            Empleado actualizado = empleadoService.actualizar(id, empleado);
            Map<String, Object> resp = new HashMap<>();
            resp.put("mensaje", "Empleado actualizado exitosamente");
            resp.put("empleado", actualizado);
            return ResponseEntity.ok(resp);
        } catch (NoSuchElementException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        boolean eliminado = empleadoService.eliminar(id);
        if (eliminado) {
            Map<String, String> resp = new HashMap<>();
            resp.put("mensaje", "Empleado eliminado correctamente");
            return ResponseEntity.ok(resp);
        }
        Map<String, String> err = new HashMap<>();
        err.put("error", "No se encontró el empleado con ID: " + id);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }
}
