# Reglas de Firestore: prueba y publicación manual

La fuente de las reglas es `firestore.rules`. `docs/firestore.rules` es una copia de consulta y debe permanecer idéntica.

## Prueba local

Requisitos:

- Node.js 20 o posterior.
- Java 21 disponible en `PATH`.

```bash
npm ci
npm run test:rules
```

La prueba usa el proyecto ficticio `demo-linksafe` y el emulador local. No lee ni modifica el proyecto Firebase de producción.

## Publicación manual

1. Abrir Firebase Console y seleccionar el proyecto de LinkSafe.
2. Entrar en Firestore Database y abrir la pestaña Rules.
3. Reemplazar el contenido completo por `firestore.rules`.
4. Revisar el diff mostrado por Firebase.
5. Publicar las reglas.
6. Confirmar la hora de publicación y conservar cualquier error mostrado por Firebase.

No debe usarse la opción de despliegue de Hosting: estas reglas pertenecen a Firestore.

## Verificación posterior

Con dos cuentas distintas:

1. La cuenta A debe poder listar, crear, editar, marcar como favorito y eliminar sus enlaces.
2. La cuenta B no debe ver enlaces ni etiquetas de A.
3. El bookmarklet de Enlaces debe seguir pudiendo guardar un enlace HTTP o HTTPS.
4. Una consulta de `bookmarks` sin filtro por `userId` debe ser rechazada.
5. Una consulta filtrada con el UID autenticado debe ser aceptada.

La colección `prompts` queda protegida y preparada, aunque su interfaz se publique en una fase posterior.
