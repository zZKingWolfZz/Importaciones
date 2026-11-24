package pe.edu.utp.superhuancayo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebViewController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/dashboard.html";
    }

    @GetMapping("/catalogo")
    public String catalogo() {
        return "forward:/catalogo.html";
    }

    @GetMapping("/checkout")
    public String checkout() {
        return "forward:/checkout.html";
    }

    @GetMapping("/seguimiento")
    public String seguimiento() {
        return "forward:/seguimiento.html";
    }

    @GetMapping("/nosotros")
    public String nosotros() {
        return "forward:/nosotros.html";
    }

    @GetMapping("/contacto")
    public String contacto() {
        return "forward:/contacto.html";
    }

    @GetMapping("/legal")
    public String legal() {
        return "forward:/legal.html";
    }
}
