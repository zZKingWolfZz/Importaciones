package pe.edu.utp.superhuancayo.repository;

import pe.edu.utp.superhuancayo.model.Empleado;
import java.util.List;
import java.util.Optional;

public interface EmpleadoRepository {
    List<Empleado> findAll();
    Optional<Empleado> findById(Long id);
    Optional<Empleado> findByDni(String dni);
    Empleado save(Empleado empleado);
    boolean deleteById(Long id);
    boolean existsByDni(String dni);
    long count();
    List<Empleado> resetDefaults();
}
