# Importación y exportación CSV

La función se abre desde **Menú de usuario → Importar y exportar** y trabaja con las dos bibliotecas privadas. Los archivos se generan y analizan en el navegador; no se suben a un servicio intermedio.

## Exportación

- Se puede seleccionar Enlaces, Prompts o ambas bibliotecas.
- Cada biblioteca produce una descarga independiente.
- Los archivos usan UTF-8 con BOM, punto y coma y saltos de línea CRLF.
- `id`, `userId` y `favicon` nunca se exportan.
- Los valores que una hoja de cálculo podría interpretar como fórmulas se neutralizan al generar el archivo.

Columnas de Enlaces:

```text
title;url;description;tags;favorite;createdAt
```

Columnas de Prompts:

```text
title;content;tags;notes;sourceUrl;author;language;model;favorite;createdAt;updatedAt
```

## Importación

- Se acepta un único archivo `.csv` de Enlaces o Prompts cada vez.
- El tipo se detecta por las cabeceras, cuyo orden puede variar.
- Se aceptan coma o punto y coma como separador.
- El límite es de 5 MB y 2.000 filas.
- Solo son obligatorios `title` y `url` en Enlaces, y `title` y `content` en Prompts.
- `tags` es una lista JSON dentro de una celda, por ejemplo `["trabajo","IA"]`.
- `favorite` admite `true` o `false`; vacío equivale a `false`.
- Las fechas opcionales utilizan ISO 8601. Si faltan, se aplica la fecha de importación.
- Las filas inválidas y los duplicados se omiten; las válidas se muestran antes de confirmar.
- Un enlace se considera duplicado si coincide su URL. Un prompt se considera duplicado si coinciden título y contenido.
- Se muestran hasta 20 filas en la vista previa, aunque se valida y procesa el archivo completo.
- Las escrituras se realizan secuencialmente en lotes de 400. Si falla un lote, los lotes anteriores permanecen guardados y la interfaz informa del total importado.

## Controles de seguridad

- Todas las lecturas consultan únicamente documentos con `userId` igual al UID autenticado.
- El UID y los identificadores de documentos los asigna LinkSafe; un CSV no puede proporcionarlos.
- Las cabeceras desconocidas, incluidos campos internos, bloquean la importación.
- Se validan tipos, longitudes, número de etiquetas, fechas y protocolos HTTP/HTTPS antes de escribir.
- No se solicitan favicons ni otras URL externas durante una importación.
- Las reglas de Firestore vuelven a validar propietario, campos, tipos, límites y fechas. La validación del navegador no sustituye a las reglas.
- Los datos se presentan como texto mediante React; no se interpreta HTML procedente del CSV.

## Publicación de reglas

La importación de fechas históricas requiere la versión de `firestore.rules` incluida con esta funcionalidad. Su publicación es manual y debe completarse siguiendo [firestore-rules-deployment.md](firestore-rules-deployment.md).
