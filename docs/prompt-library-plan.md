# Biblioteca privada de prompts

Estado: MVP implementado y publicado en `v0.1.7` el 27 de septiembre de 2026.

Checkpoint de seguridad: el 27 de septiembre de 2026 el usuario confirmó la publicación manual de `firestore.rules` y la verificación con dos cuentas distintas.

## Objetivo

Ampliar LinkSafe como una sola aplicación con dos bibliotecas privadas y claramente diferenciadas:

- Enlaces, almacenados en la colección existente `bookmarks` sin migraciones destructivas.
- Prompts, almacenados en una colección independiente `prompts`.

Cada usuario solo puede acceder a sus propios enlaces, prompts y etiquetas. Las etiquetas no tendrán una colección propia: se derivarán de los documentos privados de la biblioteca activa.

## Navegación y rutas

La navegación principal será lateral en escritorio y tendrá una barra inferior fija en móvil para alternar entre Enlaces y Prompts.

```text
LinkSafe
├── Enlaces
│   ├── Todos
│   └── Favoritos
├── Prompts
│   ├── Todos
│   └── Favoritos
└── Etiquetas de la biblioteca activa
```

Rutas aprobadas:

```text
/                         Biblioteca de Enlaces
/prompts                  Biblioteca de Prompts
/prompts/new              Nuevo prompt
/prompts/[promptId]       Detalle en modo lectura
/prompts/[promptId]/edit  Edición consciente y explícita
```

## Modelo de Prompt

```text
Prompt
- id
- userId
- title
- content
- tags
- notes?
- sourceUrl?
- author?
- language?
- model?
- favorite
- createdAt
- updatedAt
```

`title` y `content` son obligatorios. Los timestamps se generan en el servidor. `updatedAt` determina el orden "Recientes" de Prompts; Enlaces conserva `createdAt`.

Límites aprobados:

- Título: 200 caracteres.
- Contenido: 50.000 caracteres.
- Notas: 5.000 caracteres.
- Autor, idioma y modelo: 200 caracteres cada uno.
- URL de origen: 2.048 caracteres y solo `http://` o `https://`.
- Etiquetas: máximo 20 y 50 caracteres por etiqueta.

El contenido se presenta como texto literal, sin interpretar Markdown ni HTML. Se permiten prompts duplicados.

## Búsqueda, filtros y visualización

La búsqueda local cubre título, contenido, notas, etiquetas, autor, idioma, modelo y URL de origen. El MVP carga todos los documentos privados del usuario y no incluye paginación.

Filtros aprobados:

- Etiquetas, exigiendo todas las seleccionadas.
- Idioma.
- Modelo.
- Favoritos.

Etiquetas, idioma y modelo se limpian, se comparan sin distinguir mayúsculas y conservan la primera escritura utilizada. Sus autocompletados son privados. Las etiquetas y sus contadores permanecen separados por biblioteca.

Prompts conserva los tres modos existentes en Enlaces: tarjetas grandes, tarjetas compactas y lista. La vista y la ordenación se recuerdan localmente y por biblioteca. Búsqueda y filtros se conservan al visitar un detalle o formulario, pero se restablecen al recargar o iniciar otra sesión.

Las tarjetas permiten copiar, cambiar favorito, editar explícitamente y eliminar con confirmación. Pulsar la tarjeta abre el detalle, no la edición.

## Formulario y detalle

El formulario es una página integrada en Prompts:

- Título, contenido y etiquetas visibles.
- Resto de metadatos dentro de "Detalles opcionales".
- Vista previa en escritorio.
- Aviso de contenido privado.
- Confirmación al abandonar cambios sin guardar, tanto al crear como al editar.
- Zona de eliminación separada en edición, con confirmación.

Después de crear o editar se abre el detalle correspondiente.

## Favoritos

Favoritos forma parte del MVP para Enlaces y Prompts. Se muestra una estrella visible y accesible en tarjetas y detalles. Los bookmarks antiguos sin `favorite` se interpretan como no favoritos, sin migración obligatoria.

## Bookmarklets

La página de integración ofrecerá dos bookmarklets:

- Guardar enlace en LinkSafe.
- Guardar prompt en LinkSafe.

El bookmarklet de Prompts captura el texto seleccionado como `content`, el título de la página como título inicial y la URL como `sourceUrl`. Siempre abre una revisión y nunca guarda automáticamente.

Los datos se transmiten en memoria mediante `postMessage`, no en la URL. Si no hay selección, se abre el formulario vacío con la fuente. Si el contenido supera 50.000 caracteres, se avisa sin truncarlo. Tras guardar desde el popup se confirma y se cierra la ventana.

## Idioma e internacionalización

Toda la interfaz será inicialmente española y el documento declarará `lang="es"`. Los textos se centralizarán para facilitar una futura internacionalización. Los errores habituales de Firebase tendrán mensajes propios en español y los códigos desconocidos usarán un mensaje genérico.

## Privacidad y reglas

Las consultas de `bookmarks` y `prompts` siempre incluyen `where('userId', '==', user.uid)`. Las reglas de Firestore solo permiten operar al propietario, impiden cambiar `userId` y validan campos, tipos y límites. Las reglas de `bookmarks` mantienen compatibilidad con documentos antiguos.

El despliegue de reglas será manual. Codex preparará el contenido exacto y el usuario lo publicará en Firebase. Las reglas no se considerarán activas hasta verificarlas con dos usuarios distintos.

## Fases de implementación

- [x] Corregir privacidad de etiquetas y añadir favoritos, normalización y validación HTTP/HTTPS a Enlaces.
- [x] Preparar y probar reglas estrictas de Firestore; realizar el checkpoint de publicación manual.
- [x] Traducir la interfaz y extraer el shell compartido con navegación de escritorio y móvil.
- [x] Crear infraestructura, colección y consultas en tiempo real de Prompts.
- [x] Implementar búsqueda, filtros, contadores y tres modos de visualización.
- [x] Implementar creación, detalle, edición, eliminación y protección de cambios sin guardar.
- [x] Añadir el segundo bookmarklet y su captura segura mediante `postMessage`.
- [x] Completar pruebas, documentación, build, release y verificación de despliegue.

La primera publicación compatible elimina las consultas globales de Enlaces antes de endurecer manualmente sus reglas.

## Pruebas aprobadas

- Reglas con dos usuarios.
- Normalización de etiquetas, idioma y modelo.
- Búsqueda, filtros y ordenación.
- Validación del formulario y sus límites.
- Favoritos y bookmarks antiguos sin `favorite`.
- Protección frente a cambios sin guardar.
- Captura mediante `postMessage`.
- Rutas de creación, detalle y edición.

El build no sustituye a typecheck ni lint porque la configuración actual ignora sus errores; deben ejecutarse y reportarse por separado.

## Fuera del MVP

- Variables `{{nombre}}`.
- Acción "Usar".
- Importación y exportación.
- Cambio de nombre de LinkSafe.
- Detección de duplicados.
- Paginación o búsqueda mediante servidor.
