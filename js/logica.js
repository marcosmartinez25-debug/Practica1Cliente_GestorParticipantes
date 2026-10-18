"use strict";
const TIPOS_VALIDOS = ["estudiante", "profesional", "invitado"];
const MODALIDADES_VALIDAS = ["presencial", "online"];
const EDAD_MINIMA = 0;
const EDAD_MAXIMA = 120;
const EXPERIENCIA_MINIMA = 0;
const EXPERIENCIA_MAXIMA = 10;
const ID_MINIMO = 100000;
const ID_MAXIMO = 999999;
const MAX_INTENTOS_ID = 1000;
const CAMPOS_PARTICIPANTE = [
  "id",
  "nombre",
  "edad",
  "tipo",
  "modalidad",
  "experiencia",
  "fechaInscripcion"
];

const PATRON_FECHA_ISO =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;


function textoDe(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }
  return String(valor).trim();
}

function convertirNumero(valor) {
  const texto = textoDe(valor);
  if (texto === "") {
    return NaN;
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero)) {
    return NaN;
  }
  return numero;
}


/*Comprueba que una cadena tiene formato ISO y representa una fecha real.*/
function esFechaIsoValida(valor) {
  if (typeof valor !== "string" || !PATRON_FECHA_ISO.test(valor)) {
    return false;
  }
  const milisegundos = Date.parse(valor);
  return !Number.isNaN(milisegundos);
}

/* Validación del formulario de alta */

/**
 * Valida los datos de un participante procedentes del formulario, de un JSON o de un mensaje. Todo se considera no fiable.
 *
 * @param {Object} datos  nombre, edad, tipo, modalidad, experiencia
 * @returns {{valido: boolean, errores: Object, valores: Object|null}}
 */
function validarParticipante(datos) {
  const errores = {};
  const entrada = datos !== null && typeof datos === "object" ? datos : {};

  /* Nombre: entre 2 y 60 caracteres después de quitar espacios */
  const nombre = textoDe(entrada.nombre);
  if (nombre === "") {
    errores.nombre = "El nombre es obligatorio.";
  } else if (nombre.length < 2 || nombre.length > 60) {
    errores.nombre = "El nombre debe tener entre 2 y 60 caracteres.";
  }

  /* Edad: no vacía, numérica, finita, entera y entre 0 y 120 (el 0 es válido) */
  const edadTexto = textoDe(entrada.edad);
  const edad = convertirNumero(entrada.edad);
  if (edadTexto === "") {
    errores.edad = "La edad es obligatoria.";
  } else if (Number.isNaN(edad)) {
    errores.edad = 'La edad debe ser un número: se rechazan valores como "18abc".';
  } else if (!Number.isInteger(edad)) {
    errores.edad = "La edad debe ser un número entero, sin decimales.";
  } else if (edad < EDAD_MINIMA || edad > EDAD_MAXIMA) {
    errores.edad = "La edad debe estar entre 0 y 120.";
  }

  /* Tipo: solo los tres valores admitidos */
  const tipo = textoDe(entrada.tipo).toLowerCase();
  if (tipo === "") {
    errores.tipo = "Hay que elegir un tipo de participante.";
  } else if (!TIPOS_VALIDOS.includes(tipo)) {
    errores.tipo = "El tipo solo puede ser estudiante, profesional o invitado.";
  }

  /* Modalidad: solo presencial u online */
  const modalidad = textoDe(entrada.modalidad).toLowerCase();
  if (modalidad === "") {
    errores.modalidad = "Hay que elegir una modalidad.";
  } else if (!MODALIDADES_VALIDAS.includes(modalidad)) {
    errores.modalidad = "La modalidad solo puede ser presencial u online.";
  }

  /* Experiencia: no vacía, numérica, finita y entre 0 y 10 (admite decimales) */
  const experienciaTexto = textoDe(entrada.experiencia);
  const experiencia = convertirNumero(entrada.experiencia);
  if (experienciaTexto === "") {
    errores.experiencia = "La experiencia es obligatoria.";
  } else if (Number.isNaN(experiencia)) {
    errores.experiencia = "La experiencia debe ser un número (admite decimales).";
  } else if (
    experiencia < EXPERIENCIA_MINIMA ||
    experiencia > EXPERIENCIA_MAXIMA
  ) {
    errores.experiencia = "La experiencia debe estar entre 0 y 10.";
  }

  const hayErrores = Object.keys(errores).length > 0;
  if (hayErrores) {
    return { valido: false, errores: errores, valores: null };
  }

  return {
    valido: true,
    errores: {},
    valores: {
      nombre: nombre,
      edad: edad,
      tipo: tipo,
      modalidad: modalidad,
      experiencia: experiencia
    }
  };
}
/**
 * Genera un entero entre 100000 y 999999 que no exista ya en la colección. Usa do...while con un límite de intentos: nunca puede bloquear la pestaña.
 *
 * @returns {number|null} el identificador, o null si se agotan los intentos
 */
