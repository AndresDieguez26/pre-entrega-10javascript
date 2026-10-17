const CLAVE_STORAGE = "plantelFutbol6";


const formulario = document.querySelector("#form-jugadora");
const inputNombre = document.querySelector("#nombre");
const inputPosicion = document.querySelector("#posicion");
const inputEdad = document.querySelector("#edad");
const contenedorJugadoras = document.querySelector("#contenedor-jugadoras");
const mensaje = document.querySelector("#mensaje");
const buscador = document.querySelector("#buscador");
const cantidadJugadoras = document.querySelector("#cantidad-jugadoras");
const tituloFormulario = document.querySelector("#titulo-formulario");
const botonGuardar = document.querySelector("#guardar-jugadora");
const botonCancelar = document.querySelector("#cancelar-edicion");
const botonVaciar = document.querySelector("#vaciar-plantel");
const recordatorio = document.querySelector("#recordatorio");
const botonEvaluar = document.querySelector("#evaluar-plantel");
const panelEvaluacion = document.querySelector("#panel-evaluacion");
const estadoEvaluacion = document.querySelector("#estado-evaluacion");
const resultadoEvaluacion = document.querySelector("#resultado-evaluacion");
let idEnEdicion = null;
let temporizadorMensaje;
const estadoCarga = document.querySelector("#estado-carga");
const botonReintentar = document.querySelector("#reintentar-carga");
const zonaPlantel = document.querySelector("#zona-plantel");
let cargando = false;
let plantelListo = false;

function mostrarMensaje(texto, tipo) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: tipo === "error" ? "error" : "success",
            titleText: texto,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    }
    // El texto en la página también comunica el resultado si el CDN no carga.
    clearTimeout(temporizadorMensaje);
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    temporizadorMensaje = setTimeout(() => {
        mensaje.textContent = "";
        mensaje.className = "mensaje";
    }, 5000);
}

// Destructuring + optional chaining: los datos guardados podrían ser incompletos.
function esJugadoraValida(jugadora) {
    const { id, nombre, posicion, edad } = jugadora ?? {};
    return Number.isSafeInteger(id) && id > 0 &&
        typeof nombre === "string" && Boolean(nombre?.trim()) &&
        typeof posicion === "string" && Boolean(posicion?.trim()) &&
        Number.isInteger(edad) && edad >= 15 && edad <= 60;
}

// Se lee una sola vez al iniciar. Un array vacío guardado NO carga los ejemplos.
function recuperarJugadoras(jugadorasIniciales) {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
        const lista = datos ?? jugadorasIniciales;
        if (!Array.isArray(lista) || !lista.every(esJugadoraValida) ||
            new Set(lista.map(({ id }) => id)).size !== lista.length) {
            mostrarMensaje("Los datos guardados no son válidos. El plantel inicia vacío.", "error");
            return [];
        }
        return lista.map((jugadora) => ({ ...jugadora }));
    } catch {
        mostrarMensaje("No se pudieron recuperar los datos. El plantel inicia vacío.", "error");
        return [];
    }
}

let jugadoras = [];

// Flujo central: actualizar array → guardar JSON → renderizar DOM.
// Si el navegador impide guardar, se restaura el estado anterior.
function actualizarEstado(nuevaLista) {
    const anterior = jugadoras;
    jugadoras = nuevaLista;
    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(jugadoras));
    } catch {
        jugadoras = anterior;
        mostrarMensaje("No se pudo guardar el cambio. Revisá el almacenamiento del navegador.", "error");
        return false;
    }
    // Un informe anterior deja de ser válido cuando cambia el plantel.
    resultadoEvaluacion.textContent = "";
    renderizarJugadoras();
    return true;
}

