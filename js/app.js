"use strict";

// ---------- 1. Estado ----------

const ORIGEN = window.location.origin;
const DIAS_PREFERENCIAS = 30;

let participantes = [
  {
    id: 483721,
    nombre: "Ana García",
    edad: 17,
    tipo: "estudiante",
    modalidad: "presencial",
    experiencia: 4,
    fechaInscripcion: "2026-10-08T08:30:00.000Z"
  },
  {
    id: 612094,
    nombre: "Luis Ortega",
    edad: 34,
    tipo: "profesional",
    modalidad: "online",
    experiencia: 8.5,
    fechaInscripcion: "2026-10-09T17:05:00.000Z"
  },
  {
    id: 205518,
    nombre: "Marta Ruiz",
    edad: 62,
    tipo: "invitado",
    modalidad: "presencial",
    experiencia: 0,
    fechaInscripcion: "2026-10-10T11:45:00.000Z"
  }
];

let busqueda = "";
let modalidadFiltro = "todas";
let ventanaAyuda = null;
let panelListo = false;

// ---------- 2. Repintado ----------

// Única función a la que se llama cuando cambian los datos.
function refrescar() {
  pintarLista();
  pintarEstadisticas();
  enviarResumen();
}

function mensaje(texto) {
  document.getElementById("mensajeGlobal").textContent = texto;
}

// ---------- 3. Alta ----------

function limpiarErrores() {
  const avisos = document.querySelectorAll("[data-error-de]");
  for (const aviso of avisos) {
    aviso.textContent = "";
  }
  document.getElementById("listaErrores").textContent = "";
  document.getElementById("resumenErrores").hidden = true;
}

function pintarErrores(errores) {
  const lista = document.getElementById("listaErrores");

  for (const campo of Object.keys(errores)) {
    const aviso = document.querySelector('[data-error-de="' + campo + '"]');
    if (aviso !== null) {
      aviso.textContent = errores[campo];
    }
    const linea = document.createElement("li");
    linea.textContent = errores[campo];
    lista.append(linea);
  }

  document.getElementById("resumenErrores").hidden = false;
  mensaje("No se ha dado de alta a nadie: revisa los errores.");
}

function leerModalidad() {
  // Devuelve null si no hay ningún radio marcado.
  const marcado = document.querySelector('input[name="modalidad"]:checked');
  return marcado === null ? "" : marcado.value;
}

function manejarAlta(evento) {
  evento.preventDefault();
  limpiarErrores();

  const datos = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: leerModalidad(),
    experiencia: document.getElementById("experiencia").value
  };

  const revision = validarParticipante(datos);

  if (!revision.valido) {
    pintarErrores(revision.errores); // no se tocan ni el array ni el formulario
    return;
  }

  const id = generarId(participantes);
  if (id === null) {
    mensaje("No queda ningún identificador libre. Inténtalo de nuevo.");
    return;
  }

  participantes.push({
    id: id,
    nombre: revision.valores.nombre,
    edad: revision.valores.edad,
    tipo: revision.valores.tipo,
    modalidad: revision.valores.modalidad,
    experiencia: revision.valores.experiencia,
    fechaInscripcion: new Date().toISOString()
  });

  document.getElementById("formularioAlta").reset();
  refrescar();
  mensaje("Participante dado de alta con el identificador " + id + ".");
}

// ---------- 4. Lista y bajas ----------