function generarId(participantes) {
  const lista = Array.isArray(participantes) ? participantes : [];
  const rango = ID_MAXIMO - ID_MINIMO + 1;

  let id = 0;
  let repetido = true;
  let intentos = 0;

  do {
    id = Math.floor(Math.random() * rango) + ID_MINIMO;
    repetido = false;

    for (const participante of lista) {
      if (Number(participante.id) === id) {
        repetido = true;
        break; // no hace falta seguir recorriendo: ya sabemos que está repetido
      }
    }

    intentos++;
  } while (repetido && intentos < MAX_INTENTOS_ID);

  return repetido ? null : id;
}

/** Menor de edad si tiene menos de 18 años; mayor de edad en caso contrario. */
function clasificarEdad(edad) {
  return Number(edad) < 18 ? "menor" : "mayor";
}

function clasificarExperiencia(experiencia) {
  const valor = Number(experiencia);
  if (valor < 4) {
    return "inicial";
  } else if (valor < 7) {
    return "intermedia";
  } else {
    return "avanzada";
  }
}

/** Texto legible del tipo de participante. */
function etiquetaTipo(tipo) {
  switch (textoDe(tipo).toLowerCase()) {
    case "estudiante":
      return "Estudiante";
    case "profesional":
      return "Profesional";
    case "invitado":
      return "Invitado";
    default:
      return "Tipo desconocido";
  }
}

/** Texto legible de la modalidad. */
function etiquetaModalidad(modalidad) {
  return textoDe(modalidad).toLowerCase() === "presencial"
    ? "Presencial"
    : "Online";
}

/*Calcula las estadísticas de la colección completa con bucles, contadores y acumuladores ademas devuelve valores numéricos o null cuando no hay datos */
function calcularEstadisticas(participantes) {
  const lista = Array.isArray(participantes) ? participantes : [];

  let total = 0;
  let menores = 0;
  let mayores = 0;
  let sumaEdades = 0;
  let edadMinima = null;
  let edadMaxima = null;

  const porModalidad = { presencial: 0, online: 0 };
  const porTipo = { estudiante: 0, profesional: 0, invitado: 0 };

  for (const participante of lista) {
    const edad = Number(participante.edad);

    total++;
    sumaEdades += edad;

    if (clasificarEdad(edad) === "menor") {
      menores++;
    } else {
      mayores++;
    }

    if (edadMinima === null || edad < edadMinima) {
      edadMinima = edad;
    }
    if (edadMaxima === null || edad > edadMaxima) {
      edadMaxima = edad;
    }

    if (participante.modalidad === "presencial") {
      porModalidad.presencial++;
    } else if (participante.modalidad === "online") {
      porModalidad.online++;
    }

    switch (participante.tipo) {
      case "estudiante":
        porTipo.estudiante++;
        break;
      case "profesional":
        porTipo.profesional++;
        break;
      case "invitado":
        porTipo.invitado++;
        break;
      default:
        break; 
    }
  }

  /* Experiencia media de los presenciales: se recorre todo y se omiten los online con continue. */
  let sumaExperienciaPresencial = 0;
  let contadorPresencial = 0;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].modalidad !== "presencial") {
      continue;
    }
    sumaExperienciaPresencial += Number(lista[i].experiencia);
    contadorPresencial++;
  }

  /* Primer menor de edad en el orden de la colección: se corta con break. */
  let primerMenor = null;

  for (let i = 0; i < lista.length; i++) {
    if (clasificarEdad(lista[i].edad) === "menor") {
      primerMenor = textoDe(lista[i].nombre);
      break;
    }
  }

  return {
    total: total,
    menores: menores,
    mayores: mayores,
    edadMedia: total > 0 ? sumaEdades / total : null,
    edadMinima: edadMinima,
    edadMaxima: edadMaxima,
    porModalidad: porModalidad,
    porTipo: porTipo,
    experienciaMediaPresencial:
      contadorPresencial > 0
        ? sumaExperienciaPresencial / contadorPresencial
        : null,
    primerMenor: primerMenor
  };
}

/*Prepara el objeto que se envía al iframe total, cantidades por modalidad y participante con la inscripción más reciente.*/
function calcularResumenEvento(participantes) {
  const lista = Array.isArray(participantes) ? participantes : [];
  const estadisticas = calcularEstadisticas(lista);

  let ultimo = null;
  let marcaMasReciente = -Infinity;

  for (const participante of lista) {
    const marca = Date.parse(participante.fechaInscripcion);
    if (Number.isNaN(marca)) {
      continue;
    }
    if (marca > marcaMasReciente) {
      marcaMasReciente = marca;
      ultimo = {
        nombre: textoDe(participante.nombre),
        fechaInscripcion: String(participante.fechaInscripcion)
      };
    }
  }

  return {
    total: estadisticas.total,
    presencial: estadisticas.porModalidad.presencial,
    online: estadisticas.porModalidad.online,
    ultimo: ultimo
  };
}

