package pe.edu.utp.superhuancayo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SuperHuancayoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SuperHuancayoApplication.class, args);
        System.out.println("==================================================================");
        System.out.println("🚀 IMPORTACIONES SUPER HUANCAYO - SPRING BOOT APPLICATION INICIADA");
        System.out.println("🌐 URL Web: http://localhost:8080/");
        System.out.println("📊 Dashboard: http://localhost:8080/dashboard.html");
        System.out.println("⚡ REST API: http://localhost:8080/api/empleados");
        System.out.println("==================================================================");
    }
}
