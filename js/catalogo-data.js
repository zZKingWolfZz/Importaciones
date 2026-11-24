/**
 * ==============================================================================
 * CATÁLOGO ESTÁTICO Y RESPALDO OFFLINE - IMPORTACIONES SUPER HUANCAYO
 * Garantiza funcionamiento 100% offline/estático (file:// o servidor estático)
 * sin interferir con el backend Spring Boot + PostgreSQL cuando está activo.
 * ==============================================================================
 */
(function () {
    'use strict';

    window.SUPER_CATALOGO_ESTATICO = [
    {
        "id": 1,
        "sku": "ISH-AUD-001",
        "nombre": "Audífonos Diadema Pro Wireless ANC",
        "marca": "Sony",
        "categoria": "audio",
        "descripcion": "Cancelación activa de ruido híbrida -40dB, drivers de 40mm de alta definición y micrófonos duales para llamadas cristalinas.",
        "especificaciones": "Bluetooth 5.3 • Batería 50h • Carga rápida USB-C • Audio Hi-Res",
        "precio": 219.9,
        "precio_anterior": 269.0,
        "descuento_pct": 18,
        "stock": 17,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-01-ish-aud-001.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 2,
        "sku": "ISH-AUD-002",
        "nombre": "Audífonos Anker Soundcore Life Q30 ANC",
        "marca": "Anker",
        "categoria": "audio",
        "descripcion": "Cancelación híbrida multimodo (Transporte, Interiores, Exteriores) con app Soundcore EQ personalizable.",
        "especificaciones": "Bluetooth 5.0 • 40h ANC activo • Multipunto • Estuche rígido incluido",
        "precio": 259.9,
        "precio_anterior": 325.0,
        "descuento_pct": 20,
        "stock": 12,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-02-ish-aud-002.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 4,
        "sku": "ISH-AUD-004",
        "nombre": "Parlante Portátil JBL Flip Waterproof",
        "marca": "JBL",
        "categoria": "audio",
        "descripcion": "Sonido estéreo potente con bajos profundos PartyBoost y certificación sumergible IP67 para viajes en el Valle del Mantaro.",
        "especificaciones": "20W RMS • IP67 Sumergible • 12h batería • USB-C",
        "precio": 319.9,
        "precio_anterior": 389.0,
        "descuento_pct": 18,
        "stock": 4,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-04-ish-aud-004.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 5,
        "sku": "ISH-ACC-001",
        "nombre": "Smartwatch Active Fit AMOLED IP68",
        "marca": "Xiaomi",
        "categoria": "accesorios",
        "descripcion": "Pantalla AMOLED 1.75\" de alto brillo, monitoreo continuo SpO2, ritmo cardíaco y más de 110 modos deportivos.",
        "especificaciones": "AMOLED 60Hz • GPS integrado • IP68 • 12 días batería",
        "precio": 169.9,
        "precio_anterior": 209.0,
        "descuento_pct": 19,
        "stock": 15,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-05-ish-acc-001.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 8,
        "sku": "ISH-COM-001",
        "nombre": "Teclado Mecánico RGB Compact 60%",
        "marca": "Logitech",
        "categoria": "computo",
        "descripcion": "Switches mecánicos táctiles hot-swap, iluminación RGB programable por tecla y cable USB-C trenzado desmontable.",
        "especificaciones": "Formato 60% Español • Switches Red • Anti-ghosting 100%",
        "precio": 149.9,
        "precio_anterior": 199.0,
        "descuento_pct": 25,
        "stock": 11,
        "stock_minimo": 4,
        "imagen_url": "assets/img/catalogo/prod-08-ish-com-001.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 9,
        "sku": "ISH-COM-002",
        "nombre": "Mouse Inalámbrico Dual Mode 2.4G",
        "marca": "Logitech",
        "categoria": "computo",
        "descripcion": "Mouse ergonómico silencioso con doble conectividad Bluetooth + receptor USB 2.4GHz y sensor óptico 4000 DPI.",
        "especificaciones": "Dual Mode BT/2.4G • Clic silencioso • 4000 DPI • 18 meses pila",
        "precio": 49.9,
        "precio_anterior": 69.0,
        "descuento_pct": 28,
        "stock": 30,
        "stock_minimo": 8,
        "imagen_url": "assets/img/catalogo/prod-09-ish-com-002.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 12,
        "sku": "ISH-TEL-001",
        "nombre": "Cargador Rápido GaN 65W Triple Puerto",
        "marca": "Baseus",
        "categoria": "telefonia",
        "descripcion": "Tecnología Nitruro de Galio (GaN) ultracompacta con 2 puertos USB-C PD 65W y 1 USB-A QC 3.0 para laptops y celulares.",
        "especificaciones": "65W PD 3.0 / PPS • 3 puertos • Protección térmica • Enchufe plano Perú",
        "precio": 89.9,
        "precio_anterior": 119.0,
        "descuento_pct": 25,
        "stock": 21,
        "stock_minimo": 6,
        "imagen_url": "assets/img/catalogo/prod-12-ish-tel-001.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 15,
        "sku": "ISH-HOG-001",
        "nombre": "Aspiradora Robot CleanBot WiFi HEPA",
        "marca": "CleanBot",
        "categoria": "hogar",
        "descripcion": "Limpieza inteligente programable desde app móvil, mapeo giroscópico, succión 2800Pa y retorno automático a base.",
        "especificaciones": "Succión 2800Pa • Filtro HEPA • WiFi App • 120 min autonomía",
        "precio": 389.9,
        "precio_anterior": 469.0,
        "descuento_pct": 17,
        "stock": 7,
        "stock_minimo": 3,
        "imagen_url": "assets/img/catalogo/prod-15-ish-hog-001.jpg",
        "destacado": true,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 3,
        "sku": "ISH-AUD-003",
        "nombre": "Audífonos TWS True Wireless 3D",
        "marca": "Sony",
        "categoria": "audio",
        "descripcion": "Earbuds ultraligeros con estuche de carga magnético, baja latencia gaming y resistencia al sudor IPX5.",
        "especificaciones": "Bluetooth 5.3 • 28h totales • Control táctil • USB-C",
        "precio": 129.9,
        "precio_anterior": 169.0,
        "descuento_pct": 23,
        "stock": 24,
        "stock_minimo": 6,
        "imagen_url": "assets/img/catalogo/prod-03-ish-aud-003.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 6,
        "sku": "ISH-ACC-002",
        "nombre": "Smartwatch Haylou Solar Lite Deportivo IP68",
        "marca": "Haylou",
        "categoria": "accesorios",
        "descripcion": "Reloj inteligente con marco metálico, seguimiento de sueño, notificaciones WhatsApp y resistencia al agua IP68.",
        "especificaciones": "Pantalla 1.38\" • 100 modos deportivos • 20 días standby • IP68",
        "precio": 139.9,
        "precio_anterior": 179.0,
        "descuento_pct": 22,
        "stock": 19,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-06-ish-acc-002.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 7,
        "sku": "ISH-ACC-003",
        "nombre": "Smartband Pro Fitness Pantalla Color",
        "marca": "Xiaomi",
        "categoria": "accesorios",
        "descripcion": "Pulsera deportiva ligera con sensor óptico de pulso, conteo de calorías, alarmas inteligentes y carga magnética.",
        "especificaciones": "AMOLED 1.47\" • 5ATM • 14 días batería • Android/iOS",
        "precio": 99.9,
        "precio_anterior": 139.0,
        "descuento_pct": 28,
        "stock": 22,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-07-ish-acc-003.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 10,
        "sku": "ISH-COM-003",
        "nombre": "Mouse Gaming RGB 12000 DPI Pro",
        "marca": "Logitech",
        "categoria": "computo",
        "descripcion": "Sensor óptico de precisión competitiva con 6 botones programables, memoria integrada y cable paracord ultraligero.",
        "especificaciones": "12000 DPI • Polling 1000Hz • 6 botones • RGB Lightsync",
        "precio": 119.9,
        "precio_anterior": 159.0,
        "descuento_pct": 25,
        "stock": 9,
        "stock_minimo": 4,
        "imagen_url": "assets/img/catalogo/prod-10-ish-com-003.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 11,
        "sku": "ISH-COM-004",
        "nombre": "Hub USB-C 7 en 1 HDMI 4K + Ethernet",
        "marca": "UGREEN",
        "categoria": "computo",
        "descripcion": "Estación de expansión de aluminio para laptops USB-C: salida HDMI 4K@60Hz, carga PD 100W, Gigabit LAN y lectores SD.",
        "especificaciones": "HDMI 4K • Power Delivery 100W • RJ45 1Gbps • 2x USB 3.0",
        "precio": 139.9,
        "precio_anterior": 179.0,
        "descuento_pct": 22,
        "stock": 14,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-11-ish-com-004.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 13,
        "sku": "ISH-TEL-002",
        "nombre": "Power Bank Baseus 20000mAh PD 22.5W",
        "marca": "Baseus",
        "categoria": "telefonia",
        "descripcion": "Batería externa de alta capacidad con pantalla LED digital de porcentaje y carga rápida bidireccional USB-C.",
        "especificaciones": "20000 mAh • Carga rápida 22.5W • 3 salidas • Apto para avión",
        "precio": 129.9,
        "precio_anterior": 169.0,
        "descuento_pct": 23,
        "stock": 16,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-13-ish-tel-002.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 14,
        "sku": "ISH-TEL-003",
        "nombre": "Kit Cable Trenzado USB-C 100W + Adaptador",
        "marca": "UGREEN",
        "categoria": "telefonia",
        "descripcion": "Cable de nylon balístico de 2 metros con chip E-Marker certificado para carga ultrarrápida 100W y transferencia USB-C.",
        "especificaciones": "100W 5A PD • 2 metros • Nylon trenzado • Conectores aluminio",
        "precio": 44.9,
        "precio_anterior": 59.0,
        "descuento_pct": 24,
        "stock": 3,
        "stock_minimo": 5,
        "imagen_url": "assets/img/catalogo/prod-14-ish-tel-003.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    },
    {
        "id": 16,
        "sku": "ISH-HOG-002",
        "nombre": "Router WiFi 6 Dual Band AX1800 Gigabit",
        "marca": "TP-Link",
        "categoria": "hogar",
        "descripcion": "Cobertura de alta velocidad para departamentos y oficinas con 4 antenas de alta ganancia, OFDMA y seguridad WPA3.",
        "especificaciones": "WiFi 6 AX1800 • 4 Puertos Gigabit • Control Parental • App Tether",
        "precio": 229.9,
        "precio_anterior": 279.0,
        "descuento_pct": 18,
        "stock": 10,
        "stock_minimo": 4,
        "imagen_url": "assets/img/catalogo/prod-16-ish-hog-002.jpg",
        "destacado": false,
        "activo": true,
        "created_at": "2026-11-23T14:23:45.726+00:00"
    }
];

    window.SUPER_PEDIDOS_DEMO = {
    "PED-2026-100405": {
        "id": 5,
        "codigo": "PED-2026-100405",
        "cliente_nombre": "María Quispe Huamán",
        "tipo_comprobante": "BOLETA",
        "tipo_entrega": "RETIRO_TIENDA",
        "direccion_entrega": "Av. Giraldez 442, Huancayo",
        "metodo_pago": "CONTRAENTREGA",
        "cupon_codigo": null,
        "subtotal": 139.9,
        "descuento": 0.0,
        "costo_envio": 0.0,
        "op_gravada": 118.56,
        "igv": 21.34,
        "total": 139.9,
        "estado": "CONFIRMADO",
        "created_at": "2026-11-23T08:23:45.735+00:00",
        "updated_at": "2026-11-23T10:23:45.735+00:00",
        "items": [
            {
                "sku": "ISH-ACC-002",
                "nombre_producto": "Smartwatch Haylou Solar Lite Deportivo IP68",
                "cantidad": 1,
                "precio_unitario": 139.9,
                "subtotal": 139.9
            }
        ]
    },
    "PED-2026-100404": {
        "id": 4,
        "codigo": "PED-2026-100404",
        "cliente_nombre": "Clínica Dental Junín S.A.C.",
        "tipo_comprobante": "FACTURA",
        "tipo_entrega": "EXPRESS_180",
        "direccion_entrega": "Calle Real 780, Huancayo",
        "metodo_pago": "YAPE",
        "cupon_codigo": null,
        "subtotal": 389.9,
        "descuento": 0.0,
        "costo_envio": 0.0,
        "op_gravada": 330.42,
        "igv": 59.48,
        "total": 389.9,
        "estado": "EN_CAMINO",
        "created_at": "2026-11-22T14:23:45.735+00:00",
        "updated_at": "2026-11-23T12:23:45.735+00:00",
        "items": [
            {
                "sku": "ISH-HOG-001",
                "nombre_producto": "Aspiradora Robot CleanBot WiFi HEPA",
                "cantidad": 1,
                "precio_unitario": 389.9,
                "subtotal": 389.9
            }
        ]
    }
};

    window.SUPER_CUPONES_DEMO = {
    "SUPER40": {
        "valido": true,
        "codigo": "SUPER40",
        "tipo": "MONTO_FIJO",
        "valor": 40,
        "minimo": 200,
        "mensaje": "Descuento fijo de S/ 40.00 aplicado (Cupón SUPER40)"
    },
    "SUPER10": {
        "valido": true,
        "codigo": "SUPER10",
        "tipo": "PORCENTAJE",
        "valor": 10,
        "minimo": 50,
        "mensaje": "10% de descuento aplicado (Cupón SUPER10)"
    },
    "ENVIOGRATIS": {
        "valido": true,
        "codigo": "ENVIOGRATIS",
        "tipo": "ENVIO_GRATIS",
        "valor": 0,
        "minimo": 100,
        "mensaje": "Envío gratis aplicado (Cupón ENVIOGRATIS)"
    }
};

    var ORDERS_KEY = 'super_offline_orders_v1';

    function isFileProtocol() {
        return typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
    }

    function shouldFallbackResponse(res) {
        if (isFileProtocol()) return true;
        if (!res) return true;
        var ct = (res.headers && res.headers.get ? (res.headers.get('content-type') || '') : '').toLowerCase();
        if (ct.indexOf('application/json') !== -1) return false;
        return res.status === 404 || res.status === 405 || res.status === 501;
    }

    function getOrders() {
        try {
            var raw = localStorage.getItem(ORDERS_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function saveOrder(ped) {
        if (!ped || !ped.codigo) return;
        try {
            var all = getOrders();
            all[String(ped.codigo).toUpperCase()] = ped;
            localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
        } catch (e) { }
    }

    function findOrder(codigo) {
        var key = String(codigo || '').trim().toUpperCase();
        if (!key) return null;
        var saved = getOrders();
        if (saved[key]) return saved[key];
        if (window.SUPER_PEDIDOS_DEMO && window.SUPER_PEDIDOS_DEMO[key]) {
            return window.SUPER_PEDIDOS_DEMO[key];
        }
        return null;
    }

    function saveSubmission(storageKey, entry) {
        try {
            var raw = localStorage.getItem(storageKey);
            var list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            list.push(entry);
            localStorage.setItem(storageKey, JSON.stringify(list));
        } catch (e) { }
    }

    window.SuperOffline = {
        isFileProtocol: isFileProtocol,
        shouldFallbackResponse: shouldFallbackResponse,
        getOrders: getOrders,
        saveOrder: saveOrder,
        findOrder: findOrder,
        saveSubmission: saveSubmission
    };
})();
