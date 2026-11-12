# BladesInsight · Administración (MVC)

Módulo de administración del proyecto **BladesInsight** (análisis y estimación de puntuaciones del patinaje artístico, categoría individual femenina senior ISU). Este módulo **alimenta el core** aprobado (motor de estimación y análisis de brecha) con los datos maestros que necesita: temporadas, competencias, patinadoras, inscripciones, programas planeados y sus elementos.

> Asignatura ISWZ3101 · Ingeniería Web — Mell Stephania Arguello Falcon

## Stack

| Capa | Tecnología |
|---|---|
| Modelo | NestJS (TypeScript) + TypeORM, SQL Server (local/docker), PostgreSQL (Render) o SQLite (desarrollo) |
| Vista | Handlebars (`views/`) + JS/CSS propios (`public/`) |
| Controlador | Controladores NestJS + guard global de autenticación (JWT en cookie `httpOnly`) |

## Cómo se alimenta el core

| Pantalla admin | Tabla | Qué necesita el core de ella |
|---|---|---|
| Temporadas | `temporadas` | Agrupa competencias y programas planeados |
| Competencias | `competencias` | Eventos próximos sobre los que se estima |
| Patinadoras | `patinadoras` | Quién puede estimarse (código ISU = clave de enlace) |
| Inscripciones | `inscripciones` | El estimador solo opera sobre inscritas |
| Programas planeados | `programas_planeados` | Segmento (corto/libre) planeado por patinadora y temporada |
| Elementos planeados | `elementos_planeados` | Valor base total = dificultad del programa (TES esperado) |

## Requisito 1 · Validación en back-end de datos sensibles

Ninguna regla depende solo de JavaScript del navegador: los formularios usan `novalidate` y **todo se revalida en el servidor antes de grabar** (`src/admin/*.controller.ts`, `src/common/validators.ts`).

- **Código ISU de la patinadora** (`patinadoras.controller.ts`): es el dato que enlaza los resultados que importa el proceso de carga. Se normaliza (mayúsculas), se valida el formato `ISU-######` y se verifica **unicidad** en base de datos. También se valida la edad mínima senior (15 años al 1 de julio).
- **Valor base y tipo del elemento** (`elementos-planeados.controller.ts`): determinan el TES esperado. El cliente **no puede enviarlos**: el servidor los calcula desde el catálogo ISU (`src/common/catalogos.ts`; p. ej. `3Lz+3T` = 10.10). Un `valorBase=99` enviado a mano se ignora. Además valida orden, máximo de elementos por segmento (7 corto / 12 libre) y que el bonus de segunda mitad aplique solo a saltos del programa libre.
- **Coherencia de claves foráneas**: aunque el dropdown filtre, el servidor comprueba que la competencia pertenezca a la temporada y la patinadora al país elegidos, y rechaza duplicados.
- **Acceso**: contraseñas con bcrypt (coste 12), política de contraseña, límite de 5 intentos por IP, cookie `httpOnly` + `sameSite=lax` (+ `secure` en producción) y guard global que protege `/admin/**` y la API de los dropdowns.

## Requisito 2 · Claves foráneas con dropdowns en cascada

Ninguna FK se ingresa a mano. `public/admin.js` carga cada dropdown hijo desde la API JSON (`/admin/api/*`) al cambiar el padre:

| Formulario | Cascada |
|---|---|
| Competencias | Temporada (dropdown) |
| Inscripciones | Temporada → **Competencia** · País → **Patinadora** |
| Programas planeados | País → **Patinadora** · Temporada (dropdown) |
| Elementos planeados | País → Patinadora → **Programa planeado** (3 niveles) |

Al editar, las cascadas se precargan con la selección guardada.

## Ejecutar en local

Requiere Node.js 20+.

```bash
npm install
cp .env.example .env     # opcional; sin .env usa valores de desarrollo
npm run dev:sqlite       # SQLite, sin instalar SQL Server
```

Abra http://localhost:3000 · usuario inicial `admin@bladesinsight.local` / `Admin12345!` (solo desarrollo; en producción defina `ADMIN_EMAIL` y `ADMIN_PASSWORD`).

Con **SQL Server** (docker):

```bash
docker compose up --build
```

Pruebas de humo (con el servidor levantado):

```bash
./scripts/smoke.sh
```

## Despliegue en Render

`render.yaml` define el servicio web (Docker) y una base PostgreSQL gratuita, con variables de producción ya configuradas (`NODE_ENV`, `DB_TYPE=postgres`, `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PASSWORD` generados). Pasos: Render > New > Blueprint > elegir este repositorio > Apply. La contraseña inicial del admin se consulta en Render > Environment.

Otras plataformas: 
El repositorio incluye `Dockerfile` (compatible con Render, Railway, Azure App Service, Fly.io). Variables obligatorias en producción:

`NODE_ENV=production`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (y `DB_ENCRYPT=true` en Azure SQL).

URL desplegada: https://bladesinsight-admin.onrender.com
Video explicativo: https://youtu.be/rx0MAnPdwEw

## Estructura

```
src/
  entities/       Modelo (TypeORM)
  common/         CRUD genérico, validadores, catálogos ISU
  auth/           Login, guard global, administrador inicial
  admin/          Controladores MVC por recurso + API de dropdowns
views/            Vistas Handlebars
public/           admin.js (cascadas) y admin.css
scripts/smoke.sh  Pruebas de humo
```

## Notas

- `synchronize` de TypeORM crea las tablas al arrancar (apto para el alcance del curso; para producción real use migraciones).
- El catálogo de valores base (`catalogos.ts`) es configurable: verifique los valores contra la última Comunicación ISU vigente.