function fechaEspanola(textoIso) {
  return new Date(textoIso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Devuelve el nodo, no lo inserta. Sin innerHTML.
function crearTarjeta(participante) {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta");
  tarjeta.classList.add("tarjeta--" + participante.modalidad);
  tarjeta.dataset.id = participante.id;
  tarjeta.dataset.modalidad = participante.modalidad;

  const nombre = document.createElement("h3");
  nombre.classList.add("tarjeta__nombre");
  nombre.textContent = participante.nombre;
  tarjeta.append(nombre);

  const identificador = document.createElement("p");
  identificador.classList.add("tarjeta__id");
  identificador.textContent = "Identificador: " + participante.id;
  tarjeta.append(identificador);

  const datos = document.createElement("ul");
  datos.classList.add("tarjeta__datos");

  const lineas = [
    "Edad: " + participante.edad + " años",
    "Tipo: " + etiquetaTipo(participante.tipo),
    "Modalidad: " + etiquetaModalidad(participante.modalidad),
    "Experiencia: " + participante.experiencia,
    "Inscripción: " + fechaEspanola(participante.fechaInscripcion)
  ];
  for (const linea of lineas) {
    const elemento = document.createElement("li");
    elemento.textContent = linea;
    datos.append(elemento);
  }
  tarjeta.append(datos);

  const etiquetas = document.createElement("p");
  etiquetas.classList.add("tarjeta__etiquetas");

  const edad = document.createElement("span");
  const claseEdad = clasificarEdad(participante.edad);
  edad.classList.add("etiqueta");
  edad.classList.add("etiqueta--" + claseEdad);
  edad.textContent = claseEdad === "menor" ? "Menor de edad" : "Mayor de edad";
  etiquetas.append(edad);

  const experiencia = document.createElement("span");
  const nivel = clasificarExperiencia(participante.experiencia);
  experiencia.classList.add("etiqueta");
  experiencia.classList.add("etiqueta--" + nivel);
  experiencia.textContent = "Experiencia " + nivel;
  etiquetas.append(experiencia);

  tarjeta.append(etiquetas);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.classList.add("boton-baja");
  boton.dataset.accion = "borrar";
  boton.dataset.id = participante.id;
  boton.textContent = "Dar de baja";
  tarjeta.append(boton);

  return tarjeta;
}

// Filtra solo para pintar: las estadísticas usan el array completo.
function filtrar() {
  const visibles = [];

  for (const participante of participantes) {
    const coincideNombre =
      busqueda === "" || participante.nombre.toLowerCase().includes(busqueda);

    let coincideModalidad = true;
    switch (modalidadFiltro) {
      case "presencial":
        coincideModalidad = participante.modalidad === "presencial";
        break;
      case "online":
        coincideModalidad = participante.modalidad === "online";
        break;
      default:
        coincideModalidad = true;
    }

    if (coincideNombre && coincideModalidad) {
      visibles.push(participante);
    }
  }

  return visibles;
}

function pintarLista() {
  const contenedor = document.getElementById("listaParticipantes");
  const aviso = document.getElementById("mensajeListado");

  contenedor.textContent = "";

  const visibles = filtrar();
  for (const participante of visibles) {
    contenedor.append(crearTarjeta(participante));
  }

  if (participantes.length === 0) {
    aviso.textContent = "Todavía no hay participantes inscritos.";
  } else if (visibles.length === 0) {
    aviso.textContent = "Ningún participante coincide con la búsqueda y el filtro.";
  } else {
    aviso.textContent =
      "Mostrando " + visibles.length + " de " + participantes.length + " participantes.";
  }
}

// Un solo listener en el contenedor: los botones se crean y destruyen al repintar.
function manejarClicEnLista(evento) {
  const boton = evento.target.closest('button[data-accion="borrar"]');
  if (boton === null) {
    return;
  }

  const id = Number(boton.dataset.id);

  let posicion = -1;
  for (let i = 0; i < participantes.length; i++) {
    if (participantes[i].id === id) {
      posicion = i;
      break;
    }
  }
  if (posicion === -1) {
    return;
  }

  const nombre = participantes[posicion].nombre;

  if (!window.confirm("¿Seguro que quieres dar de baja a " + nombre + "?")) {
    mensaje("Baja cancelada: no se ha modificado nada.");
    return;
  }

  participantes.splice(posicion, 1);
  refrescar();
  mensaje("Participante " + nombre + " dado de baja.");
}

// ---------- 5. Estadísticas y JSON ----------

function escribir(id, texto) {
  document.getElementById(id).textContent = texto;
}

function media(valor) {
  return valor === null ? "Sin datos" : valor.toFixed(2);
}

function extremo(valor) {
  return valor === null ? "Sin datos" : String(valor);
}

function pintarEstadisticas() {
  const datos = calcularEstadisticas(participantes); // colección completa

  escribir("estTotal", String(datos.total));
  escribir("estMenores", String(datos.menores));
  escribir("estMayores", String(datos.mayores));
  escribir("estEdadMedia", media(datos.edadMedia));
  escribir("estEdadMinima", extremo(datos.edadMinima));
  escribir("estEdadMaxima", extremo(datos.edadMaxima));
  escribir("estPresencial", String(datos.porModalidad.presencial));
  escribir("estOnline", String(datos.porModalidad.online));
  escribir("estEstudiantes", String(datos.porTipo.estudiante));
  escribir("estProfesionales", String(datos.porTipo.profesional));
  escribir("estInvitados", String(datos.porTipo.invitado));
  escribir("estExperienciaPresencial", media(datos.experienciaMediaPresencial));
  escribir(
    "estPrimerMenor",
    datos.primerMenor === null ? "No hay menores de edad" : datos.primerMenor
  );
}

function exportarJson() {
  document.getElementById("areaJson").value = JSON.stringify(participantes, null, 2);
  document.getElementById("resumenJson").hidden = true;
  mensaje("Colección exportada al área de texto.");
}

function pintarErroresJson(errores) {
  const lista = document.getElementById("listaErroresJson");
  lista.textContent = "";

  for (const error of errores) {
    const linea = document.createElement("li");
    linea.textContent = error;
    lista.append(linea);
  }

  document.getElementById("resumenJson").hidden = false;
  mensaje("Importación rechazada: la colección anterior se mantiene intacta.");
}

function importarJson() {
  const texto = document.getElementById("areaJson").value;

  let analizado = null;
  try {
    analizado = JSON.parse(texto);
  } catch (error) {
    pintarErroresJson(["El texto no es JSON válido: " + error.message]);
    return;
  }

  const revision = validarColeccionImportada(analizado);
  if (!revision.valido) {
    pintarErroresJson(revision.errores); // nada de importaciones parciales
    return;
  }

  participantes = revision.participantes;
  document.getElementById("resumenJson").hidden = true;
  refrescar();
  mensaje("Importación correcta: " + participantes.length + " participantes.");
}

// ---------- 6. Panel (postMessage) ----------

function enviarResumen() {
  if (!panelListo) {
    return;
  }

  const resumen = calcularResumenEvento(participantes);

  document.getElementById("panelEvento").contentWindow.postMessage(
    {
      tipo: "resumen-evento",
      total: resumen.total,
      presencial: resumen.presencial,
      online: resumen.online,
      ultimo: resumen.ultimo
    },
    ORIGEN // targetOrigin concreto, nunca "*"
  );
}

function manejarMensaje(evento) {
  const marco = document.getElementById("panelEvento");

  if (evento.origin !== ORIGEN) return;
  if (evento.source !== marco.contentWindow) return;

  const data = evento.data;
  if (data === null || typeof data !== "object") return;
  if (data.tipo !== "panel-listo") return;

  panelListo = true;
  document.getElementById("estadoPanel").textContent =
    "Panel preparado: recibe el resumen en cada cambio.";
  enviarResumen();
}

// ---------- 7. Preferencias y ayuda ----------

const TEMAS = ["claro", "oscuro"];
const TAMANOS = ["normal", "grande"];

// Lo que viene de una cookie no es fiable.
function normalizar(valor, admitidos, porDefecto) {
  return admitidos.includes(valor) ? valor : porDefecto;
}

function aplicarPreferencias(tema, tamano) {
  document.body.dataset.tema = tema;
  document.body.dataset.tamano = tamano;
  document.getElementById("selectorTema").value = tema;
  document.getElementById("selectorTamano").value = tamano;
}

function cargarPreferencias() {
  aplicarPreferencias(
    normalizar(leerCookie("preferenciaTema"), TEMAS, "claro"),
    normalizar(leerCookie("preferenciaTamano"), TAMANOS, "normal")
  );
}

function guardarPreferencias() {
  const tema = document.getElementById("selectorTema").value;
  const tamano = document.getElementById("selectorTamano").value;

  aplicarPreferencias(tema, tamano); // se aplican aunque no se puedan guardar

  // guardarCookie relee la cookie y devuelve si se guardó de verdad.
  const guardadas =
    guardarCookie("preferenciaTema", tema, DIAS_PREFERENCIAS) &&
    guardarCookie("preferenciaTamano", tamano, DIAS_PREFERENCIAS);

  document.getElementById("estadoPreferencias").textContent = guardadas
    ? "Preferencias guardadas 30 días (comprobado releyendo las cookies)."
    : "Aplicadas en esta visita, pero el navegador no ha guardado las cookies.";
}

function restablecerPreferencias() {
  const borradas =
    borrarCookie("preferenciaTema") && borrarCookie("preferenciaTamano");

  aplicarPreferencias("claro", "normal");

  document.getElementById("estadoPreferencias").textContent = borradas
    ? "Cookies eliminadas (comprobado por lectura) y valores por defecto aplicados."
    : "Valores por defecto aplicados, pero alguna cookie sigue presente.";
}

function abrirAyuda() {
  const estado = document.getElementById("estadoAyuda");

  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus();
    estado.textContent = "La ventana de ayuda ya estaba abierta.";
    return;
  }

  ventanaAyuda = window.open("ayuda.html", "ayudaGestor", "width=560,height=680");

  estado.textContent =
    ventanaAyuda === null
      ? "El navegador ha bloqueado la ventana emergente."
      : "Ventana de ayuda abierta.";
}

function cerrarAyuda() {
  const estado = document.getElementById("estadoAyuda");

  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.close();
    ventanaAyuda = null;
    estado.textContent = "Ventana de ayuda cerrada.";
  } else {
    estado.textContent = "No hay ninguna ventana de ayuda abierta.";
  }
}

