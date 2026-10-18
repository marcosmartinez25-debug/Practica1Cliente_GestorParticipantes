"use strict";

function escribir(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento !== null) {
    elemento.textContent = texto;
  }
}

function iniciar() {
  const idioma = navigator.language ?? "Sin datos";
  escribir("datoIdioma", idioma);

  escribir("datoOrigen", window.location.origin);
  escribir("datoPantalla", screen.width + " × " + screen.height + " píxeles");

  const boton = document.getElementById("botonCerrarVentana");
  if (boton !== null) {
    boton.addEventListener("click", function () {
      window.close();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
