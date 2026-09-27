# LinkSafe

LinkSafe es una aplicación privada para guardar y organizar enlaces y prompts.

## Funciones principales

- Autenticación de usuarios con Firebase.
- Bibliotecas separadas de Enlaces y Prompts.
- Etiquetas, búsqueda, filtros, favoritos y varios modos de visualización.
- Formularios y modelos independientes para enlaces y prompts.
- Bookmarklets separados para capturar enlaces y texto seleccionado desde el navegador.
- Reglas de Firestore que restringen cada documento a su propietario.

## Desarrollo

```bash
npm ci
npm run dev
```

Comprobaciones disponibles:

```bash
npm run lint
npm test
npm run typecheck
npm run test:rules
npm run build
```

Las pruebas de reglas requieren Java 21. Consulta [docs/firestore-rules-deployment.md](docs/firestore-rules-deployment.md) para su ejecución y publicación manual.

La definición funcional y las decisiones del MVP se conservan en [docs/prompt-library-plan.md](docs/prompt-library-plan.md).

La estructura y los controles de la importación y exportación están documentados en [docs/csv-import-export.md](docs/csv-import-export.md).
