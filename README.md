# Gestor de participantes de un evento

**Chat con la IA:** https://claude.ai/share/bddd54cf-9ab6-4e94-938c-58d98a9704bb


## Estructura

```
index.html        Página principal
panel.html        Lo que va dentro del iframe
ayuda.html        Lo que abre window.open
css/estilos.css
js/logica.js      Validación y cálculo. No toca el DOM
js/cookies.js     leerCookie, guardarCookie, borrarCookie
js/app.js         Toda la interfaz
js/panel.js
js/ayuda.js
```

## Cómo lo hice, por orden

**1. Carpetas y servidor.** Lo primero fue levantar el servidor con un HTML
vacío y comprobar en la pestaña Network que devolvía 200. Así ya sabía que el
entorno estaba bien antes de escribir nada de lógica.

**2. La validación (`logica.js`).** Empecé por aquí porque se puede probar desde
la consola sin tener interfaz. Escribí `validarParticipante` y `generarId`.

*Fallo:* al principio convertía la edad directamente con `Number` y una edad
vacía me entraba como válida. Lo que pasaba es que `Number("")` devuelve `0`, no
`NaN`, y como en esta práctica la edad 0 sí es válida, no había forma de
distinguirlas. *Solución:* comprobar primero si la cadena está vacía después del
`trim` y solo entonces convertir. Está en la función `convertirNumero`.

**3. `generarId`.** Sortea un número de 6 cifras y comprueba que no exista ya.

*Fallo:* mi primera versión era un `while (repetido)` sin más, y me di cuenta de
que si se llenaran todos los identificadores el navegador se quedaría colgado
para siempre. *Solución:* un `do...while` con un tope de 1000 intentos que
devuelve `null` si se agotan. El enunciado pide justo eso.

**4. El formulario y los errores.** Le puse `novalidate` al formulario porque el
enunciado dice que no basta con `required` ni `min`/`max` de HTML. Los mensajes
salen junto a cada campo y también en un resumen.

**5. Las tarjetas.** `crearTarjeta` las monta con `createElement`, `textContent`
y `append`. No uso `innerHTML` en todo el proyecto: si alguien se escribe un
nombre con etiquetas HTML dentro, con `textContent` se ve como texto y no se
ejecuta nada.

**6. Las bajas.** `confirm` antes de borrar y, si se cancela, no se toca nada.
El botón de cada tarjeta engancha su propio listener, así tiene delante el
participante al que pertenece y lo borro con `splice` e `indexOf`.

**7. Estadísticas.** Aquí es donde van los bucles con `break` (buscar el primer
menor de edad) y `continue` (saltarse a los online al calcular la experiencia
media de los presenciales).

*Fallo:* con la lista vacía me salía `NaN` en las medias, porque dividía entre
cero. *Solución:* `calcularEstadisticas` devuelve `null` cuando no hay datos y es
`app.js` quien lo traduce a "Sin datos". Así los cálculos siguen siendo números
y el texto se decide al pintar.

*Fallo 2:* las estadísticas se me desincronizaban de la lista. Si daba de baja a
alguien, la tarjeta desaparecía pero el total seguía igual, porque cada
manejador actualizaba su trozo por su cuenta. *Solución:* una sola función
`refrescar()` que pinta lista, estadísticas y panel. Todo lo que cambia los datos
llama a esa y a nada más.

Otra cosa importante: la búsqueda y el filtro solo afectan a lo que se pinta.
Las estadísticas siempre reciben el array completo.

**8. JSON.** Exportar es un `JSON.stringify`. Importar lleva `try/catch` para el
JSON mal formado y después `validarColeccionImportada`, que comprueba campos,
tipos, rangos, que el id sea un entero del rango y no esté repetido, y que la
fecha sea ISO de verdad.

*Fallo:* mi primera versión iba metiendo los participantes válidos y descartando
los malos, o sea, importaciones parciales. El enunciado dice que si hay un solo
error se conserva la colección entera anterior. *Solución:* la función recorre
todo, acumula los errores en un array y solo devuelve datos si no hay ninguno.

**9. El iframe y `postMessage`.** El panel construye su propio DOM; la página
principal solo le manda mensajes. Mando siempre con `window.location.origin`
como segundo parámetro, nunca `"*"`, y al recibir compruebo `origin`, `source` y
que el contenido tenga la forma y los tipos esperados.

*Fallo:* el panel se me quedaba en "Conectando…" de vez en cuando, y otras veces
cargaba bien. Lo que pasaba es que el iframe a veces termina de cargar antes que
la página que lo contiene, así que avisaba de que estaba listo cuando la
principal todavía no estaba escuchando y el mensaje se perdía. *Solución:* el
panel repite el aviso cada 300 ms, con un tope de 20 intentos, y deja de
repetirlo en cuanto recibe el primer resumen.

**10. Cookies.** Dos cookies separadas, una para el tema y otra para el tamaño
de letra, con `Path=/`, `SameSite=Lax` y `Max-Age` en segundos.

*Fallo:* le puse `Secure` y dejaron de guardarse. Claro, estoy en
`http://localhost` y una cookie `Secure` solo viaja por HTTPS. *Solución:*
añadir `Secure` solo si `location.protocol` es `https:`.

Otra cosa que aprendí: escribir en `document.cookie` no da ningún error aunque
el navegador tenga las cookies bloqueadas. Por eso mis funciones releen la cookie
después de escribirla y devuelven `true` o `false`, y el mensaje que sale en
pantalla sale de esa comprobación, no de suponer que se guardó. Aunque estén
bloqueadas, el tema se aplica igual durante la visita.

**11. Ayuda.** `window.open` guardando la referencia. Si se vuelve a pulsar el
botón y la ventana sigue abierta, la reutilizo con `focus()` en vez de abrir otra.
Si el navegador la bloquea, `window.open` devuelve `null` y aviso de ello.

**12. CSS.** Lo dejé para el final. El tema oscuro y el tamaño de letra se
controlan con atributos `data-` en el `<body>`, que es lo único que cambia
JavaScript. El resto lo hace el CSS solo.

## Decisiones que tomé

- **Los tres participantes de ejemplo llevan ids fijos.** Son datos de prueba, y
  así puedo repetir siempre los mismos casos sin que cambien los identificadores
  en cada recarga.
- **Un listener por botón de baja en vez de delegación.** Con delegación bastaría
  un solo listener en el contenedor, y con muchos participantes sería mejor. Lo
  hice como lo hice porque lo entiendo mejor y el número de participantes aquí es
  pequeño.
- **La lógica separada de la interfaz.** `validarParticipante`, `generarId` y
  `calcularEstadisticas` no tocan el DOM: reciben datos y devuelven resultados.
  Lo pide el enunciado y además me permitió probarlas desde la consola antes de
  tener nada pintado.
