# Importaciones Super Huancayo — Proyecto Final

**Asignatura:** Hojas de Estilo en Cascada Avanzada (2025-1)  
**Docente:** Ing. María Soledad Torres Chuco  
**Estudiantes:** Arniel Paul Salazar Campos (U23216068) • Erick Dario Orellana Romero (U23216011)  
**Negocio:** Importaciones Super Huancayo S.A.C. (Av. Giráldez N.º 442, Huancayo, Junín — RUC 20608945123)  
**Sitio en producción (VPS + Spring Boot 3 + PostgreSQL):** https://155.181.40.152.sslip.io/

---

## 1. Alineación Técnica al Sílabo (Unidades 1–4)

- **Unidad 1 — HTML5 Semántico, Grid Layout, Flexbox y Diseño Responsivo:**  
  Estructura semántica completa (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`) combinando **CSS Grid Layout** (`.super-product-bottom`, `.legal__grid`, grillas responsivas en `scss/layout/_grid.scss`) y **Flexbox** (`_header.scss`, `_navigation.scss`, tarjetas y barra de acciones), adaptada a escritorio, tablet y móvil mediante media queries (`@include respond-to(...)`, `@include responsive-max(...)`).
- **Unidad 2 — Preprocesadores CSS (SASS y LESS):**  
  - **SASS modular (26 archivos `.scss` en `scss/`):** Arquitectura 7-1 organizada en `abstracts/` (`_variables.scss`, `_funciones.scss`, `_mixins.scss`), `base/` (`_reset.scss`, `_typography.scss`, `_utilities.scss`), `layout/` (`_header.scss`, `_navigation.scss`, `_grid.scss`, `_footer.scss`), `components/` (`_badges.scss`, `_buttons.scss`, `_cards.scss`, `_flipcard.scss`, `_floating.scss`, `_forms.scss`, `_unified-theme.scss`) y `pages/` (`_home.scss`, `_catalogo.scss`, `_nosotros.scss`, `_contacto.scss`, `_legal.scss`, `_dashboard.scss`).  
    Puntos de entrada compilados:
    - `scss/main.scss` -> `css/main.css`
    - `scss/unified-theme.scss` -> `css/unified-theme.css`
    - `scss/dashboard.scss` -> `css/dashboard.css`
  - **LESS:** Fuente `less/estilos.less` compilada en `css/estilos-less.css`.
- **Unidad 3 — Animaciones, Transiciones y Transformaciones CSS:**  
  Implementación de `@keyframes` (`fadeInDown`, `slideInUp`, `pulso`, `flotar`), animaciones de entrada en hero y tarjetas laterales (`.super-hero-main`, `.super-hero-side-card`, `.super-delay-1`, `.super-delay-2`, `.super-promo-strip`), pulso en el CTA principal (`.super-cta-pulso`) y botón flotante de WhatsApp (`.wsp-flotante`), zoom y elevación en tarjetas de categorías y productos (`.super-cat-vertical-card`, `.super-product-card`), flipcards 3D en Nosotros (`_flipcard.scss`) y soporte de accesibilidad `@media (prefers-reduced-motion: reduce)`.
- **Unidad 4 — Integración con Framework CSS:**  
  Integración de **Bootstrap 5.3.3** (grilla responsiva, utilidades, offcanvas del carrito, modales, pestañas y formularios) extendida mediante variables `:root` corporativas y hojas compiladas desde SCSS.

---

## 2. Estructura Principal del Paquete

- `index.html`, `catalogo.html`, `checkout.html`, `seguimiento.html`, `nosotros.html`, `contacto.html`, `legal.html`, `dashboard.html`
- `scss/` (26 archivos `.scss` modulares y puntos de entrada)
- `less/estilos.less` y `css/estilos-less.css`
- `css/` (`main.css`, `unified-theme.css`, `dashboard.css`, `estilos-less.css`)
- `js/` (`catalogo-data.js`, `main.js`, `catalogo-falabella.js`, `checkout.js`, `dashboard.js`)
- `assets/img/` (`logo.png`, `logo-blanco.png`)

---

## 3. Cómo Abrir y Probar el Proyecto

### Opción A: Modo Estático / Offline (sin servidor backend)
La tienda cuenta con respaldo estático local en `js/catalogo-data.js` (`window.SUPER_CATALOGO_ESTATICO`, `window.SUPER_PEDIDOS_DEMO`, `window.SUPER_CUPONES_DEMO`, `localStorage`).

1. Descomprime el `.zip`.
2. Abre `index.html` directamente en tu navegador, **o** levanta un servidor estático local en la carpeta descomprimida:
   ```bash
   python -m http.server 8000
   ```
   y visita `http://localhost:8000/`.

### Opción B: Sitio Online en Producción (Spring Boot 3 + PostgreSQL)
Visita https://155.181.40.152.sslip.io/ (consume los endpoints reales `/api/productos`, `/api/cupones/validar`, `/api/pedidos`, `/api/contactos`, `/api/reclamos`).

---

## 4. Códigos de Prueba (Cupones y Seguimiento)

- **Cupones disponibles en Checkout (`checkout.html`):**
  - `SUPER40` — S/ 40.00 de descuento fijo (mínimo S/ 200.00)
  - `SUPER10` — 10% de descuento (mínimo S/ 50.00)
  - `ENVIOGRATIS` — Envío gratuito (mínimo S/ 100.00)
- **Códigos de Seguimiento de Demo (`seguimiento.html`):**
  - `PED-2026-100405`
  - `PED-2026-100404`
  *(Los pedidos generados durante tu sesión offline también quedan guardados en `localStorage` para rastrearlos de inmediato en `seguimiento.html`.)*

---

## 5. Recompilación de SASS / LESS

Con Python `libsass` (`pip install libsass`):
```python
import sass
sass.compile(filename='scss/main.scss', output_style='expanded')
sass.compile(filename='scss/unified-theme.scss', output_style='expanded')
sass.compile(filename='scss/dashboard.scss', output_style='expanded')
```
O con Sass CLI / Node (`sass scss/main.scss css/main.css` etc., y `lessc less/estilos.less css/estilos-less.css`).
