/**
 * ==============================================================================
 * BACKOFFICE ERP PROTEGIDO (JWT + 6 MÓDULOS) - IMPORTACIONES SUPER HUANCAYO
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const Store = window.SuperStore;
    const esc = Store.escapeHtml;

    const loginGate = document.getElementById('adminLoginOverlay');
    const erpMain = document.getElementById('erpMainContent');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginErr = document.getElementById('adminLoginErr');
    const adminBadgeName = document.getElementById('adminBadgeName');

    let ventasChart = null;
    let estadosChart = null;
    let cachedProductos = [];
    let cachedPedidos = [];
    let cachedEmpleados = [];
    let filaEmpleadoEdit = null;

    function isStaffSession() {
        const token = Store.getAuthToken();
        const u = Store.getAuthUser();
        return Boolean(token && u && ['ADMIN', 'VENDEDOR'].includes(String(u.rol || '').toUpperCase()));
    }

    function updateGateVisibility() {
        if (isStaffSession()) {
            const u = Store.getAuthUser();
            loginGate?.classList.add('d-none');
            erpMain?.classList.remove('d-none');
            if (adminBadgeName) adminBadgeName.textContent = `${u.nombre} (${u.rol})`;
            const isAdmin = String(u.rol).toUpperCase() === 'ADMIN';
            document.getElementById('tabBtnUsuariosAuditoria')?.classList.toggle('d-none', !isAdmin);
            cargarTodoERP();
        } else {
            loginGate?.classList.remove('d-none');
            erpMain?.classList.add('d-none');
        }
    }

    adminLoginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminLoginErr.classList.add('d-none');
        const username = document.getElementById('erpUser').value.trim();
        const password = document.getElementById('erpPass').value;
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                adminLoginErr.textContent = data.error || 'Credenciales inválidas.';
                adminLoginErr.classList.remove('d-none');
                return;
            }
            const rol = String(data.usuario?.rol || '').toUpperCase();
            if (!['ADMIN', 'VENDEDOR'].includes(rol)) {
                adminLoginErr.textContent = 'Esta cuenta tiene rol CLIENTE. El panel ERP es exclusivo para personal ADMIN o VENDEDOR.';
                adminLoginErr.classList.remove('d-none');
                return;
            }
            Store.setAuthSession(data.token, data.usuario);
            updateGateVisibility();
            Store.showSiteToast('Acceso autorizado al Backoffice ERP', 'success');
        } catch (err) {
            adminLoginErr.textContent = 'Error de conexión con el servidor.';
            adminLoginErr.classList.remove('d-none');
        }
    });

    async function cargarTodoERP() {
        await Promise.all([
            cargarResumenEjecutivo(),
            cargarPedidos(),
            cargarProductosAdmin(),
            cargarConsultasYReclamos(),
            cargarEmpleados(),
            cargarUsuariosYAuditoria()
        ]);
    }

    // ================= 1. RESUMEN EJECUTIVO =================
    async function cargarResumenEjecutivo() {
        const res = await Store.authFetch('/api/admin/dashboard');
        if (!res.ok) return;
        const d = await res.json();

        document.getElementById('erpKpiIngresos').textContent = `S/ ${Number(d.ingresosTotales || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
        document.getElementById('erpKpiIngresos7d').textContent = `Últimos 7 días: S/ ${Number(d.ingresosUltimos7Dias || 0).toFixed(2)}`;
        document.getElementById('erpKpiPendientes').textContent = String(d.pedidosPendientes || 0);
        document.getElementById('erpKpiTotalPedidos').textContent = `de ${d.totalPedidos || 0} pedidos totales`;
        document.getElementById('erpKpiStockBajo').textContent = String(d.productosStockBajo || 0);
        document.getElementById('erpKpiTotalProductos').textContent = `de ${d.totalProductos || 0} SKUs activos`;
        document.getElementById('erpKpiSoporte').textContent = String((d.consultasNuevas || 0) + (d.reclamosAbiertos || 0));
        document.getElementById('erpKpiSoporteSub').textContent = `${d.consultasNuevas || 0} consultas / ${d.reclamosAbiertos || 0} reclamos`;

        if (window.Chart) {
            const ctxV = document.getElementById('erpChartVentas');
            if (ctxV) {
                if (ventasChart) ventasChart.destroy();
                const labels = (d.ventasPorDia || []).map(x => x.dia);
                const vals = (d.ventasPorDia || []).map(x => Number(x.total));
                ventasChart = new Chart(ctxV, {
                    type: 'bar',
                    data: {
                        labels: labels.length ? labels : ['Sin ventas'],
                        datasets: [{ label: 'Ventas (S/)', data: vals.length ? vals : [0], backgroundColor: '#0B3FC1', borderRadius: 6 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }

            const ctxE = document.getElementById('erpChartEstados');
            if (ctxE) {
                if (estadosChart) estadosChart.destroy();
                const eLabels = (d.pedidosPorEstado || []).map(x => x.estado);
                const eVals = (d.pedidosPorEstado || []).map(x => Number(x.cantidad));
                estadosChart = new Chart(ctxE, {
                    type: 'doughnut',
                    data: {
                        labels: eLabels,
                        datasets: [{ data: eVals, backgroundColor: ['#198754', '#0B3FC1', '#0dcaf0', '#ffc107', '#6c757d', '#dc3545'] }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }
    }

    // ================= 2. PEDIDOS Y VENTAS =================
    async function cargarPedidos() {
        const est = document.getElementById('filtroEstadoPedido')?.value || 'ALL';
        const q = document.getElementById('filtroTextoPedido')?.value.trim() || '';
        const res = await Store.authFetch(`/api/admin/pedidos?estado=${encodeURIComponent(est)}&q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        cachedPedidos = await res.json();
        const tbody = document.getElementById('tbodyPedidosERP');
        if (!tbody) return;
        if (!cachedPedidos.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay pedidos con este filtro.</td></tr>';
            return;
        }
        tbody.innerHTML = cachedPedidos.map(p => `
            <tr>
                <td class="font-monospace fw-bold text-primary">${esc(p.codigo)}</td>
                <td>
                    <div class="fw-semibold">${esc(p.cliente_nombre)}</div>
                    <small class="text-muted">${esc(p.tipo_comprobante)}: ${esc(p.cliente_dni_ruc)} • ${esc(p.cliente_telefono)}</small>
                </td>
                <td><span class="badge bg-light text-dark border">${esc(p.tipo_entrega)}</span><br><small class="text-muted">${esc(p.metodo_pago)}</small></td>
                <td class="fw-bold">S/ ${Number(p.total).toFixed(2)}</td>
                <td>
                    <select class="form-select form-select-sm sel-estado-pedido" data-id="${p.id}" ${p.estado === 'CANCELADO' ? 'disabled' : ''}>
                        ${['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'].map(s => `<option value="${s}" ${p.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td><small>${new Date(p.created_at).toLocaleString('es-PE')}</small></td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-primary btn-ver-pedido" data-id="${p.id}">Detalle</button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.sel-estado-pedido').forEach(sel => {
            sel.addEventListener('change', async () => {
                const resU = await Store.authFetch(`/api/admin/pedidos/${sel.dataset.id}/estado`, {
                    method: 'PUT',
                    body: JSON.stringify({ estado: sel.value })
                });
                const d = await resU.json().catch(() => ({}));
                if (resU.ok) {
                    Store.showSiteToast(d.mensaje || 'Estado actualizado', 'success');
                    await cargarTodoERP();
                } else {
                    Store.showSiteToast(d.error || 'Error cambiando estado', 'danger');
                    await cargarPedidos();
                }
            });
        });

        tbody.querySelectorAll('.btn-ver-pedido').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = cachedPedidos.find(x => String(x.id) === btn.dataset.id);
                if (!p) return;
                document.getElementById('detPedidoTitulo').textContent = `${p.codigo} • ${p.tipo_comprobante}`;
                document.getElementById('detPedidoBody').innerHTML = `
                    <p class="mb-1"><strong>Cliente:</strong> ${esc(p.cliente_nombre)} (${esc(p.cliente_dni_ruc)})</p>
                    <p class="mb-1"><strong>Entrega:</strong> ${esc(p.tipo_entrega)} — ${esc(p.direccion_entrega)}</p>
                    <p class="mb-3"><strong>Pago:</strong> ${esc(p.metodo_pago)} ${p.referencia_pago ? '(' + esc(p.referencia_pago) + ')' : ''}</p>
                    <table class="table table-sm table-bordered">
                        <thead><tr><th>SKU</th><th>Producto</th><th>Cant.</th><th>P. Unit</th><th>Subtotal</th></tr></thead>
                        <tbody>${(p.items || []).map(i => `<tr><td>${esc(i.sku)}</td><td>${esc(i.nombre_producto)}</td><td>${i.cantidad}</td><td>S/ ${Number(i.precio_unitario).toFixed(2)}</td><td>S/ ${Number(i.subtotal).toFixed(2)}</td></tr>`).join('')}</tbody>
                    </table>
                    <div class="text-end small">
                        Op. Gravada: S/ ${Number(p.op_gravada).toFixed(2)} | IGV (18%): S/ ${Number(p.igv).toFixed(2)} | Envío: S/ ${Number(p.costo_envio).toFixed(2)} | Descuento: -S/ ${Number(p.descuento).toFixed(2)}<br>
                        <strong class="fs-5 text-primary">TOTAL: S/ ${Number(p.total).toFixed(2)}</strong>
                    </div>`;
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetallePedidoERP')).show();
            });
        });
    }

    document.getElementById('filtroEstadoPedido')?.addEventListener('change', cargarPedidos);
    document.getElementById('filtroTextoPedido')?.addEventListener('input', cargarPedidos);

    // ================= 3. PRODUCTOS E INVENTARIO =================
    async function cargarProductosAdmin() {
        const res = await Store.authFetch('/api/admin/productos');
        if (!res.ok) return;
        cachedProductos = await res.json();
        const tbody = document.getElementById('tbodyProductosERP');
        if (!tbody) return;
        tbody.innerHTML = cachedProductos.map(p => {
            const low = p.stock <= p.stock_minimo;
            return `
            <tr class="${low ? 'table-warning' : ''}">
                <td class="font-monospace small">${esc(p.sku)}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${esc(p.imagen_url)}" alt="" class="rounded border" style="width:36px;height:36px;object-fit:cover;">
                        <div>
                            <div class="fw-semibold">${esc(p.nombre)}</div>
                            <small class="text-muted">${esc(p.marca)} • ${esc(p.categoria)}</small>
                        </div>
                    </div>
                </td>
                <td class="fw-bold">S/ ${Number(p.precio).toFixed(2)}</td>
                <td>
                    <span class="badge ${p.stock === 0 ? 'bg-danger' : (low ? 'bg-warning text-dark' : 'bg-success')}">${p.stock} unid.</span>
                </td>
                <td>${p.activo ? '<span class="badge bg-success-subtle text-success">Activo</span>' : '<span class="badge bg-secondary">Oculto</span>'}</td>
                <td class="text-center text-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-primary btn-edit-prod me-1" data-id="${p.id}">Editar</button>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-del-prod" data-id="${p.id}">Eliminar</button>
                </td>
            </tr>`;
        }).join('');

        tbody.querySelectorAll('.btn-edit-prod').forEach(btn => {
            btn.addEventListener('click', () => openModalProducto(cachedProductos.find(x => String(x.id) === btn.dataset.id)));
        });
        tbody.querySelectorAll('.btn-del-prod').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('¿Eliminar o desactivar este producto del catálogo?')) return;
                const r = await Store.authFetch(`/api/productos/${btn.dataset.id}`, { method: 'DELETE' });
                const d = await r.json().catch(() => ({}));
                Store.showSiteToast(d.mensaje || d.error || 'Actualizado', r.ok ? 'warning' : 'danger');
                await cargarTodoERP();
            });
        });
    }

    function openModalProducto(p = null) {
        document.getElementById('prodEditId').value = p ? p.id : '';
        document.getElementById('prodModalTitulo').textContent = p ? `Editar ${p.sku}` : 'Nuevo Producto en Catálogo';
        document.getElementById('prodSku').value = p ? p.sku : '';
        document.getElementById('prodNombre').value = p ? p.nombre : '';
        document.getElementById('prodMarca').value = p ? p.marca : '';
        document.getElementById('prodCategoria').value = p ? p.categoria : 'audio';
        document.getElementById('prodPrecio').value = p ? p.precio : '';
        document.getElementById('prodPrecioAnt').value = p && p.precio_anterior ? p.precio_anterior : '';
        document.getElementById('prodDescuento').value = p ? (p.descuento_pct || 0) : 0;
        document.getElementById('prodStock').value = p ? p.stock : 10;
        document.getElementById('prodImagen').value = p ? p.imagen_url : '';
        document.getElementById('prodSpecs').value = p ? (p.especificaciones || '') : '';
        document.getElementById('prodDesc').value = p ? p.descripcion : '';
        document.getElementById('prodDestacado').checked = p ? Boolean(p.destacado) : true;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalProductoERP')).show();
    }

    document.getElementById('btnNuevoProductoERP')?.addEventListener('click', () => openModalProducto(null));
    document.getElementById('formProductoERP')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prodEditId').value;
        const payload = {
            sku: document.getElementById('prodSku').value.trim(),
            nombre: document.getElementById('prodNombre').value.trim(),
            marca: document.getElementById('prodMarca').value.trim(),
            categoria: document.getElementById('prodCategoria').value,
            precio: Number(document.getElementById('prodPrecio').value),
            precio_anterior: document.getElementById('prodPrecioAnt').value ? Number(document.getElementById('prodPrecioAnt').value) : null,
            descuento_pct: Number(document.getElementById('prodDescuento').value || 0),
            stock: Number(document.getElementById('prodStock').value || 0),
            imagen_url: document.getElementById('prodImagen').value.trim(),
            especificaciones: document.getElementById('prodSpecs').value.trim(),
            descripcion: document.getElementById('prodDesc').value.trim(),
            destacado: document.getElementById('prodDestacado').checked,
            activo: true
        };
        const res = await Store.authFetch(id ? `/api/productos/${id}` : '/api/productos', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
            Store.showSiteToast(d.error || 'Error guardando producto', 'danger');
            return;
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalProductoERP')).hide();
        Store.showSiteToast(d.mensaje || 'Producto guardado', 'success');
        await cargarTodoERP();
    });

    // ================= 4. CONSULTAS Y RECLAMOS =================
    async function cargarConsultasYReclamos() {
        const [rC, rR] = await Promise.all([Store.authFetch('/api/contactos'), Store.authFetch('/api/reclamos')]);
        if (rC.ok) {
            const contactos = await rC.json();
            const tbC = document.getElementById('tbodyConsultasERP');
            if (tbC) {
                tbC.innerHTML = contactos.map(c => `
                    <tr>
                        <td class="font-monospace">${esc(c.codigo)}</td>
                        <td><strong>${esc(c.nombre)}</strong><br><small class="text-muted">${esc(c.telefono)} • ${esc(c.correo || '')}</small></td>
                        <td>${esc(c.producto)}<br><small class="text-muted">${esc(c.mensaje)}</small></td>
                        <td><span class="badge ${c.estado === 'ATENDIDO' ? 'bg-success' : 'bg-warning text-dark'}">${esc(c.estado)}</span></td>
                        <td>
                            ${c.estado !== 'ATENDIDO' ? `<button type="button" class="btn btn-sm btn-success btn-atender-contacto" data-id="${c.id}">Marcar Atendido</button>` : '<small class="text-success fw-semibold">Atendido</small>'}
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="5" class="text-center py-3 text-muted">Sin consultas registradas.</td></tr>';

                tbC.querySelectorAll('.btn-atender-contacto').forEach(b => b.addEventListener('click', async () => {
                    await Store.authFetch(`/api/contactos/${b.dataset.id}/estado`, { method: 'PUT', body: JSON.stringify({ estado: 'ATENDIDO', respuesta_admin: 'Atendido por asesor comercial' }) });
                    Store.showSiteToast('Consulta marcada como atendida', 'success');
                    await cargarTodoERP();
                }));
            }
        }
        if (rR.ok) {
            const reclamos = await rR.json();
            const tbR = document.getElementById('tbodyReclamosERP');
            if (tbR) {
                tbR.innerHTML = reclamos.map(r => `
                    <tr>
                        <td class="font-monospace text-danger fw-bold">${esc(r.codigo)}</td>
                        <td><strong>${esc(r.nombre)}</strong> (DNI ${esc(r.dni)})<br><small class="text-muted">${esc(r.telefono)} • ${esc(r.correo)}</small></td>
                        <td><span class="badge bg-info-subtle text-info-emphasis">${esc(r.tipo)}</span><br><small>${esc(r.detalle)}</small></td>
                        <td><span class="badge ${r.estado === 'RESUELTO' ? 'bg-success' : 'bg-danger'}">${esc(r.estado)}</span></td>
                        <td>
                            ${r.estado !== 'RESUELTO' ? `<button type="button" class="btn btn-sm btn-primary btn-resolver-reclamo" data-id="${r.id}">Resolver</button>` : '<small class="text-success fw-semibold">Resuelto</small>'}
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="5" class="text-center py-3 text-muted">Sin reclamos registrados.</td></tr>';

                tbR.querySelectorAll('.btn-resolver-reclamo').forEach(b => b.addEventListener('click', async () => {
                    const resp = prompt('Detalle de respuesta formal INDECOPI:', 'Se brindó solución y conformidad al cliente en tienda Av. Giraldez 442.');
                    if (resp === null) return;
                    await Store.authFetch(`/api/reclamos/${b.dataset.id}/estado`, { method: 'PUT', body: JSON.stringify({ estado: 'RESUELTO', respuesta_admin: resp }) });
                    Store.showSiteToast('Reclamación resuelta', 'success');
                    await cargarTodoERP();
                }));
            }
        }
    }

    // ================= 5. PERSONAL / EMPLEADOS (POSTGRESQL + JWT) =================
    const formEmp = document.getElementById('formEmpleado');
    const tbodyEmp = document.getElementById('cuerpoTabla');
    const btnSubmitEmp = document.getElementById('btnSubmit');
    const btnCancelEmp = document.getElementById('btnCancelarEdicion');

    async function cargarEmpleados() {
        const res = await Store.authFetch('/api/empleados');
        if (!res.ok) return;
        cachedEmpleados = await res.json();
        renderTablaEmpleados();
    }

    function renderTablaEmpleados() {
        if (!tbodyEmp) return;
        const term = (document.getElementById('filtroEmpleado')?.value || '').toLowerCase().trim();
        const filtered = cachedEmpleados.filter(e => !term || `${e.dni} ${e.apellidos} ${e.nombres} ${e.especialidad} ${e.correo}`.toLowerCase().includes(term));

        tbodyEmp.innerHTML = filtered.map(emp => `
            <tr data-id="${emp.id}">
                <td class="fw-semibold px-3 text-nowrap">${esc(emp.dni)}</td>
                <td>${esc(emp.apellidos)}</td>
                <td>${esc(emp.nombres)}</td>
                <td class="text-nowrap">${esc(emp.telefono)}</td>
                <td><a href="mailto:${esc(emp.correo)}" class="text-decoration-none">${esc(emp.correo)}</a></td>
                <td>${esc(emp.direccion)}</td>
                <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${esc(emp.especialidad)}</span></td>
                <td class="text-center px-3 text-nowrap">
                    <button type="button" class="btn btn-sm btn-primary btn-editar me-1">Editar</button>
                    <button type="button" class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8" class="text-center py-4 text-muted">Sin empleados coincidentes.</td></tr>';

        const cEl = document.getElementById('contadorRegistros');
        if (cEl) cEl.textContent = `${filtered.length} de ${cachedEmpleados.length} empleados`;
    }

    formEmp?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            dni: document.getElementById('dni').value.replace(/[^0-9]/g, ''),
            apellidos: document.getElementById('apellidos').value.trim(),
            nombres: document.getElementById('nombres').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.replace(/[^0-9]/g, ''),
            especialidad: document.getElementById('especialidad').value,
            direccion: document.getElementById('direccion').value.trim()
        };
        const res = await Store.authFetch(filaEmpleadoEdit ? `/api/empleados/${filaEmpleadoEdit}` : '/api/empleados', {
            method: filaEmpleadoEdit ? 'PUT' : 'POST',
            body: JSON.stringify(body)
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
            Store.showSiteToast(d.error || 'Error guardando empleado', 'danger');
            return;
        }
        cancelarEdicionEmp();
        Store.showSiteToast(d.mensaje || 'Empleado guardado', 'success');
        await cargarEmpleados();
    });

    function cancelarEdicionEmp() {
        filaEmpleadoEdit = null;
        formEmp?.reset();
        if (btnSubmitEmp) btnSubmitEmp.textContent = 'Registrar Empleado';
        btnCancelEmp?.classList.add('d-none');
    }

    btnCancelEmp?.addEventListener('click', cancelarEdicionEmp);
    document.getElementById('filtroEmpleado')?.addEventListener('input', renderTablaEmpleados);

    tbodyEmp?.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        if (e.target.classList.contains('btn-eliminar')) {
            if (!confirm('¿Eliminar este empleado?')) return;
            const res = await Store.authFetch(`/api/empleados/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Store.showSiteToast('Empleado eliminado', 'info');
                await cargarEmpleados();
            }
        } else if (e.target.classList.contains('btn-editar')) {
            const emp = cachedEmpleados.find(x => String(x.id) === String(id));
            if (!emp) return;
            filaEmpleadoEdit = emp.id;
            document.getElementById('dni').value = emp.dni;
            document.getElementById('apellidos').value = emp.apellidos;
            document.getElementById('nombres').value = emp.nombres;
            document.getElementById('correo').value = emp.correo;
            document.getElementById('telefono').value = emp.telefono;
            document.getElementById('especialidad').value = emp.especialidad;
            document.getElementById('direccion').value = emp.direccion;
            if (btnSubmitEmp) btnSubmitEmp.textContent = 'Guardar Cambios';
            btnCancelEmp?.classList.remove('d-none');
            formEmp?.scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('btnRestablecerPorDefecto')?.addEventListener('click', async () => {
        if (!confirm('¿Restablecer los 5 empleados base en PostgreSQL?')) return;
        const res = await Store.authFetch('/api/empleados/restablecer', { method: 'POST' });
        if (res.ok) {
            Store.showSiteToast('Empleados restablecidos', 'info');
            await cargarEmpleados();
        }
    });

    document.getElementById('btnExportarCSV')?.addEventListener('click', () => {
        const rows = cachedEmpleados.map(e => [e.dni, e.apellidos, e.nombres, e.telefono, e.correo, e.direccion, e.especialidad].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
        const csv = '\uFEFF' + ['DNI,Apellidos,Nombres,Telefono,Correo,Direccion,Especialidad', ...rows].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'empleados_importaciones_super.csv';
        a.click();
    });
    document.getElementById('btnImprimirLista')?.addEventListener('click', () => window.print());

    // ================= 6. USUARIOS RBAC Y AUDITORÍA (SOLO ADMIN) =================
    async function cargarUsuariosYAuditoria() {
        const u = Store.getAuthUser();
        if (!u || String(u.rol).toUpperCase() !== 'ADMIN') return;
        const [rU, rA] = await Promise.all([Store.authFetch('/api/admin/usuarios'), Store.authFetch('/api/admin/auditoria')]);
        if (rU.ok) {
            const users = await rU.json();
            const tbU = document.getElementById('tbodyUsuariosERP');
            if (tbU) {
                tbU.innerHTML = users.map(usr => `
                    <tr>
                        <td>#${usr.id}</td>
                        <td class="fw-semibold">${esc(usr.username)}</td>
                        <td>${esc(usr.nombre)}<br><small class="text-muted">${esc(usr.email)}</small></td>
                        <td>
                            <select class="form-select form-select-sm sel-user-rol" data-id="${usr.id}" ${String(usr.id) === String(u.id) ? 'disabled' : ''}>
                                ${['ADMIN', 'VENDEDOR', 'CLIENTE'].map(rl => `<option value="${rl}" ${usr.rol === rl ? 'selected' : ''}>${rl}</option>`).join('')}
                            </select>
                        </td>
                        <td>
                            ${String(usr.id) === String(u.id) ? '<small class="text-muted">Sesión actual</small>' : `<button type="button" class="btn btn-sm btn-outline-danger btn-del-user" data-id="${usr.id}">Eliminar</button>`}
                        </td>
                    </tr>
                `).join('');

                tbU.querySelectorAll('.sel-user-rol').forEach(sel => sel.addEventListener('change', async () => {
                    const r = await Store.authFetch(`/api/admin/usuarios/${sel.dataset.id}/rol`, { method: 'PUT', body: JSON.stringify({ rol: sel.value }) });
                    const d = await r.json().catch(() => ({}));
                    Store.showSiteToast(d.mensaje || d.error, r.ok ? 'success' : 'danger');
                    await cargarUsuariosYAuditoria();
                }));
                tbU.querySelectorAll('.btn-del-user').forEach(b => b.addEventListener('click', async () => {
                    if (!confirm('¿Eliminar usuario?')) return;
                    const r = await Store.authFetch(`/api/admin/usuarios/${b.dataset.id}`, { method: 'DELETE' });
                    if (r.ok) { Store.showSiteToast('Usuario eliminado', 'info'); await cargarUsuariosYAuditoria(); }
                }));
            }
        }
        if (rA.ok) {
            const logs = await rA.json();
            const tbA = document.getElementById('tbodyAuditoriaERP');
            if (tbA) {
                tbA.innerHTML = logs.map(l => `
                    <tr>
                        <td><small>${new Date(l.created_at).toLocaleString('es-PE')}</small></td>
                        <td><strong>${esc(l.usuario)}</strong> <span class="badge bg-light text-dark border">${esc(l.rol)}</span></td>
                        <td><span class="badge bg-primary-subtle text-primary">${esc(l.accion)}</span></td>
                        <td>${esc(l.entidad)}</td>
                        <td><small>${esc(l.detalle)}</small></td>
                    </tr>
                `).join('');
            }
        }
    }

    document.getElementById('formNuevoUsuarioERP')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('erpNewUsername').value.trim(),
            nombre: document.getElementById('erpNewNombre').value.trim(),
            email: document.getElementById('erpNewEmail').value.trim(),
            password: document.getElementById('erpNewPass').value,
            rol: document.getElementById('erpNewRol').value
        };
        const res = await Store.authFetch('/api/admin/usuarios', { method: 'POST', body: JSON.stringify(payload) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { Store.showSiteToast(d.error || 'Error creando usuario', 'danger'); return; }
        e.target.reset();
        Store.showSiteToast(d.mensaje, 'success');
        await cargarUsuariosYAuditoria();
    });

    updateGateVisibility();
});
