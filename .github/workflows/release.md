Qué hace exactamente este workflow

Paso                    Qué ocurre
on: release / published Solo al publicar una Release
checkout                Descarga tu código
docker/login-action     Login en GHCR con GITHUB_TOKEN
docker build            Crea la imagen Docker
docker push             Publica en GHCR

Todo esto está alineado con la documentación oficial de GitHub Actions y GHCR. [github.com], [docs.github.com]

✅ Cómo lanzar una release (flujo real)
Desde tu code‑server (o local):
Shellgit tag v1.0.0git push origin v1.0.0Show more lines
Luego en GitHub:

Releases → New release
Seleccionas v1.0.0
Publish

👉 En ese momento:
✅ se dispara el workflow
✅ se crea la imagen
✅ queda disponible como:
ghcr.io/tu-user/tu-repo:v1.0.0
ghcr.io/tu-user/tu-repo:latest


✅ Cómo comprobar que todo ha ido bien

Repo → Actions → workflow en verde
Repo → Packages → ves la imagen publicada
Tag visible y asociado a la release


✅ Errores típicos (ya te los evito)

❌ Usar on: push → demasiado pronto
❌ release: created → también salta para drafts
❌ Montar volúmenes en prod
❌ Build en el servidor de producción

Tú no estás cayendo en ninguno 👍