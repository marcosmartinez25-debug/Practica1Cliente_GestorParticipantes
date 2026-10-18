"use strict";

const ORIGEN_PRINCIPAL = window.location.origin; // misma aplicación, mismo origen
const INTERVALO_AVISO = 300;   // milisegundos entre avisos de "panel listo"
const MAXIMO_AVISOS = 20;      // tope de reintentos: nunca se queda en bucle

let avisosEnviados = 0;
let temporizador = null;

function vaciar(elemento) {
  while (elemento.firstChild !== null) {
    elemento.removeChild(elemento.firstChild);
  }
}

function crearLinea(etiqueta, valor) {
  const parrafo = document.createElement("p");
  parrafo.classList.add("panel__linea");

  const titulo = document.createElement("span");
  titulo.classList.add("panel__etiqueta");
  titulo.textContent = etiqueta;

  const dato = document.createElement("strong");
  dato.classList.add("panel__valor");
  dato.textContent = valor;

  parrafo.append(titulo);
  parrafo.append(dato);
  return parrafo;
}

function formatearFechaEspanola(textoIso) {
  const fecha = new Date(textoIso);
  if (Number.isNaN(fecha.getTime())) {
    return "Fecha no disponible";
  }
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function pintarResumen(data) {
  const contenedor = document.getElementById("contenidoPanel");
  if (contenedor === null) {
    return;
  }

  vaciar(contenedor);

  if (data.total === 0) {
    const vacio = document.createElement("p");
    vacio.classList.add("panel__vacio");
    vacio.textContent = "Sin inscripciones";
    contenedor.append(vacio);
    return;
  }

  contenedor.append(crearLinea("Total de inscritos: ", String(data.total)));
  contenedor.append(crearLinea("Presenciales: ", String(data.presencial)));
  contenedor.append(crearLinea("Online: ", String(data.online)));

  if (data.ultimo === null) {
    contenedor.append(crearLinea("Última inscripción: ", "Sin datos"));
  } else {
    contenedor.append(crearLinea("Última inscripción: ", data.ultimo.nombre));
    contenedor.append(
      crearLinea("Fecha: ", formatearFechaEspanola(data.ultimo.fechaInscripcion))
    );
  }
}

function manejarMensaje(evento) {
  if (evento.origin !== ORIGEN_PRINCIPAL) {
    return; // otro origen: se ignora sin tocar la interfaz
  }
  if (evento.source !== window.parent) {
    return; // no viene de la página que nos incrusta
  }
  if (!esResumenValido(evento.data)) {
    return; // estructura, tipos o valores inesperados: se descarta
  }

  detenerAvisos();
  pintarResumen(evento.data);
}

function avisarQueEstoyListo() {
  if (window.parent === window) {
    return; // abierto fuera del iframe: no hay a quién avisar
  }
  window.parent.postMessage({ tipo: "panel-listo" }, ORIGEN_PRINCIPAL);
}

function detenerAvisos() {
  if (temporizador !== null) {
    window.clearInterval(temporizador);
    temporizador = null;
  }
}

function iniciar() {
  // Primero se instala el receptor y solo después se avisa de que está listo.
  window.addEventListener("message", manejarMensaje);
  avisarQueEstoyListo();

  temporizador = window.setInterval(function () {
    avisosEnviados++;
    if (avisosEnviados >= MAXIMO_AVISOS) {
      detenerAvisos();
      return;
    }
    avisarQueEstoyListo();
  }, INTERVALO_AVISO);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
