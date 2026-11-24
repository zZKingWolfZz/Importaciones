/**
 * ==============================================================================
 * CHECKOUT COMERCIAL SUNAT & YAPE/PLIN/TARJETA - IMPORTACIONES SUPER HUANCAYO
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const Store = window.SuperStore;
    const esc = Store.escapeHtml;

    const emptyBox = document.getElementById('checkoutEmptyBox');
    const checkoutGrid = document.getElementById('checkoutMainGrid');
    const receiptBox = document.getElementById('checkoutReceiptBox');
    const itemsListEl = document.getElementById('checkoutItemsList');
    const tipoCompSel = document.getElementById('chkTipoComprobante');
    const razonGroup = document.getElementById('chkRazonSocialGroup');
    const docLabel = document.getElementById('chkDocLabel');
    const docInput = document.getElementById('chkDoc');
    const entregaRadios = document.querySelectorAll('input[name="chkEntrega"]');
    const dirGroup = document.getElementById('chkDireccionGroup');
    const dirInput = document.getElementById('chkDireccion');
    const pagoRadios = document.querySelectorAll('input[name="chkPago"]');
    const yapePlinPanel = document.getElementById('chkYapePlinPanel');
    const tarjetaPanel = document.getElementById('chkTarjetaPanel');
    const refPagoInput = document.getElementById('chkReferenciaPago');
    const cuponInput = document.getElementById('chkCuponInput');
    const btnAplicarCupon = document.getElementById('btnAplicarCupon');
    const cuponFeedback = document.getElementById('chkCuponFeedback');
    const form = document.getElementById('checkoutForm');
    const errBox = document.getElementById('checkoutErrorBox');

    let appliedCoupon = null;

    window.autofillCheckoutUser = function () {
        const u = Store.getAuthUser();
        if (!u) return;
        const nEl = document.getElementById('chkNombre');
        const cEl = document.getElementById('chkCorreo');
        const tEl = document.getElementById('chkTelefono');
        const dEl = document.getElementById('chkDireccion');
        if (nEl && !nEl.value) nEl.value = u.nombre || '';
        if (cEl && !cEl.value) cEl.value = u.email || '';
        if (tEl && !tEl.value && u.telefono) tEl.value = u.telefono;
        if (docInput && !docInput.value && u.dni) docInput.value = u.dni;
        if (dEl && !dEl.value && u.direccion) dEl.value = u.direccion;
    };

    function getSelectedEntrega() {
        return document.querySelector('input[name="chkEntrega"]:checked')?.value || 'RETIRO_TIENDA';
    }

    function getSelectedPago() {
        return document.querySelector('input[name="chkPago"]:checked')?.value || 'YAPE';
    }

    function calcTotals() {
        const cart = Store.getCart();
        const subtotal = cart.reduce((acc, it) => acc + (Number(it.price) * Number(it.qty)), 0);
        const entrega = getSelectedEntrega();
        let envio = 0;
        if (entrega === 'EXPRESS_180') {
            envio = subtotal >= 250 ? 0 : 12;
        } else if (entrega === 'PROVINCIA') {
            envio = 18;
        }

        let descuento = 0;
        if (appliedCoupon) {
            if (appliedCoupon.tipo === 'ENVIO_GRATIS') {
                descuento = envio;
            } else if (appliedCoupon.tipo === 'PORCENTAJE') {
                descuento = Number(((subtotal * Number(appliedCoupon.valor)) / 100).toFixed(2));
            } else if (appliedCoupon.tipo === 'MONTO_FIJO') {
                descuento = Math.min(subtotal, Number(appliedCoupon.valor));
            }
        }

        const total = Math.max(0, subtotal + envio - descuento);
        const opGravada = total / 1.18;
        const igv = total - opGravada;

        document.getElementById('sumSubtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
        document.getElementById('sumEnvio').textContent = envio === 0 ? 'GRATIS' : `S/ ${envio.toFixed(2)}`;
        const descRow = document.getElementById('sumDescuentoRow');
        if (descuento > 0) {
            descRow.classList.remove('d-none');
            document.getElementById('sumDescuento').textContent = `- S/ ${descuento.toFixed(2)}`;
        } else {
            descRow.classList.add('d-none');
        }
        document.getElementById('sumOpGravada').textContent = `S/ ${opGravada.toFixed(2)}`;
        document.getElementById('sumIgv').textContent = `S/ ${igv.toFixed(2)}`;
        document.getElementById('sumTotal').textContent = `S/ ${total.toFixed(2)}`;
    }

    function renderCartSummary() {
        const cart = Store.getCart();
        if (!cart.length) {
            emptyBox.classList.remove('d-none');
            checkoutGrid.classList.add('d-none');
            return;
        }
        emptyBox.classList.add('d-none');
        checkoutGrid.classList.remove('d-none');

        itemsListEl.innerHTML = cart.map(it => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2 small">
                <div class="d-flex align-items-center gap-2 min-w-0">
                    <img src="${esc(it.img)}" alt="" class="rounded border" style="width:42px;height:42px;object-fit:cover;">
                    <div class="min-w-0">
                        <div class="fw-semibold text-truncate" style="max-width:200px;">${esc(it.name)}</div>
                        <span class="text-muted">${it.qty} x S/ ${Number(it.price).toFixed(2)}</span>
                    </div>
                </div>
                <strong class="text-nowrap">S/ ${(Number(it.price) * it.qty).toFixed(2)}</strong>
            </div>
        `).join('');

        calcTotals();
    }

    tipoCompSel?.addEventListener('change', () => {
        const isFact = tipoCompSel.value === 'FACTURA';
        razonGroup.classList.toggle('d-none', !isFact);
        docLabel.textContent = isFact ? 'RUC (11 dígitos) *' : 'DNI (8 dígitos) *';
        docInput.maxLength = isFact ? 11 : 8;
        docInput.placeholder = isFact ? '20601234567' : '71234568';
    });

    entregaRadios.forEach(r => r.addEventListener('change', () => {
        const ent = getSelectedEntrega();
        dirGroup.classList.toggle('d-none', ent === 'RETIRO_TIENDA');
        dirInput.required = (ent !== 'RETIRO_TIENDA');
        calcTotals();
    }));

    pagoRadios.forEach(r => r.addEventListener('change', () => {
        const p = getSelectedPago();
        yapePlinPanel.classList.toggle('d-none', !(p === 'YAPE' || p === 'PLIN'));
        tarjetaPanel.classList.toggle('d-none', p !== 'TARJETA');
        refPagoInput.required = (p === 'YAPE' || p === 'PLIN');
    }));

    function aplicarCuponOffline(code, subtotal) {
        const cup = window.SUPER_CUPONES_DEMO && window.SUPER_CUPONES_DEMO[code];
        if (!cup) {
            appliedCoupon = null;
            cuponFeedback.className = 'small mt-1 text-danger fw-semibold';
            cuponFeedback.textContent = 'Cupón inválido o expirado';
        } else if (subtotal < Number(cup.minimo || 0)) {
            appliedCoupon = null;
            cuponFeedback.className = 'small mt-1 text-danger fw-semibold';
            cuponFeedback.textContent = `El cupón requiere un subtotal mínimo de S/ ${Number(cup.minimo).toFixed(2)}`;
        } else {
            appliedCoupon = cup;
            cuponFeedback.className = 'small mt-1 text-success fw-semibold';
            cuponFeedback.textContent = '✓ ' + cup.mensaje;
        }
        calcTotals();
    }

    function renderReceipt(ped) {
        Store.clearCart();
        checkoutGrid.classList.add('d-none');
        receiptBox.classList.remove('d-none');

        document.getElementById('recCodigo').textContent = ped.codigo;
        document.getElementById('recComprobante').textContent = ped.tipo_comprobante;
        document.getElementById('recCliente').textContent = ped.cliente_nombre + ' (' + ped.cliente_dni_ruc + ')';
        document.getElementById('recEntrega').textContent = ped.tipo_entrega + ' — ' + ped.direccion_entrega;
        document.getElementById('recPago').textContent = ped.metodo_pago + (ped.referencia_pago ? ' (' + ped.referencia_pago + ')' : '');
        document.getElementById('recTotal').textContent = `S/ ${Number(ped.total).toFixed(2)}`;
        document.getElementById('recItems').innerHTML = (ped.items || []).map(it => `
            <tr>
                <td>${esc(it.sku)}</td>
                <td>${esc(it.nombre_producto)}</td>
                <td class="text-center">${it.cantidad}</td>
                <td class="text-end">S/ ${Number(it.precio_unitario).toFixed(2)}</td>
                <td class="text-end fw-semibold">S/ ${Number(it.subtotal).toFixed(2)}</td>
            </tr>
        `).join('');
        document.getElementById('recTrackBtn').href = `seguimiento.html?codigo=${encodeURIComponent(ped.codigo)}`;
        document.getElementById('recWspBtn').href = Store.buildWhatsAppUrl(`Hola Importaciones Super Huancayo! Acabo de realizar el pedido ${ped.codigo} por S/ ${Number(ped.total).toFixed(2)} (${ped.metodo_pago}).`);
        Store.showSiteToast(`¡Pedido ${ped.codigo} confirmado!`, 'success');
    }

    function crearPedidoOffline(payload, cart) {
        const subtotal = Number(cart.reduce((acc, it) => acc + (Number(it.price) * Number(it.qty)), 0).toFixed(2));
        let envio = 0;
        if (payload.tipo_entrega === 'EXPRESS_180') {
            envio = subtotal >= 250 ? 0 : 12;
        } else if (payload.tipo_entrega === 'PROVINCIA') {
            envio = 18;
        }
        let descuento = 0;
        if (appliedCoupon) {
            if (appliedCoupon.tipo === 'ENVIO_GRATIS') {
                descuento = envio;
            } else if (appliedCoupon.tipo === 'PORCENTAJE') {
                descuento = Number(((subtotal * Number(appliedCoupon.valor)) / 100).toFixed(2));
            } else if (appliedCoupon.tipo === 'MONTO_FIJO') {
                descuento = Math.min(subtotal, Number(appliedCoupon.valor));
            }
        }
        const total = Number(Math.max(0, subtotal + envio - descuento).toFixed(2));
        const opGravada = Number((total / 1.18).toFixed(2));
        const igv = Number((total - opGravada).toFixed(2));
        const catalogo = window.SUPER_CATALOGO_ESTATICO || [];
        const items = cart.map(it => {
            const prod = catalogo.find(p => Number(p.id) === Number(it.id));
            return {
                sku: (prod && prod.sku) ? prod.sku : ('ISH-LOC-' + it.id),
                nombre_producto: it.name,
                cantidad: Number(it.qty),
                precio_unitario: Number(it.price),
                subtotal: Number((Number(it.price) * Number(it.qty)).toFixed(2))
            };
        });
        const ped = {
            id: Date.now(),
            codigo: 'PED-2026-' + String(Math.floor(100000 + Math.random() * 899999)),
            cliente_nombre: payload.cliente_nombre,
            tipo_comprobante: payload.tipo_comprobante,
            cliente_dni_ruc: payload.cliente_dni_ruc,
            razon_social: payload.razon_social || null,
            cliente_telefono: payload.cliente_telefono,
            cliente_correo: payload.cliente_correo,
            tipo_entrega: payload.tipo_entrega,
            direccion_entrega: payload.direccion_entrega || 'Av. Giraldez 442, Huancayo',
            metodo_pago: payload.metodo_pago,
            referencia_pago: payload.referencia_pago || 'Modo Estático Local',
            cupon_codigo: payload.cupon_codigo || null,
            notas: payload.notas || '',
            subtotal,
            descuento,
            costo_envio: envio,
            op_gravada: opGravada,
            igv,
            total,
            estado: 'PENDIENTE',
            created_at: new Date().toISOString(),
            items
        };
        if (window.SuperOffline) {
            window.SuperOffline.saveOrder(ped);
        }
        renderReceipt(ped);
    }

    btnAplicarCupon?.addEventListener('click', async () => {
        const code = (cuponInput.value || '').trim().toUpperCase();
        const subtotal = Store.getCart().reduce((a, b) => a + b.price * b.qty, 0);
        cuponFeedback.classList.remove('d-none');
        if (!code) {
            appliedCoupon = null;
            cuponFeedback.className = 'small mt-1 text-danger';
            cuponFeedback.textContent = 'Ingrese un código de cupón.';
            calcTotals();
            return;
        }
        try {
            if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                aplicarCuponOffline(code, subtotal);
                return;
            }
            const res = await fetch('/api/cupones/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: code, subtotal })
            });
            if (!res.ok && window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                aplicarCuponOffline(code, subtotal);
                return;
            }
            const data = await res.json();
            if (!res.ok) {
                appliedCoupon = null;
                cuponFeedback.className = 'small mt-1 text-danger fw-semibold';
                cuponFeedback.textContent = data.error || 'Cupón inválido';
            } else {
                appliedCoupon = data;
                cuponFeedback.className = 'small mt-1 text-success fw-semibold';
                cuponFeedback.textContent = '✓ ' + data.mensaje;
            }
            calcTotals();
        } catch (err) {
            if (window.SUPER_CUPONES_DEMO) {
                aplicarCuponOffline(code, subtotal);
                return;
            }
            cuponFeedback.className = 'small mt-1 text-danger';
            cuponFeedback.textContent = 'Error validando cupón.';
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.classList.add('d-none');

        const cart = Store.getCart();
        if (!cart.length) return;

        const pago = getSelectedPago();
        const payload = {
            cliente_nombre: document.getElementById('chkNombre').value.trim(),
            tipo_comprobante: tipoCompSel.value,
            cliente_dni_ruc: docInput.value.replace(/[^0-9]/g, ''),
            razon_social: document.getElementById('chkRazonSocial').value.trim(),
            cliente_telefono: document.getElementById('chkTelefono').value.replace(/[^0-9]/g, ''),
            cliente_correo: document.getElementById('chkCorreo').value.trim(),
            tipo_entrega: getSelectedEntrega(),
            direccion_entrega: dirInput.value.trim(),
            metodo_pago: pago,
            referencia_pago: pago === 'TARJETA' ? ('VISA-' + (document.getElementById('chkCardNum').value.slice(-4) || '9012')) : refPagoInput.value.trim(),
            cupon_codigo: appliedCoupon ? appliedCoupon.codigo : '',
            notas: document.getElementById('chkNotas').value.trim(),
            items: cart.map(i => ({ producto_id: i.id, cantidad: i.qty }))
        };

        const btn = document.getElementById('btnConfirmarPedido');
        btn.disabled = true;
        btn.textContent = 'Procesando pedido...';

        try {
            if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                crearPedidoOffline(payload, cart);
                return;
            }
            const res = await Store.authFetch('/api/pedidos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok && window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                crearPedidoOffline(payload, cart);
                return;
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                errBox.textContent = data.error || 'Verifique los datos ingresados.';
                errBox.classList.remove('d-none');
                return;
            }

            renderReceipt(data.pedido);
        } catch (err) {
            if (window.SuperOffline) {
                crearPedidoOffline(payload, cart);
                return;
            }
            errBox.textContent = 'Error de conexión procesando el pedido.';
            errBox.classList.remove('d-none');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirmar y Generar Comprobante';
        }
    });

    window.autofillCheckoutUser();
    renderCartSummary();
});