/**
  * Valida la colección completa de participantes importada desde un JSON. Comprueba que sea un array, que cada elemento sea un objeto con los campos obligatorios, que los tipos y rangos sean correctos, que los identificadores sean enteros válidos y no repetidos, y que las fechas sean ISO válidas.
 * @returns {{valido: boolean, errores: string[], participantes: Array|null}}
 */
function validarColeccionImportada(coleccion) {
  const errores = [];

  if (!Array.isArray(coleccion)) {
    return {
      valido: false,
      errores: ["El JSON debe contener un array de participantes."],
      participantes: null
    };
  }

  const limpios = [];
  const idsVistos = [];

  for (let i = 0; i < coleccion.length; i++) {
    const posicion = i + 1;
    const elemento = coleccion[i];

    if (
      elemento === null ||
      typeof elemento !== "object" ||
      Array.isArray(elemento)
    ) {
      errores.push("Elemento " + posicion + ": debe ser un objeto.");
      continue;
    }

    /* Campos obligatorios */
    let faltanCampos = false;
    for (const campo of CAMPOS_PARTICIPANTE) {
      if (!Object.prototype.hasOwnProperty.call(elemento, campo)) {
        errores.push("Elemento " + posicion + ": falta el campo " + campo + ".");
        faltanCampos = true;
      }
    }
    if (faltanCampos) {
      continue;
    }

    /* Tipos previstos */
    let tiposCorrectos = true;
    if (typeof elemento.nombre !== "string") {
      errores.push("Elemento " + posicion + ": nombre debe ser texto.");
      tiposCorrectos = false;
    }
    if (typeof elemento.edad !== "number") {
      errores.push("Elemento " + posicion + ": edad debe ser un número.");
      tiposCorrectos = false;
    }
    if (typeof elemento.experiencia !== "number") {
      errores.push("Elemento " + posicion + ": experiencia debe ser un número.");
      tiposCorrectos = false;
    }
    if (typeof elemento.tipo !== "string") {
      errores.push("Elemento " + posicion + ": tipo debe ser texto.");
      tiposCorrectos = false;
    }
    if (typeof elemento.modalidad !== "string") {
      errores.push("Elemento " + posicion + ": modalidad debe ser texto.");
      tiposCorrectos = false;
    }
    if (typeof elemento.id !== "number") {
      errores.push("Elemento " + posicion + ": id debe ser un número.");
      tiposCorrectos = false;
    }
    if (!tiposCorrectos) {
      continue;
    }

    /* Rangos del formulario */
    const revision = validarParticipante(elemento);
    if (!revision.valido) {
      for (const campo of Object.keys(revision.errores)) {
        errores.push("Elemento " + posicion + ": " + revision.errores[campo]);
      }
      continue;
    }

    /* Identificador entero válido y no repetido */
    const id = elemento.id;
    if (!Number.isInteger(id) || id < ID_MINIMO || id > ID_MAXIMO) {
      errores.push(
        "Elemento " + posicion + ": el id debe ser un entero entre 100000 y 999999."
      );
      continue;
    }
    if (idsVistos.includes(id)) {
      errores.push("Elemento " + posicion + ": el id " + id + " está repetido.");
      continue;
    }

    /* Fecha ISO válida */
    if (!esFechaIsoValida(elemento.fechaInscripcion)) {
      errores.push(
        "Elemento " + posicion + ": fechaInscripcion no es una fecha ISO válida."
      );
      continue;
    }

    idsVistos.push(id);
    limpios.push({
      id: id,
      nombre: revision.valores.nombre,
      edad: revision.valores.edad,
      tipo: revision.valores.tipo,
      modalidad: revision.valores.modalidad,
      experiencia: revision.valores.experiencia,
      fechaInscripcion: elemento.fechaInscripcion
    });
  }

  if (errores.length > 0) {
    return { valido: false, errores: errores, participantes: null };
  }

  return { valido: true, errores: [], participantes: limpios };
}

/*Comprueba la estructura, los tipos y los valores del resumen antes de usarlo. Lo usan tanto el panel como las pruebas de la lógica.*/
function esResumenValido(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  if (data.tipo !== "resumen-evento") {
    return false;
  }
  if (
    !Number.isInteger(data.total) ||
    !Number.isInteger(data.presencial) ||
    !Number.isInteger(data.online)
  ) {
    return false;
  }
  if (data.total < 0 || data.presencial < 0 || data.online < 0) {
    return false;
  }
  if (data.presencial + data.online !== data.total) {
    return false;
  }

  if (data.ultimo === null) {
    return true;
  }
  if (typeof data.ultimo !== "object" || Array.isArray(data.ultimo)) {
    return false;
  }
  if (typeof data.ultimo.nombre !== "string" || data.ultimo.nombre === "") {
    return false;
  }
  return esFechaIsoValida(data.ultimo.fechaInscripcion);
}