function renderizarJugadoras() {
    const texto = buscador.value.toLowerCase().trim();
    const lista = jugadoras.filter(({ nombre, posicion }) =>
        nombre.toLowerCase().includes(texto) || posicion.toLowerCase().includes(texto)
    );
    contenedorJugadoras.replaceChildren();
    cantidadJugadoras.textContent = `${jugadoras.length} jugadora${jugadoras.length !== 1 ? "s" : ""}`;
    botonVaciar.disabled = jugadoras.length === 0;

    if (lista.length === 0) {
        const aviso = document.createElement("p");
        aviso.className = "sin-resultados";
        aviso.textContent = jugadoras.length === 0 ? "El plantel está vacío. Agregá una jugadora." : "No se encontraron jugadoras.";
        contenedorJugadoras.append(aviso);
        return;
    }

    lista.forEach((jugadora) => {
        const { id, nombre, posicion, edad } = jugadora;
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-jugadora";
        const titulo = document.createElement("h3");
        titulo.textContent = nombre;
        const detallePosicion = document.createElement("p");
        detallePosicion.textContent = `Posición: ${posicion}`;
        const detalleEdad = document.createElement("p");
        detalleEdad.textContent = `Edad: ${edad} años`;
        tarjeta.append(titulo, detallePosicion, detalleEdad);
        ["editar", "eliminar"].forEach((accion) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = `btn btn-${accion}`;
            boton.dataset.id = id;
            boton.dataset.accion = accion;
            boton.textContent = accion === "editar" ? "Editar" : "Eliminar";
            boton.setAttribute("aria-label", `${boton.textContent} a ${nombre}`);
            tarjeta.append(boton);
        });
        contenedorJugadoras.append(tarjeta);
    });
}

function cancelarEdicion() {
    idEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = "Agregar jugadora";
    botonGuardar.textContent = "+ Agregar jugadora";
    botonCancelar.hidden = true;
}

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = inputNombre.value.trim();
    const posicion = inputPosicion.value.trim();
    const edad = Number(inputEdad.value);
    // Un ID nuevo es mayor que todos los existentes, incluso con altas seguidas.
    const id = idEnEdicion ?? Math.max(Date.now(), ...jugadoras.map(({ id }) => id + 1));
    const nuevaJugadora = { id, nombre, posicion, edad };
    if (!esJugadoraValida(nuevaJugadora)) {
        mostrarMensaje("Completá nombre y posición. La edad debe ser entera, entre 15 y 60.", "error");
        return;
    }
    const editando = idEnEdicion !== null;
    const nuevaLista = editando
        ? jugadoras.map((jugadora) => jugadora.id === id ? nuevaJugadora : jugadora)
        : [...jugadoras, nuevaJugadora];
    if (actualizarEstado(nuevaLista)) {
        mostrarMensaje(editando ? "Jugadora modificada y guardada." : "Jugadora agregada y guardada.", "exito");
        cancelarEdicion();
        inputNombre.focus();
    }
});

// Delegación de eventos: sigue funcionando después de cada renderizado.
contenedorJugadoras.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    const { id: idTexto, accion } = boton.dataset;
    const id = Number(idTexto);
    const seleccionada = jugadoras.find((jugadora) => jugadora.id === id);
    if (!seleccionada) return;
    if (accion === "editar") {
        const { nombre, posicion, edad } = seleccionada;
        idEnEdicion = id;
        inputNombre.value = nombre;
        inputPosicion.value = posicion;
        inputEdad.value = edad;
        tituloFormulario.textContent = "Editar jugadora";
        botonGuardar.textContent = "Guardar cambios";
        botonCancelar.hidden = false;
        inputNombre.focus();
    } else if (accion === "eliminar") {
        if (actualizarEstado(jugadoras.filter((jugadora) => jugadora.id !== id))) {
            if (idEnEdicion === id) cancelarEdicion();
            mostrarMensaje("Jugadora eliminada del plantel y del almacenamiento.", "exito");
        }
    }
});

botonCancelar.addEventListener("click", cancelarEdicion);
buscador.addEventListener("input", renderizarJugadoras);
botonVaciar.addEventListener("click", () => {
    // Guardar [] conserva el vaciado al recargar, sin reponer los ejemplos.
    // Se modifica solo esta clave, sin borrar datos de otras aplicaciones.
    if (actualizarEstado([])) {
        cancelarEdicion();
        mostrarMensaje("Plantel vaciado y guardado.", "exito");
    }
});

// PRE-ENTREGA 9: información contextual tres segundos después de ingresar.
// El navegador puede seguir atendiendo el formulario y la búsqueda.
function programarRecordatorio() {
setTimeout(() => {
    const faltantes = Math.max(0, 6 - jugadoras.length);
    recordatorio.textContent = faltantes > 0
        ? `🔔 Fútbol 6: te falta registrar ${faltantes} jugadora${faltantes === 1 ? "" : "s"} para llegar a seis. Recordá incluir una arquera.`
        : "🔔 Antes del partido, revisá las posiciones y evaluá el plantel para comprobar que tenés una arquera registrada.";
    recordatorio.hidden = false;
}, 3000);
}