// ---------- 8. Arranque ----------

function iniciar() {
  cargarPreferencias();

  document.getElementById("formularioAlta").addEventListener("submit", manejarAlta);

  document.getElementById("botonLimpiar").addEventListener("click", function () {
    document.getElementById("formularioAlta").reset();
    limpiarErrores();
    mensaje("Formulario limpio.");
  });

  document.getElementById("listaParticipantes").addEventListener("click", manejarClicEnLista);

  document.getElementById("busqueda").addEventListener("input", function (evento) {
    busqueda = evento.target.value.trim().toLowerCase();
    pintarLista();
  });

  document.getElementById("filtroModalidad").addEventListener("change", function (evento) {
    modalidadFiltro = evento.target.value;
    pintarLista();
  });

  document.getElementById("botonReiniciarFiltros").addEventListener("click", function () {
    busqueda = "";
    modalidadFiltro = "todas";
    document.getElementById("busqueda").value = "";
    document.getElementById("filtroModalidad").value = "todas";
    pintarLista();
  });

  document.getElementById("botonExportar").addEventListener("click", exportarJson);
  document.getElementById("botonImportar").addEventListener("click", importarJson);

  document.getElementById("botonGuardarPreferencias").addEventListener("click", guardarPreferencias);
  document.getElementById("botonRestablecerPreferencias").addEventListener("click", restablecerPreferencias);

  document.getElementById("botonAbrirAyuda").addEventListener("click", abrirAyuda);
  document.getElementById("botonCerrarAyuda").addEventListener("click", cerrarAyuda);

  window.addEventListener("message", manejarMensaje);

  refrescar();
  mensaje("Aplicación lista con 3 participantes de ejemplo.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}