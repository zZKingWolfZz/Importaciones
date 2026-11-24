package pe.edu.utp.superhuancayo.service;

import org.springframework.stereotype.Service;
import pe.edu.utp.superhuancayo.model.Empleado;
import pe.edu.utp.superhuancayo.repository.EmpleadoRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;

    public EmpleadoService(EmpleadoRepository empleadoRepository) {
        this.empleadoRepository = empleadoRepository;
    }

    public List<Empleado> listarTodos() {
        return empleadoRepository.findAll();
    }

    public Optional<Empleado> buscarPorId(Long id) {
        return empleadoRepository.findById(id);
    }

    public Optional<Empleado> buscarPorDni(String dni) {
        return empleadoRepository.findByDni(dni);
    }

    public Empleado registrar(Empleado empleado) {
        if (empleado.getId() == null && empleadoRepository.existsByDni(empleado.getDni())) {
            throw new IllegalArgumentException("Ya existe un empleado registrado con el DNI: " + empleado.getDni());
        }
        return empleadoRepository.save(empleado);
    }

    public Empleado actualizar(Long id, Empleado datosActualizados) {
        return empleadoRepository.findById(id).map(existente -> {
            if (!existente.getDni().equalsIgnoreCase(datosActualizados.getDni()) &&
                    empleadoRepository.existsByDni(datosActualizados.getDni())) {
                throw new IllegalArgumentException("El DNI " + datosActualizados.getDni() + " ya está en uso por otro empleado");
            }
            existente.setDni(datosActualizados.getDni());
            existente.setApellidos(datosActualizados.getApellidos());
            existente.setNombres(datosActualizados.getNombres());
            existente.setTelefono(datosActualizados.getTelefono());
            existente.setCorreo(datosActualizados.getCorreo());
            existente.setDireccion(datosActualizados.getDireccion());
            existente.setEspecialidad(datosActualizados.getEspecialidad());
            return empleadoRepository.save(existente);
        }).orElseThrow(() -> new NoSuchElementException("No se encontró el empleado con ID: " + id));
    }

    public boolean eliminar(Long id) {
        return empleadoRepository.deleteById(id);
    }

    public List<Empleado> restablecerPorDefecto() {
        return empleadoRepository.resetDefaults();
    }

    public Map<String, Object> obtenerEstadisticasDashboard() {
        List<Empleado> todos = empleadoRepository.findAll();
        long total = todos.size();

        Map<String, Long> porEspecialidad = todos.stream()
                .collect(Collectors.groupingBy(Empleado::getEspecialidad, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmpleados", total);
        stats.put("conteoEspecialidades", porEspecialidad);
        stats.put("totalEspecialidades", porEspecialidad.size());
        stats.put("sede", "Huancayo - Av. Giraldez 442");
        stats.put("estadoServidor", "ONLINE - Spring Boot 3");
        return stats;
    }
}