// Simula un procesamiento local: no consulta un servidor ni una API.
// La Promesa se resuelve con un informe o se rechaza si no hay jugadoras.
function evaluarPlantelAsync(lista) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (lista.length === 0) {
                reject(new Error("El plantel está vacío. Agregá una jugadora y volvé a evaluar."));
                return;
            }
            const total = lista.length;
            const promedioEdad = lista.reduce((suma, { edad }) => suma + edad, 0) / total;
            const tieneArquera = lista.some(({ posicion }) => posicion.trim().toLowerCase() === "arquera");
            const completo = total >= 6 && tieneArquera;
            resolve({ total, promedioEdad, tieneArquera, completo });
        }, 1200);
    });
}

botonEvaluar.addEventListener("click", async () => {
    // Evita evaluaciones duplicadas, pero permite usar el resto de la interfaz.
    botonEvaluar.disabled = true;
    botonEvaluar.textContent = "Evaluando…";
    panelEvaluacion.setAttribute("aria-busy", "true");
    estadoEvaluacion.textContent = "⏳ Procesando el plantel…";
    resultadoEvaluacion.textContent = "";
    resultadoEvaluacion.className = "";
    const listaEvaluada = jugadoras;

    try {
        const { total, promedioEdad, tieneArquera, completo } = await evaluarPlantelAsync(listaEvaluada);
        // Si se modificó mientras esperaba, no muestra un informe desactualizado.
        if (jugadoras !== listaEvaluada) {
            throw new Error("El plantel cambió durante la evaluación. Volvé a evaluar.");
        }
        const detalle = completo
            ? "Tenés al menos seis jugadoras y una arquera registrada."
            : `Revisá el plantel: ${total < 6 ? `faltan ${6 - total} jugadoras para llegar a seis. ` : ""}${!tieneArquera ? 'Registrá una jugadora con la posición "Arquera".' : ""}`;
        resultadoEvaluacion.textContent = `⚽ ${total} jugadoras · Edad promedio: ${promedioEdad.toFixed(1)} años. ${detalle}`;
    } catch (error) {
        // Captura el rechazo de la Promesa y otros errores de esta operación.
        resultadoEvaluacion.textContent = `⚠️ No se pudo procesar la evaluación. ${error?.message ?? "Intentá de nuevo."}`;
        resultadoEvaluacion.className = "error-evaluacion";
    } finally {
        // Se ejecuta tanto si hubo éxito como si hubo un error.
        botonEvaluar.disabled = false;
        botonEvaluar.textContent = "Evaluar plantel";
        panelEvaluacion.setAttribute("aria-busy", "false");
        estadoEvaluacion.textContent = "✔️ Intento de evaluación finalizado.";
    }
});


// PRE-ENTREGA 10: JSON local → fetch → array → localStorage/DOM.
async function cargarPlantel() {
    if (cargando || plantelListo) return;
    cargando = true;
    zonaPlantel.disabled = true;
    zonaPlantel.setAttribute("aria-busy", "true");
    botonReintentar.hidden = true;
    estadoCarga.textContent = "⏳ Cargando jugadoras…";
    estadoCarga.className = "";
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 10000);

    try {
        const respuesta = await fetch("./data.json", { signal: controlador.signal });
        if (!respuesta.ok) {
            throw new Error(`La petición respondió con el estado ${respuesta.status}.`);
        }
        const datos = await respuesta.json();
        if (!Array.isArray(datos) || !datos.every(esJugadoraValida) ||
            new Set(datos.map(({ id }) => id)).size !== datos.length) {
            throw new Error("El archivo JSON no contiene un plantel válido.");
        }
        // Se consulta siempre el JSON. Si existe un plantel guardado, se respeta.
        jugadoras = recuperarJugadoras(datos);
        renderizarJugadoras();
        plantelListo = true;
        estadoCarga.textContent = "✓ Datos cargados. El plantel está listo para usar.";
        mostrarMensaje("Jugadoras cargadas con éxito.", "exito");
        programarRecordatorio();
    } catch (error) {
        const detalle = error.name === "AbortError"
            ? "La carga superó los 10 segundos."
            : error.message;
        estadoCarga.textContent = `No se pudieron cargar las jugadoras. ${detalle} Revisá la conexión y reintentá. Si abriste el HTML con doble clic, usá Live Server.`;
        estadoCarga.className = "error-evaluacion";
        botonReintentar.hidden = false;
        mostrarMensaje("Error al cargar las jugadoras. Podés reintentar.", "error");
    } finally {
        clearTimeout(limite);
        cargando = false;
        zonaPlantel.disabled = !plantelListo;
        zonaPlantel.setAttribute("aria-busy", "false");
    }
}

botonReintentar.addEventListener("click", cargarPlantel);
cargarPlantel();
