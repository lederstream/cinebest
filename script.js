const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbKwdz96U-UvqfTDtGPL0zUziDnARLOz249Gdc4CApl_PQ-nt1jQpC15S_UOwawE2SGK2yms6_AwXM/pub?gid=0&single=true&output=json";
const TIPO_CAMBIO = 3.6;
let productos = [];

async function cargarDatos() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.json();

        // Extraer los datos de las filas, que están bajo "feed.entry" en el JSON
        const rows = data.feed.entry;

        // Mapear los datos de las filas a un formato más fácil de usar
        productos = rows.map(row => ({
            id: row.gsx$id.$t,
            nombre: row.gsx$nombredelservicio.$t,
            imagen: row.gsx$imagen.$t,
            descripcion: row.gsx$descripción.$t,
            categoria: row.gsx$categoría.$t,
            detalles: row.gsx$detalles.$t?.trim() || "",
            planesPersonalizados: (row.gsx$planesyprecios.$t || "").split("|").map(entry => {
                const [nombre, precio] = entry.split(":");
                return {
                    nombre: nombre?.trim(),
                    precio: parseFloat(precio)
                };
            }).filter(p => p.nombre && !isNaN(p.precio))
        }));

        actualizarCategorias();
        mostrarProductos(productos);
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        document.getElementById("productos").innerHTML = "<p>Error al cargar el catálogo. Por favor, inténtelo de nuevo más tarde.</p>";
    }
}

function actualizarCategorias() {
    const select = document.getElementById("categoryFilter");
    const categorias = [...new Set(productos.map(p => p.categoria))];
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function mostrarProductos(lista) {
    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron servicios que coincidan con la búsqueda.</p>";
        return;
    }

    lista.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        const selector = document.createElement("select");
        selector.classList.add("plan-dropdown");

        let precios = {};
        p.planesPersonalizados.forEach((plan, idx) => {
            const option = document.createElement("option");
            option.value = idx;
            option.textContent = plan.nombre;
            selector.appendChild(option);
            precios[idx] = plan.precio;
        });

        const precioInicial = precios["0"] || 0;
        const soles = precioInicial.toFixed(2);
        const dolares = (precioInicial / TIPO_CAMBIO).toFixed(2);

        card.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p>${p.descripcion}</p>
        `;

        const planDiv = document.createElement("div");
        planDiv.className = "plan-selector";
        planDiv.appendChild(selector);

        const precio = document.createElement("p");
        precio.className = "price";
        precio.innerHTML = `
            <span class="soles">S/. ${soles}</span> |
            <span class="dolares">US$ ${dolares}</span>
        `;

        selector.addEventListener("change", () => {
            const val = selector.value;
            const nuevoPrecio = precios[val];
            if (!isNaN(nuevoPrecio)) {
                precio.querySelector(".soles").textContent = `S/. ${nuevoPrecio.toFixed(2)}`;
                precio.querySelector(".dolares").textContent = `US$ ${(nuevoPrecio / TIPO_CAMBIO).toFixed(2)}`;
            }
        });

        const botonDetalles = document.createElement("button");
        botonDetalles.textContent = "Detalles";
        botonDetalles.className = "boton-detalles";
        botonDetalles.onclick = () => mostrarModalDetalles(p.nombre, p.detalles);

        card.appendChild(planDiv);
        card.appendChild(precio);
        card.appendChild(botonDetalles);
        contenedor.appendChild(card);
    });
}

function mostrarModalDetalles(nombre, detalle) {
    const modal = document.getElementById("modalDetalles");
    const titulo = document.getElementById("modalTitle");
    const cuerpo = document.getElementById("modalDescription");
    titulo.textContent = nombre;
    cuerpo.innerHTML = detalle.replace(/\n/g, "<br>");
    modal.style.display = "flex";
}

function cerrarModalDetalles() {
    document.getElementById("modalDetalles").style.display = "none";
}

document.getElementById("searchInput").addEventListener("input", filtrar);
document.getElementById("categoryFilter").addEventListener("change", filtrar);

function filtrar() {
    const texto = document.getElementById("searchInput").value.toLowerCase();
    const categoria = document.getElementById("categoryFilter").value;
    const filtrados = productos.filter(p =>
        (categoria === "Todas" || p.categoria === categoria) &&
        (p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto))
    );
    mostrarProductos(filtrados);
}

// Inicialización
cargarDatos();
