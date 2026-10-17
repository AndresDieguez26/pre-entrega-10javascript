# Pre-Entrega 10 — Plantel Fútbol 6

Autor: Andrés Dieguez.

Simulador de administración de jugadoras. Mantiene altas, edición, bajas,
búsqueda por nombre o posición, localStorage y evaluación asíncrona del plantel.

## Ejecutar

1. Abrir la carpeta del proyecto en Visual Studio Code.
2. Usar la extensión Live Server y elegir **Open with Live Server** en `index.html`.
3. Mantener conexión a Internet para cargar SweetAlert2 desde el CDN.

También se puede ejecutar `python -m http.server 8000` desde esta carpeta y
entrar a http://localhost:8000. No abrir el HTML con doble clic: `fetch` necesita
un servidor HTTP. GitHub Pages también sirve para ejecutarlo.

## Fuente y flujo de datos

Se usa `data.json` local como base inicial, con id, nombre, posición y edad.
Al ingresar: aviso de carga → `cargarPlantel()` → `await fetch("./data.json")`
→ comprobar `respuesta.ok` → `await respuesta.json()` → validar datos
→ recuperar el plantel guardado (si existe) → renderizar tarjetas en el DOM
→ notificar éxito con SweetAlert2.

`try` contiene la petición y el procesamiento. `catch` informa fallos de red,
HTTP, JSON inválido o datos incorrectos y permite reintentar. `finally` cancela
el temporizador, actualiza `aria-busy` y finaliza el estado de carga. La petición
se cancela después de 10 segundos si no responde.

El formulario queda deshabilitado durante la carga y hasta que se complete con
éxito. Siempre se consulta el JSON al iniciar; las modificaciones guardadas en
`plantelFutbol6` tienen prioridad para conservar las entregas anteriores. Un
array vacío guardado se respeta y no vuelve a cargar ejemplos.

## Librería

SweetAlert2 11.26.25 se integra vía CDN antes de `main.js`. `mostrarMensaje()`
usa `Swal.fire()` para éxito, errores y cambios del plantel. No hay `alert()`,
`prompt()` ni `confirm()` nativos. Se mantiene un mensaje en la página como
respaldo si el CDN no está disponible.

Documentación: https://sweetalert2.github.io/

## Verificación manual

- Sin datos guardados: aparecen las cuatro jugadoras del JSON y el aviso de éxito.
- Agregar, editar, buscar y eliminar; recargar para comprobar la persistencia.
- Vaciar el plantel y recargar: sigue vacío.
- En DevTools → Network, bloquear `data.json` y recargar: aparece el error,
  se habilita Reintentar y no se puede editar un plantel sin cargar.
  Desbloquear la petición y reintentar: se recupera la interfaz.
- Un archivo JSON inválido o una respuesta 404 también muestran el error.
- Evaluar el plantel conserva la Promesa y el recordatorio de la entrega 9.

## Entregar en GitHub

Subir el contenido de esta carpeta al repositorio público del proyecto:
`index.html`, `js/main.js`, `css/style.css`, `data.json` y `README.md`.
Conservar las rutas de las carpetas. Luego entregar la URL principal del repositorio.
