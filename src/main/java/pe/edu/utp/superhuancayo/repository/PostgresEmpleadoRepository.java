package pe.edu.utp.superhuancayo.repository;

import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pe.edu.utp.superhuancayo.model.Empleado;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class PostgresEmpleadoRepository implements EmpleadoRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Empleado> MAPPER = (rs, rowNum) -> {
        Empleado e = new Empleado();
        e.setId(rs.getLong("id"));
        e.setDni(rs.getString("dni"));
        e.setApellidos(rs.getString("apellidos"));
        e.setNombres(rs.getString("nombres"));
        e.setTelefono(rs.getString("telefono"));
        e.setCorreo(rs.getString("correo"));
        e.setDireccion(rs.getString("direccion"));
        e.setEspecialidad(rs.getString("especialidad"));
        e.setFechaRegistro(rs.getString("fecha_registro"));
        e.setActivo(rs.getBoolean("activo"));
        return e;
    };

    public PostgresEmpleadoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Empleado> findAll() {
        return jdbc.query("SELECT * FROM empleados ORDER BY id ASC", MAPPER);
    }

    @Override
    public Optional<Empleado> findById(Long id) {
        List<Empleado> list = jdbc.query("SELECT * FROM empleados WHERE id = ?", MAPPER, id);
        return list.stream().findFirst();
    }

    @Override
    public Optional<Empleado> findByDni(String dni) {
        List<Empleado> list = jdbc.query("SELECT * FROM empleados WHERE dni = ?", MAPPER, dni);
        return list.stream().findFirst();
    }

    @Override
    public Empleado save(Empleado empleado) {
        if (empleado.getFechaRegistro() == null || empleado.getFechaRegistro().isBlank()) {
            empleado.setFechaRegistro(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (empleado.getId() == null) {
            Long id = jdbc.queryForObject(
                    "INSERT INTO empleados (dni, apellidos, nombres, telefono, correo, direccion, especialidad, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                    Long.class,
                    empleado.getDni(), empleado.getApellidos(), empleado.getNombres(), empleado.getTelefono(),
                    empleado.getCorreo(), empleado.getDireccion(), empleado.getEspecialidad(),
                    empleado.getFechaRegistro(), empleado.isActivo()
            );
            empleado.setId(id);
        } else {
            jdbc.update(
                    "UPDATE empleados SET dni = ?, apellidos = ?, nombres = ?, telefono = ?, correo = ?, direccion = ?, especialidad = ?, activo = ? WHERE id = ?",
                    empleado.getDni(), empleado.getApellidos(), empleado.getNombres(), empleado.getTelefono(),
                    empleado.getCorreo(), empleado.getDireccion(), empleado.getEspecialidad(),
                    empleado.isActivo(), empleado.getId()
            );
        }
        return empleado;
    }

    @Override
    public boolean deleteById(Long id) {
        return jdbc.update("DELETE FROM empleados WHERE id = ?", id) > 0;
    }

    @Override
    public boolean existsByDni(String dni) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM empleados WHERE dni = ?", Integer.class, dni);
        return count != null && count > 0;
    }

    @Override
    public long count() {
        Long count = jdbc.queryForObject("SELECT count(*) FROM empleados", Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public List<Empleado> resetDefaults() {
        jdbc.update("DELETE FROM empleados");
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        save(new Empleado(null, "45215847", "Carhuamaca Salinas", "Annie Fiorella", "987654147", "carmencita@hotmail.com", "Av. Wilson 123, Huancayo", "Telecomunicaciones"));
        save(new Empleado(null, "54145784", "Chávez Cavero", "Noldia", "963254789", "chavez@utp.edu.pe", "Av. Lima 123, El Tambo", "Software"));
        save(new Empleado(null, "09876789", "Carmona Solís", "Carlos Felipe", "989878989", "carlos@utp.edu.pe", "Jr. Lima 1234, Huancayo", "Telecomunicaciones"));
        save(new Empleado(null, "07654321", "Castillo Cajamalqui", "Pablo Alberto", "987654321", "pabloacr@utp.edu.pe", "Jr. Lima 123, Huancayo", "Sistemas e Informática"));
        save(new Empleado(null, "72849102", "Orellana & Arniel", "Soporte Técnico Huancayo", "952000000", "soporte@superimportacioneshuancayo.pe", "Av. Giraldez 442, Huancayo", "Sistemas e Informática"));
        return findAll();
    }
}
