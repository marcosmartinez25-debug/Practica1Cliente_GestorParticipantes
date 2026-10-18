"use strict";
/** Construye los atributos comunes de la cookie. */
function atributosCookie(maxEdadSegundos) {
  let atributos = "; Path=/; SameSite=Lax; Max-Age=" + maxEdadSegundos;
  if (window.location.protocol === "https:") {
    atributos += "; Secure";
  }
  return atributos;
}

/**
 * Lee una cookie por su nombre y descodifica su valor.
 * @returns {string|null} el valor, o null si no existe
 */
function leerCookie(nombre) {
  const buscado = encodeURIComponent(String(nombre));
  const cadena = document.cookie;

  if (typeof cadena !== "string" || cadena === "") {
    return null;
  }

  const trozos = cadena.split(";");

  for (const trozo of trozos) {
    const texto = trozo.trim();
    const separador = texto.indexOf("=");
    if (separador === -1) {
      continue;
    }
    const clave = texto.slice(0, separador);
    if (clave === buscado) {
      try {
        return decodeURIComponent(texto.slice(separador + 1));
      } catch (error) {
        return null;
      }
    }
  }

  return null;
}

/**
 * Guarda una cookie durante el número de días indicado.
 * @returns {boolean} true si al releerla contiene el valor esperado
 */
function guardarCookie(nombre, valor, dias) {
  const diasNumero = Number(dias);
  const segundos = Math.round(
    (Number.isFinite(diasNumero) ? diasNumero : 0) * 24 * 60 * 60
  );

  document.cookie =
    encodeURIComponent(String(nombre)) +
    "=" +
    encodeURIComponent(String(valor)) +
    atributosCookie(segundos);

  return leerCookie(nombre) === String(valor);
}

/**
 * Borra una cookie usando el mismo ámbito con el que se creó y Max-Age=0.
 * @returns {boolean} true si al releerla ya no existe
 */
function borrarCookie(nombre) {
  document.cookie = encodeURIComponent(String(nombre)) + "=" + atributosCookie(0);
  return leerCookie(nombre) === null;
}
