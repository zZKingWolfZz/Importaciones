/**
 * ==============================================================================
 * CATÁLOGO DINÁMICO DESDE POSTGRESQL - IMPORTACIONES SUPER HUANCAYO
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    const inputBuscar = document.getElementById('inputBuscarCatalogo');
    const btnBuscar = document.getElementById('btnBuscarCatalogo');
    const radiosCat = document.querySelectorAll('input[name="filtroCat"]');
    const marcasContainer = document.getElementById('marcasFiltroContainer');
    const inputPrecioMin = document.getElementById('precioMin');
    const inputPrecioMax = document.getElementById('precioMax');
    const btnFiltrarPrecio = document.getElementById('btnFiltrarPrecio');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    const btnResetEmpty = document.getElementById('btnResetCatalogoVacio');
    const selectOrdenar = document.getElementById('ordenarPor');
    const contadorResultados = document.getElementById('contadorResultados');
    const pillsContenedor = document.getElementById('pillsFiltrosActivos');
    const gridProductos = document.getElementById('catalogoGridProductos');
    const emptyState = document.getElementById('noProductsCatalogo');

    let allProducts = [];
    let usingOfflineData = false;

    const urlParams = new URLSearchParams(window.location.search);
    const catUrl = urlParams.get('cat');
    const queryUrl = urlParams.get('q');

    if (catUrl) {
        radiosCat.forEach(r => { if (r.value === catUrl) r.checked = true; });
    }
    if (queryUrl && inputBuscar) {
        inputBuscar.value = queryUrl;
    }

    function poblarCatalogo(lista) {
        allProducts = Array.isArray(lista) ? lista.slice() : [];

        // Contadores de categoría dinámicos
        const counts = { all: allProducts.length };
        const marcasMap = new Map();
        allProducts.forEach(p => {
            counts[p.categoria] = (counts[p.categoria] || 0) + 1;
            const m = (p.marca || '').trim();
            if (m) marcasMap.set(m, (marcasMap.get(m) || 0) + 1);
        });

        radiosCat.forEach(r => {
            const badge = r.closest('label')?.querySelector('.badge');
            if (badge) badge.textContent = String(counts[r.value] || 0);
        });

        // Poblar marcas reales
        if (marcasContainer) {
            marcasContainer.innerHTML = Array.from(marcasMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([marca, count]) => `
                    <label class="d-flex justify-content-between align-items-center cursor-pointer">
                        <span><input type="checkbox" class="form-check-input me-1 filtro-marca" value="${window.SuperStore.escapeHtml(marca)}"> ${window.SuperStore.escapeHtml(marca.toUpperCase())}</span>
                        <span class="badge bg-light text-muted border">${count}</span>
                    </label>
                `).join('');
            marcasContainer.querySelectorAll('.filtro-marca').forEach(cb => cb.addEventListener('change', aplicarFiltrosYOrden));
        }

        aplicarFiltrosYOrden();
    }

    async function cargarCatalogoDesdeBD() {
        if (!gridProductos) return;
        gridProductos.innerHTML = '<div class="col-12 text-center py-5 text-muted">Cargando inventario real...</div>';
        try {
            if (window.SuperOffline && window.SuperOffline.isFileProtocol()) {
                throw new Error('OFFLINE_FILE');
            }
            const res = await fetch('/api/productos', { cache: 'no-store' });
            if (!res.ok) {
                if (window.SuperOffline && window.SuperOffline.shouldFallbackResponse(res)) {
                    throw new Error('OFFLINE_STATIC');
                }
                throw new Error('HTTP ' + res.status);
            }
            const data = await res.json();
            usingOfflineData = false;
            poblarCatalogo(data);
        } catch (err) {
            if (Array.isArray(window.SUPER_CATALOGO_ESTATICO) && window.SUPER_CATALOGO_ESTATICO.length) {
                usingOfflineData = true;
                poblarCatalogo(window.SUPER_CATALOGO_ESTATICO);
                return;
            }
            gridProductos.innerHTML = '<div class="col-12 text-center py-5 text-danger">Error cargando catálogo desde el servidor.</div>';
        }
    }

    function aplicarFiltrosYOrden() {
        const textoBusqueda = inputBuscar ? inputBuscar.value.toLowerCase().trim() : '';
        const catSeleccionada = document.querySelector('input[name="filtroCat"]:checked')?.value || 'all';
        const marcasSeleccionadas = Array.from(document.querySelectorAll('.filtro-marca:checked')).map(c => c.value.toLowerCase());
        const precioMin = parseFloat(inputPrecioMin?.value) || 0;
        const precioMax = parseFloat(inputPrecioMax?.value) || Infinity;
        const criterio = selectOrdenar?.value || 'relevancia';

        const pills = [];
        if (catSeleccionada !== 'all') pills.push(`Categoría: ${catSeleccionada}`);
        if (marcasSeleccionadas.length > 0) pills.push(`Marcas: ${marcasSeleccionadas.join(', ')}`);
        if (precioMin > 0 || precioMax < Infinity) pills.push(`Precio: S/ ${precioMin} - S/ ${precioMax === Infinity ? '...' : precioMax}`);
        if (textoBusqueda) pills.push(`"${textoBusqueda}"`);

        let filtered = allProducts.filter(p => {
            const coincideCat = (catSeleccionada === 'all' || p.categoria === catSeleccionada);
            const coincideMarca = (marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes((p.marca || '').toLowerCase()));
            const precio = Number(p.precio || 0);
            const coincidePrecio = (precio >= precioMin && precio <= precioMax);
            const fullText = `${p.nombre} ${p.marca} ${p.categoria} ${p.sku} ${p.descripcion || ''}`.toLowerCase();
            const coincideTexto = (!textoBusqueda || fullText.includes(textoBusqueda));
            return coincideCat && coincideMarca && coincidePrecio && coincideTexto;
        });

        filtered = filtered.slice().sort((a, b) => {
            if (criterio === 'menor-precio') return Number(a.precio) - Number(b.precio);
            if (criterio === 'mayor-precio') return Number(b.precio) - Number(a.precio);
            if (criterio === 'descuento') return Number(b.descuento_pct || 0) - Number(a.descuento_pct || 0);
            return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0);
        });

        if (filtered.length === 0) {
            gridProductos.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            gridProductos.innerHTML = filtered.map(p => window.SuperStore.buildProductCardHtml(p, 'col')).join('');
            window.SuperStore.bindProductCards(gridProductos, filtered);
        }

        if (contadorResultados) {
            contadorResultados.textContent = `Mostrando ${filtered.length} de ${allProducts.length} productos`;
        }
        if (pillsContenedor) {
            pillsContenedor.innerHTML = pills.length > 0
                ? pills.map(p => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle">${window.SuperStore.escapeHtml(p)}</span>`).join('')
                : `<span class="badge bg-primary-subtle text-primary border border-primary-subtle">${usingOfflineData ? 'Catálogo Offline Huancayo' : 'Inventario Real Huancayo'}</span>`;
        }
    }

    function limpiarTodosLosFiltros() {
        if (inputBuscar) inputBuscar.value = '';
        radiosCat.forEach(r => { r.checked = (r.value === 'all'); });
        document.querySelectorAll('.filtro-marca').forEach(c => { c.checked = false; });
        if (inputPrecioMin) inputPrecioMin.value = '';
        if (inputPrecioMax) inputPrecioMax.value = '';
        if (selectOrdenar) selectOrdenar.value = 'relevancia';
        aplicarFiltrosYOrden();
    }

    if (inputBuscar) {
        inputBuscar.addEventListener('input', aplicarFiltrosYOrden);
        inputBuscar.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarFiltrosYOrden(); } });
    }
    btnBuscar?.addEventListener('click', aplicarFiltrosYOrden);
    radiosCat.forEach(r => r.addEventListener('change', aplicarFiltrosYOrden));
    btnFiltrarPrecio?.addEventListener('click', aplicarFiltrosYOrden);
    selectOrdenar?.addEventListener('change', aplicarFiltrosYOrden);
    btnLimpiar?.addEventListener('click', limpiarTodosLosFiltros);
    btnResetEmpty?.addEventListener('click', limpiarTodosLosFiltros);

    await cargarCatalogoDesdeBD();
});
