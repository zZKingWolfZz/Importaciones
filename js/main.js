/**
 * ==============================================================================
 * IMPORTACIONES SUPER HUANCAYO - E-COMMERCE, AUTENTICACIÓN JWT, CARRITO Y FORMULARIOS
 * ==============================================================================
 */

(function () {
    const WHATSAPP_NUMBER = "51952000000";
    const CART_STORAGE_KEY = "super_huancayo_cart_v2";
    const TOKEN_KEY = "super_jwt_token";
    const USER_KEY = "super_auth_user";

    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function buildWhatsAppUrl(text) {
        return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
    }

    function getAuthToken() {
        return localStorage.getItem(TOKEN_KEY) || "";
    }

    function getAuthUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setAuthSession(token, user) {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(USER_KEY);
        renderUserMenu();
    }

    async function authFetch(url, options = {}) {
        const opts = { ...options, headers: { ...(options.headers || {}) } };
        const t = getAuthToken();
        if (t && !opts.headers["Authorization"]) {
            opts.headers["Authorization"] = "Bearer " + t;
        }
        if (!opts.headers["Content-Type"] && opts.body && typeof opts.body === "string") {
            opts.headers["Content-Type"] = "application/json";
        }
        const res = await fetch(url, opts);
        if (res.status === 401 && t) {
            setAuthSession("", null);
        }
        return res;
    }

    function getCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {}
        updateCartUI();
    }

    function addToCart(product) {
        const prodId = Number(product.id);
        const stock = Number(product.stock != null ? product.stock : 99);
        if (stock <= 0) {
            showSiteToast("Este producto está temporalmente agotado.", "danger");
            return;
        }
        const cart = getCart();
        const existing = cart.find(item => Number(item.id) === prodId);
        if (existing) {
            if (existing.qty >= stock) {
                showSiteToast(`Stock máximo disponible: ${stock} unidad(es).`, "info");
                return;
            }
            existing.qty += 1;
            existing.stock = stock;
        } else {
            cart.push({
                id: prodId,
                sku: product.sku || "",
                name: product.nombre || product.name,
                brand: product.marca || product.brand || "Super Tech",
                price: Number(product.precio != null ? product.precio : product.price),
                img: product.imagen_url || product.img || "assets/img/logo.png",
                stock,
                qty: 1
            });
        }
        saveCart(cart);
        showSiteToast(`"${product.nombre || product.name}" agregado al carrito`, "success");
    }

    function changeCartQty(id, delta) {
        const cart = getCart();
        const idx = cart.findIndex(item => String(item.id) === String(id));
        if (idx === -1) return;
        const nextQty = cart[idx].qty + delta;
        if (nextQty <= 0) {
            cart.splice(idx, 1);
        } else if (cart[idx].stock && nextQty > cart[idx].stock) {
            showSiteToast(`Stock disponible: ${cart[idx].stock}`, "info");
            return;
        } else {
            cart[idx].qty = nextQty;
        }
        saveCart(cart);
    }

    function removeFromCart(id) {
        saveCart(getCart().filter(item => String(item.id) !== String(id)));
    }

    function clearCart() {
        saveCart([]);
    }

    function showSiteToast(message, type = "success") {
        let container = document.getElementById("superSiteToastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "superSiteToastContainer";
            container.style.cssText = "position:fixed;bottom:92px;right:24px;z-index:1100;display:flex;flex-direction:column;gap:8px;max-width:340px;";
            document.body.appendChild(container);
        }
        const bg = type === "danger" ? "#dc3545" : (type === "info" ? "#0B3FC1" : "#0E7A3F");
        const toast = document.createElement("div");
        toast.style.cssText = `background:${bg};color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(8,29,90,0.22);transition:all 0.25s ease;opacity:0;transform:translateY(10px);`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    function injectSharedModals() {
        if (!document.getElementById("superCartDrawer")) {
            document.body.insertAdjacentHTML("beforeend", `
            <div class="offcanvas offcanvas-end" tabindex="-1" id="superCartDrawer" aria-labelledby="superCartDrawerLabel" style="width: 400px; max-width: 95vw; z-index: 1080;">
                <div class="offcanvas-header text-white" style="background: linear-gradient(135deg, #081D5A 0%, #0B3FC1 100%);">
                    <div>
                        <h5 class="offcanvas-title fw-bold mb-0" id="superCartDrawerLabel">Tu Carrito de Compras</h5>
                        <small style="color: rgba(255,255,255,0.82);">Av. Giraldez N.º 442 • Huancayo</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
                </div>
                <div class="offcanvas-body d-flex flex-column p-3">
                    <div id="superCartItems" class="flex-grow-1 overflow-auto mb-3"></div>
                    <div id="superCartSummary" class="border-top pt-3 d-none">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-semibold text-muted small">Subtotal (IGV incluido):</span>
                            <span id="superCartTotal" class="h5 fw-bold mb-0" style="color:#081D5A;">S/ 0.00</span>
                        </div>
                        <p class="text-muted mb-3" style="font-size:11px;">Envío express gratis en Huancayo por compras desde S/ 250.00. Aplica cupones en el checkout.</p>
                        <a href="checkout.html" id="btnIrCheckout" class="btn btn-primary w-100 fw-bold py-2 mb-2">
                            Finalizar Compra (Checkout) →
                        </a>
                        <div class="d-flex gap-2">
                            <a id="btnCartWhatsApp" href="#" target="_blank" rel="noopener" class="btn btn-outline-success btn-sm flex-grow-1 fw-semibold">
                                Consultar por WhatsApp
                            </a>
                            <button type="button" id="btnClearCart" class="btn btn-outline-danger btn-sm">
                                Vaciar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`);
        }

        if (!document.getElementById("superQuickViewModal")) {
            document.body.insertAdjacentHTML("beforeend", `
            <div class="modal fade" id="superQuickViewModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #081D5A 0%, #0B3FC1 100%);">
                            <h5 class="modal-title fw-bold" id="qvTitle">Detalle del Producto</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="row g-4 align-items-center">
                                <div class="col-md-5 text-center">
                                    <div class="bg-light rounded-4 p-3 position-relative">
                                        <span id="qvDiscount" class="badge bg-primary position-absolute top-0 start-0 m-2 fw-bold"></span>
                                        <img id="qvImg" src="assets/img/logo.png" alt="Producto" class="img-fluid rounded-3" style="max-height:240px;object-fit:contain;">
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <div class="d-flex align-items-center gap-2 mb-2">
                                        <span id="qvBrand" class="badge bg-primary-subtle text-primary fw-bold"></span>
                                        <span id="qvSku" class="badge bg-light text-secondary border font-monospace"></span>
                                    </div>
                                    <h4 id="qvName" class="fw-bold mb-2" style="color:#081D5A;"></h4>
                                    <p id="qvDesc" class="text-muted small mb-2"></p>
                                    <div id="qvSpecs" class="small fw-semibold text-primary bg-primary-subtle rounded-2 px-2 py-1 mb-3"></div>
                                    <div class="d-flex align-items-baseline gap-2 mb-3">
                                        <span id="qvPrice" class="h3 fw-bold mb-0" style="color:#0B3FC1;"></span>
                                        <span id="qvOldPrice" class="text-muted text-decoration-line-through small"></span>
                                        <span id="qvStockBadge" class="badge ms-auto"></span>
                                    </div>
                                    <ul class="list-unstyled small text-muted mb-4">
                                        <li class="mb-1">✓ Garantía escrita de 6 a 12 meses en Av. Giraldez N.º 442</li>
                                        <li class="mb-1">✓ Boleta o Factura Electrónica SUNAT (IGV incluido)</li>
                                        <li>✓ Retiro gratis en tienda o envío express en 180 minutos</li>
                                    </ul>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" id="qvAddCartBtn" class="btn btn-primary fw-bold px-4">
                                            Agregar al Carrito
                                        </button>
                                        <a id="qvWspBtn" href="#" target="_blank" rel="noopener" class="btn btn-outline-success fw-semibold">
                                            WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);
        }

        if (!document.getElementById("superAuthModal")) {
            document.body.insertAdjacentHTML("beforeend", `
            <div class="modal fade" id="superAuthModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #081D5A 0%, #0B3FC1 100%);">
                            <div>
                                <h5 class="modal-title fw-bold mb-0">Mi Cuenta • Importaciones Super</h5>
                                <small style="color:rgba(255,255,255,0.8);">Accede a tus pedidos, boletas y compras rápidas</small>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-4">
                            <ul class="nav nav-pills nav-fill mb-3 bg-light p-1 rounded-3">
                                <li class="nav-item">
                                    <button type="button" class="nav-link active fw-semibold" id="tabLoginPill">Iniciar Sesión</button>
                                </li>
                                <li class="nav-item">
                                    <button type="button" class="nav-link fw-semibold" id="tabRegisterPill">Crear Cuenta</button>
                                </li>
                            </ul>

                            <form id="superLoginForm">
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">Usuario o Correo Electrónico</label>
                                    <input type="text" id="authLoginUser" class="form-control" placeholder="Ej. cliente o correo@gmail.com" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">Contraseña</label>
                                    <input type="password" id="authLoginPass" class="form-control" placeholder="••••••••" required>
                                </div>
                                <div id="authLoginErr" class="alert alert-danger py-2 small d-none"></div>
                                <button type="submit" class="btn btn-primary w-100 fw-bold py-2">Ingresar</button>
                            </form>

                            <form id="superRegisterForm" class="d-none">
                                <div class="row g-2">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">Nombre Completo *</label>
                                        <input type="text" id="regNombre" class="form-control form-control-sm" required>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">Usuario *</label>
                                        <input type="text" id="regUsername" class="form-control form-control-sm" required>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">Correo Electrónico *</label>
                                        <input type="email" id="regEmail" class="form-control form-control-sm" required>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">Celular (9 dígitos)</label>
                                        <input type="tel" id="regTelefono" class="form-control form-control-sm" maxlength="9">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">DNI (8 dígitos)</label>
                                        <input type="text" id="regDni" class="form-control form-control-sm" maxlength="8">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small fw-semibold">Contraseña (mín. 6) *</label>
                                        <input type="password" id="regPassword" class="form-control form-control-sm" minlength="6" required>
                                    </div>
                                    <div class="col-12 mb-2">
                                        <label class="form-label small fw-semibold">Dirección en Huancayo</label>
                                        <input type="text" id="regDireccion" class="form-control form-control-sm">
                                    </div>
                                </div>
                                <div id="authRegErr" class="alert alert-danger py-2 small d-none mt-2"></div>
                                <button type="submit" class="btn btn-success w-100 fw-bold py-2 mt-2">Crear Cuenta de Cliente</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`);
        }

        if (!document.getElementById("superMyOrdersModal")) {
            document.body.insertAdjacentHTML("beforeend", `
            <div class="modal fade" id="superMyOrdersModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #081D5A 0%, #0B3FC1 100%);">
                            <h5 class="modal-title fw-bold">Mis Pedidos y Compras</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-4" id="superMyOrdersBody">
                            <div class="text-center py-4 text-muted">Cargando tus pedidos...</div>
                        </div>
                    </div>
                </div>
            </div>`);
        }

        if (!document.getElementById("superChangePwdModal")) {
            document.body.insertAdjacentHTML("beforeend", `
            <div class="modal fade" id="superChangePwdModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header text-white border-0" style="background:#081D5A;">
                            <h6 class="modal-title fw-bold mb-0">Cambiar Contraseña</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="superChangePwdForm" class="modal-body p-3">
                            <div class="mb-2">
                                <label class="form-label small fw-semibold">Contraseña Actual</label>
                                <input type="password" id="cpActual" class="form-control form-control-sm" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Nueva Contraseña (mín. 6)</label>
                                <input type="password" id="cpNueva" class="form-control form-control-sm" minlength="6" required>
                            </div>
                            <div id="cpMsg" class="small mb-2 d-none"></div>
                            <button type="submit" class="btn btn-primary btn-sm w-100 fw-bold">Actualizar Contraseña</button>
                        </form>
                    </div>
                </div>
            </div>`);
        }
    }

    function renderUserMenu() {
        const container = document.getElementById("superUserMenuContainer");
        if (!container) return;
        const user = getAuthUser();
        if (!user) {
            container.innerHTML = `
                <button type="button" id="btnOpenAuthModal" class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-none d-sm-inline-flex align-items-center gap-1">
                    <span>Ingresar / Cuenta</span>
                </button>`;
            const btn = document.getElementById("btnOpenAuthModal");
            if (btn) btn.addEventListener("click", () => openAuthModal("login"));
            return;
        }

        const isStaff = ["ADMIN", "VENDEDOR"].includes(String(user.rol || "").toUpperCase());
        const firstName = escapeHtml((user.nombre || user.username || "Cliente").split(" ")[0]);
        container.innerHTML = `
            <div class="dropdown">
                <button class="super-user-card d-none d-sm-flex border-0 bg-transparent text-start dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="super-user-name">Hola, ${firstName}</span>
                    <span class="super-user-sub">${escapeHtml(user.rol)}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 small">
                    <li><h6 class="dropdown-header">${escapeHtml(user.nombre || user.username)}</h6></li>
                    <li><button class="dropdown-item" type="button" id="menuBtnMisPedidos">Mis Pedidos</button></li>
                    <li><a class="dropdown-item" href="seguimiento.html">Seguir Pedido</a></li>
                    <li><button class="dropdown-item" type="button" id="menuBtnChangePwd">Cambiar Contraseña</button></li>
                    ${isStaff ? '<li><a class="dropdown-item fw-bold text-primary" href="dashboard.html">Panel Administrativo ERP</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger fw-semibold" type="button" id="menuBtnLogout">Cerrar Sesión</button></li>
                </ul>
            </div>`;

        document.getElementById("menuBtnMisPedidos")?.addEventListener("click", openMyOrdersModal);
        document.getElementById("menuBtnChangePwd")?.addEventListener("click", () => {
            const m = document.getElementById("superChangePwdModal");
            if (m && window.bootstrap) bootstrap.Modal.getOrCreateInstance(m).show();
        });
        document.getElementById("menuBtnLogout")?.addEventListener("click", () => {
            setAuthSession("", null);
            showSiteToast("Sesión cerrada", "info");
            if (window.location.pathname.includes("dashboard.html")) {
                window.location.reload();
            }
        });
    }

    function openAuthModal(tab = "login") {
        const modalEl = document.getElementById("superAuthModal");
        if (!modalEl || !window.bootstrap) return;
        const loginForm = document.getElementById("superLoginForm");
        const regForm = document.getElementById("superRegisterForm");
        const tabL = document.getElementById("tabLoginPill");
        const tabR = document.getElementById("tabRegisterPill");
        if (tab === "register") {
            loginForm.classList.add("d-none");
            regForm.classList.remove("d-none");
            tabL.classList.remove("active");
            tabR.classList.add("active");
        } else {
            loginForm.classList.remove("d-none");
            regForm.classList.add("d-none");
            tabL.classList.add("active");
            tabR.classList.remove("active");
        }
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    async function openMyOrdersModal() {
        const modalEl = document.getElementById("superMyOrdersModal");
        const body = document.getElementById("superMyOrdersBody");
        if (!modalEl || !body || !window.bootstrap) return;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        body.innerHTML = '<div class="text-center py-4 text-muted">Cargando historial de compras...</div>';
        try {
            const res = await authFetch("/api/mis-pedidos");
            if (!res.ok) throw new Error("No autorizado");
            const list = await res.json();
            if (!list.length) {
                body.innerHTML = '<div class="text-center py-4 text-muted">Aún no tienes pedidos registrados con esta cuenta.</div>';
                return;
            }
            body.innerHTML = list.map(p => `
                <div class="border rounded-3 p-3 mb-2 bg-light">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <strong class="font-monospace text-primary">${escapeHtml(p.codigo)}</strong>
                        <span class="badge bg-primary">${escapeHtml(p.estado)}</span>
                        <span class="fw-bold">S/ ${Number(p.total).toFixed(2)}</span>
                    </div>
                    <div class="small text-muted mb-2">${escapeHtml(p.tipo_comprobante)} • ${escapeHtml(p.metodo_pago)} • ${new Date(p.created_at).toLocaleString("es-PE")}</div>
                    <div class="small">${(p.items || []).map(i => `${i.cantidad}x ${escapeHtml(i.nombre_producto)}`).join(", ")}</div>
                    <div class="mt-2">
                        <a href="seguimiento.html?codigo=${encodeURIComponent(p.codigo)}" class="btn btn-sm btn-outline-primary fw-semibold">Ver Seguimiento →</a>
                    </div>
                </div>
            `).join("");
        } catch (err) {
            body.innerHTML = '<div class="alert alert-danger">Inicie sesión para ver sus pedidos.</div>';
        }
    }

    function updateCartUI() {
        const cart = getCart();
        const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
        const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

        document.querySelectorAll(".super-cart-badge").forEach(badge => {
            badge.textContent = String(totalQty);
            badge.style.display = totalQty > 0 ? "flex" : "none";
        });

        const itemsEl = document.getElementById("superCartItems");
        const summaryEl = document.getElementById("superCartSummary");
        const totalEl = document.getElementById("superCartTotal");
        const wspBtn = document.getElementById("btnCartWhatsApp");
        if (!itemsEl) return;

        if (cart.length === 0) {
            itemsEl.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <div class="mb-2" style="font-size:36px;">🛒</div>
                    <p class="fw-semibold mb-1" style="color:#081D5A;">Tu carrito está vacío</p>
                    <p class="small mb-3">Explora nuestro catálogo real con stock actualizado en Huancayo.</p>
                    <a href="catalogo.html" class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold">Ir al Catálogo</a>
                </div>`;
            if (summaryEl) summaryEl.classList.add("d-none");
            return;
        }

        itemsEl.innerHTML = cart.map(item => `
            <div class="d-flex gap-3 align-items-center border-bottom py-2">
                <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" class="rounded-2 border" style="width:56px;height:56px;object-fit:cover;flex-shrink:0;">
                <div class="flex-grow-1 min-w-0">
                    <div class="small fw-bold text-truncate" style="color:#081D5A;">${escapeHtml(item.name)}</div>
                    <div class="text-muted" style="font-size:11px;">${escapeHtml(item.brand)} • S/ ${Number(item.price).toFixed(2)}</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 cart-dec" data-id="${escapeHtml(item.id)}">-</button>
                        <span class="small fw-bold">${item.qty}</span>
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 cart-inc" data-id="${escapeHtml(item.id)}">+</button>
                        <button type="button" class="btn btn-link btn-sm text-danger p-0 ms-auto text-decoration-none cart-rem" data-id="${escapeHtml(item.id)}" style="font-size:11px;">Quitar</button>
                    </div>
                </div>
            </div>
        `).join("");

        itemsEl.querySelectorAll(".cart-dec").forEach(b => b.addEventListener("click", () => changeCartQty(b.dataset.id, -1)));
        itemsEl.querySelectorAll(".cart-inc").forEach(b => b.addEventListener("click", () => changeCartQty(b.dataset.id, 1)));
        itemsEl.querySelectorAll(".cart-rem").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.id)));

        if (summaryEl) summaryEl.classList.remove("d-none");
        if (totalEl) totalEl.textContent = `S/ ${totalPrice.toFixed(2)}`;
        if (wspBtn) {
            const lines = cart.map(i => `- ${i.qty}x ${i.name} (S/ ${(i.price * i.qty).toFixed(2)})`).join("\n");
            wspBtn.href = buildWhatsAppUrl(`Hola Importaciones Super Huancayo! Deseo consultar este carrito:\n${lines}\nSubtotal: S/ ${totalPrice.toFixed(2)}`);
        }
    }

    function openCartDrawer() {
        updateCartUI();
        const el = document.getElementById("superCartDrawer");
        if (el && window.bootstrap) bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }

    function openQuickView(product) {
        const modalEl = document.getElementById("superQuickViewModal");
        if (!modalEl || !window.bootstrap) return;
        const price = Number(product.precio != null ? product.precio : product.price);
        const oldPrice = Number(product.precio_anterior || 0);
        const stock = Number(product.stock != null ? product.stock : 10);
        const disc = Number(product.descuento_pct != null ? product.descuento_pct : (product.discount || 0));

        document.getElementById("qvTitle").textContent = product.marca || product.brand || "Producto";
        document.getElementById("qvBrand").textContent = product.marca || product.brand || "Super Tech";
        document.getElementById("qvSku").textContent = product.sku || "";
        document.getElementById("qvName").textContent = product.nombre || product.name;
        document.getElementById("qvDesc").textContent = product.descripcion || product.desc || "";
        document.getElementById("qvSpecs").textContent = product.especificaciones || "Garantía oficial en sede Huancayo";
        document.getElementById("qvPrice").textContent = `S/ ${price.toFixed(2)}`;
        document.getElementById("qvOldPrice").textContent = oldPrice > price ? `S/ ${oldPrice.toFixed(2)}` : "";
        document.getElementById("qvImg").src = product.imagen_url || product.img || "assets/img/logo.png";
        document.getElementById("qvImg").alt = product.nombre || product.name;

        const stockBadge = document.getElementById("qvStockBadge");
        if (stock <= 0) {
            stockBadge.className = "badge bg-danger-subtle text-danger border border-danger-subtle ms-auto";
            stockBadge.textContent = "Agotado";
        } else if (stock <= 5) {
            stockBadge.className = "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-auto";
            stockBadge.textContent = `Últimas ${stock} unidades`;
        } else {
            stockBadge.className = "badge bg-success-subtle text-success border border-success-subtle ms-auto";
            stockBadge.textContent = `En stock (${stock} disp.)`;
        }

        const discEl = document.getElementById("qvDiscount");
        if (disc > 0) {
            discEl.textContent = `-${disc}%`;
            discEl.classList.remove("d-none");
        } else {
            discEl.classList.add("d-none");
        }

        const addBtn = document.getElementById("qvAddCartBtn");
        addBtn.disabled = stock <= 0;
        addBtn.textContent = stock <= 0 ? "Sin Stock" : "Agregar al Carrito";
        addBtn.onclick = () => {
            addToCart(product);
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            openCartDrawer();
        };

        document.getElementById("qvWspBtn").href = buildWhatsAppUrl(`Hola Importaciones Super Huancayo! Consulta sobre: ${product.nombre || product.name} (S/ ${price.toFixed(2)})`);
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    function buildProductCardHtml(p, colClass = "col") {
        const stock = Number(p.stock || 0);
        const price = Number(p.precio || 0);
        const oldPrice = Number(p.precio_anterior || 0);
        const stockTag = stock <= 0
            ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2" style="font-size:10px;">Agotado</span>'
            : (stock <= 5 ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2" style="font-size:10px;">Quedan ${stock}</span>` : '');

        return `
            <div class="${colClass} producto-item" data-id="${p.id}" data-category="${escapeHtml(p.categoria)}" data-brand="${escapeHtml(p.marca)}" data-price="${price}" data-discount="${p.descuento_pct || 0}">
                <div class="super-product-card">
                    <div class="super-product-img-box" style="cursor:pointer;">
                        ${p.descuento_pct > 0 ? `<span class="super-product-tag-discount">-${p.descuento_pct}%</span>` : ''}
                        ${stockTag}
                        <img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" loading="lazy">
                    </div>
                    <div class="super-product-bottom">
                        <div class="super-product-info">
                            <span class="super-product-brand">${escapeHtml(p.marca)}</span>
                            <p class="super-product-name">${escapeHtml(p.nombre)}</p>
                            ${oldPrice > price ? `<small class="text-muted text-decoration-line-through" style="font-size:11px;">S/ ${oldPrice.toFixed(2)}</small>` : ''}
                        </div>
                        <div class="super-product-price-block">
                            S/${price.toFixed(2)}
                        </div>
                    </div>
                    <div class="super-product-actions">
                        <button type="button" class="btn btn-sm btn-primary fw-semibold flex-grow-1 btn-add-cart" ${stock <= 0 ? 'disabled' : ''}>
                            ${stock <= 0 ? 'Agotado' : '+ Carrito'}
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-primary fw-semibold btn-quick-view">
                            Ver
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function bindProductCards(containerEl, productsList) {
        if (!containerEl) return;
        const mapById = new Map(productsList.map(p => [String(p.id), p]));
        containerEl.querySelectorAll(".producto-item").forEach(itemEl => {
            const p = mapById.get(itemEl.dataset.id);
            if (!p) return;
            itemEl.querySelector(".btn-add-cart")?.addEventListener("click", (e) => {
                e.stopPropagation();
                addToCart(p);
            });
            itemEl.querySelector(".btn-quick-view")?.addEventListener("click", (e) => {
                e.stopPropagation();
                openQuickView(p);
            });
            itemEl.querySelector(".super-product-img-box")?.addEventListener("click", () => openQuickView(p));
        });
    }

    async function loadHomeFeaturedProducts() {
        const grid = document.getElementById("homeFeaturedGrid");
        if (!grid) return;

        function renderFeatured(list) {
            const destacados = (list || []).filter(p => p.destacado);
            const featured = (destacados.length ? destacados : (list || [])).slice(0, 8);
            grid.innerHTML = featured.map(p => buildProductCardHtml(p, "col")).join("");
            bindProductCards(grid, featured);
        }

        try {
            if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                throw new Error("OFFLINE_FILE");
            }
            const res = await fetch("/api/productos?destacado=true", { cache: "no-store" });
            if (!res.ok) {
                if (window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                    throw new Error("OFFLINE_STATIC");
                }
                throw new Error("HTTP " + res.status);
            }
            const list = await res.json();
            renderFeatured(list);
        } catch (err) {
            if (Array.isArray(window.SUPER_CATALOGO_ESTATICO) && window.SUPER_CATALOGO_ESTATICO.length) {
                renderFeatured(window.SUPER_CATALOGO_ESTATICO);
                return;
            }
            grid.innerHTML = '<div class="col-12 text-center py-4 text-danger">No se pudo cargar las ofertas destacadas.</div>';
        }
    }

    // Exponer helpers globales para catalogo-falabella.js y checkout.js
    window.SuperStore = {
        escapeHtml,
        buildWhatsAppUrl,
        getAuthToken,
        getAuthUser,
        setAuthSession,
        authFetch,
        getCart,
        saveCart,
        addToCart,
        clearCart,
        openCartDrawer,
        openAuthModal,
        openQuickView,
        buildProductCardHtml,
        bindProductCards,
        showSiteToast
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectSharedModals();
        renderUserMenu();
        updateCartUI();
        loadHomeFeaturedProducts();

        // Verificar sesión vigente contra /api/auth/me si hay token
        if (getAuthToken()) {
            authFetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
                if (data && data.usuario) {
                    localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
                    renderUserMenu();
                }
            }).catch(() => {});
        }

        document.querySelectorAll(".super-cart-trigger").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                openCartDrawer();
            });
        });

        document.getElementById("btnClearCart")?.addEventListener("click", () => {
            clearCart();
            showSiteToast("Carrito vaciado", "info");
        });

        // Auth modal tabs & forms
        document.getElementById("tabLoginPill")?.addEventListener("click", () => openAuthModal("login"));
        document.getElementById("tabRegisterPill")?.addEventListener("click", () => openAuthModal("register"));

        document.getElementById("superLoginForm")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const errEl = document.getElementById("authLoginErr");
            errEl.classList.add("d-none");
            const username = document.getElementById("authLoginUser").value.trim();
            const password = document.getElementById("authLoginPass").value;
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    errEl.textContent = data.error || "Credenciales inválidas";
                    errEl.classList.remove("d-none");
                    return;
                }
                setAuthSession(data.token, data.usuario);
                bootstrap.Modal.getOrCreateInstance(document.getElementById("superAuthModal")).hide();
                showSiteToast(`Bienvenido, ${data.usuario.nombre}`, "success");
                if (window.location.pathname.includes("checkout.html") && typeof window.autofillCheckoutUser === "function") {
                    window.autofillCheckoutUser();
                }
            } catch (err) {
                errEl.textContent = "Error de conexión con el servidor.";
                errEl.classList.remove("d-none");
            }
        });

        document.getElementById("superRegisterForm")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const errEl = document.getElementById("authRegErr");
            errEl.classList.add("d-none");
            const payload = {
                nombre: document.getElementById("regNombre").value.trim(),
                username: document.getElementById("regUsername").value.trim(),
                email: document.getElementById("regEmail").value.trim(),
                telefono: document.getElementById("regTelefono").value.trim(),
                dni: document.getElementById("regDni").value.trim(),
                password: document.getElementById("regPassword").value,
                direccion: document.getElementById("regDireccion").value.trim()
            };
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    errEl.textContent = data.error || "No se pudo completar el registro.";
                    errEl.classList.remove("d-none");
                    return;
                }
                setAuthSession(data.token, data.usuario);
                bootstrap.Modal.getOrCreateInstance(document.getElementById("superAuthModal")).hide();
                showSiteToast("Cuenta creada e iniciada correctamente", "success");
            } catch (err) {
                errEl.textContent = "Error de conexión al registrar cuenta.";
                errEl.classList.remove("d-none");
            }
        });

        document.getElementById("superChangePwdForm")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById("cpMsg");
            msgEl.classList.remove("d-none");
            const res = await authFetch("/api/auth/password", {
                method: "PUT",
                body: JSON.stringify({
                    passwordActual: document.getElementById("cpActual").value,
                    passwordNueva: document.getElementById("cpNueva").value
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                msgEl.className = "small mb-2 text-success fw-semibold";
                msgEl.textContent = data.mensaje || "Contraseña actualizada";
                e.target.reset();
            } else {
                msgEl.className = "small mb-2 text-danger fw-semibold";
                msgEl.textContent = data.error || "Error al cambiar contraseña";
            }
        });

        // Formulario de Contacto -> PostgreSQL
        const contactForm = document.getElementById("contactForm");
        const formFeedback = document.getElementById("formFeedback");
        if (contactForm) {
            contactForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const phoneInput = document.getElementById("customerPhone");
                if (phoneInput) phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
                if (!contactForm.checkValidity()) {
                    contactForm.reportValidity();
                    return;
                }
                const name = document.getElementById("customerName")?.value.trim() || "";
                const phone = phoneInput ? phoneInput.value.trim() : "";
                const email = document.getElementById("customerEmail")?.value.trim() || "";
                const interest = document.getElementById("productInterest")?.value.trim() || "Consulta general";
                const message = document.getElementById("customerMessage")?.value.trim() || "";
                const submitBtn = document.getElementById("submitBtn");
                if (submitBtn) submitBtn.disabled = true;

                function mostrarContactoExito(codigo, modoEst) {
                    const wspUrl = buildWhatsAppUrl(`Hola Importaciones Super Huancayo! Mi nombre es ${name} (Ref: ${codigo}). Consulta: ${interest} - ${message}`);
                    const suffix = modoEst ? " (Modo Estático Local)" : "";
                    formFeedback.hidden = false;
                    formFeedback.style.display = "flex";
                    formFeedback.className = "alerta-exito";
                    formFeedback.innerHTML = `
                        <span>✓</span>
                        <div>
                            <strong>¡Consulta registrada con éxito (${escapeHtml(codigo)})${suffix}, ${escapeHtml(name)}!</strong><br>
                            Un asesor de Av. Giraldez N.º 442 se comunicará al ${escapeHtml(phone)}.<br>
                            <a href="${wspUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-success mt-2 fw-semibold">Continuar por WhatsApp →</a>
                        </div>`;
                    contactForm.reset();
                }

                try {
                    if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                        throw new Error("OFFLINE_FILE");
                    }
                    const res = await fetch("/api/contactos", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nombre: name, telefono: phone, correo: email, producto: interest, mensaje: message })
                    });
                    if (!res.ok && window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                        throw new Error("OFFLINE_STATIC");
                    }
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        formFeedback.hidden = false;
                        formFeedback.style.display = "flex";
                        formFeedback.className = "alert alert-danger mt-3";
                        formFeedback.textContent = data.error || "Revise los campos obligatorios.";
                        return;
                    }
                    mostrarContactoExito(data.codigo, false);
                } catch (err) {
                    const refCode = "CON-2026-" + String(Math.floor(1000 + Math.random() * 9000));
                    if (window.SuperOffline) {
                        window.SuperOffline.saveSubmission("super_offline_contactos_v1", {
                            codigo: refCode,
                            nombre: name,
                            telefono: phone,
                            correo: email,
                            producto: interest,
                            mensaje: message,
                            fecha: new Date().toISOString()
                        });
                    }
                    mostrarContactoExito(refCode, true);
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });
        }

        // Libro de Reclamaciones -> PostgreSQL
        const reclamosForm = document.getElementById("reclamosForm");
        const reclamosFeedback = document.getElementById("reclamosFeedback");
        if (reclamosForm) {
            reclamosForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const dniEl = document.getElementById("reclamoDni");
                const telEl = document.getElementById("reclamoTelefono");
                if (dniEl) dniEl.value = dniEl.value.replace(/[^0-9]/g, "");
                if (telEl) telEl.value = telEl.value.replace(/[^0-9]/g, "");
                if (!reclamosForm.checkValidity()) {
                    reclamosForm.reportValidity();
                    return;
                }
                const payload = {
                    nombre: document.getElementById("reclamoNombre")?.value.trim() || "",
                    dni: dniEl ? dniEl.value.trim() : "",
                    telefono: telEl ? telEl.value.trim() : "",
                    correo: document.getElementById("reclamoEmail")?.value.trim() || "",
                    tipo: document.getElementById("reclamoTipo")?.value || "Reclamo",
                    detalle: document.getElementById("reclamoDetalle")?.value.trim() || ""
                };
                const btn = reclamosForm.querySelector('button[type="submit"]');
                if (btn) btn.disabled = true;
                function mostrarReclamoExito(codigo, modoEst) {
                    const suffix = modoEst ? " (Modo Estático Local)" : "";
                    reclamosFeedback.hidden = false;
                    reclamosFeedback.style.display = "flex";
                    reclamosFeedback.className = "alerta-exito";
                    reclamosFeedback.innerHTML = `
                        <span>✓</span>
                        <div>
                            <strong>Hoja de Reclamación Registrada. Código: ${escapeHtml(codigo)}${suffix}</strong><br>
                            Conforme a la normativa INDECOPI (Ley N.º 29571), responderemos formalmente al correo ${escapeHtml(payload.correo)}.
                        </div>`;
                    reclamosForm.reset();
                }

                try {
                    if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                        throw new Error("OFFLINE_FILE");
                    }
                    const res = await fetch("/api/reclamos", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok && window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                        throw new Error("OFFLINE_STATIC");
                    }
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        reclamosFeedback.hidden = false;
                        reclamosFeedback.style.display = "flex";
                        reclamosFeedback.className = "alert alert-danger mt-3";
                        reclamosFeedback.textContent = data.error || "Complete todos los campos correctamente.";
                        return;
                    }
                    mostrarReclamoExito(data.codigo, false);
                } catch (err) {
                    const recCode = "REC-2026-" + String(Math.floor(1000 + Math.random() * 9000));
                    if (window.SuperOffline) {
                        window.SuperOffline.saveSubmission("super_offline_reclamos_v1", {
                            codigo: recCode,
                            nombre: payload.nombre,
                            dni: payload.dni,
                            telefono: payload.telefono,
                            correo: payload.correo,
                            tipo: payload.tipo,
                            detalle: payload.detalle,
                            fecha: new Date().toISOString()
                        });
                    }
                    mostrarReclamoExito(recCode, true);
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }
    });
})();
