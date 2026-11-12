# Guion del video — Administración que alimenta el core de BladesInsight

**Duración objetivo:** 7 a 9 minutos · **Formato:** grabación de pantalla con voz (Loom o YouTube)
**Cómo leerlo:** en cada bloque, **MOSTRAR** es lo que debe verse en pantalla y **DECIR** es el texto sugerido (puedes parafrasearlo con tus palabras).

---

## Antes de grabar (checklist)

- [ ] Abre https://bladesinsight-admin.onrender.com 3 a 5 minutos antes: el plan gratuito se duerme y la primera carga tarda.
- [ ] Ten abiertas dos cosas: el navegador con la app (sesión cerrada) y VS Code con la carpeta `BladesInsight-Admin`.
- [ ] En VS Code deja abiertos (en pestañas) estos archivos, en este orden:
  1. `src/entities/index.ts`
  2. `src/common/crud.controller.ts`
  3. `src/admin/patinadoras.controller.ts`
  4. `src/admin/elementos-planeados.controller.ts`
  5. `src/common/catalogos.ts`
  6. `public/admin.js`
- [ ] Ten a mano la contraseña del administrador (Render > Environment > `ADMIN_PASSWORD`). **No la dejes visible en pantalla.**
- [ ] Decide los datos de la demostración y que **no existan ya** en producción (si ya probaste, usa otro código ISU):

| Dato | Valor sugerido |
|---|---|
| Temporada | `2026/27`, inicio `2026-07-01`, fin `2027-06-30` |
| Competencia | `Campeonato Mundial 2027`, tipo `Mundial`, sede `Boston`, fechas `2027-03-22` a `2027-03-28` |
| Patinadora | Nombre `Ana`, apellido `Demo`, país `Ecuador`, nacimiento `2005-03-01`, código `ISU-777001` |
| Programa planeado | Ecuador > Ana Demo, temporada `2026/27`, segmento `Corto` |
| Elementos | #1 `2A`, #2 `3Lz+3T`, #3 `FCSp4` |

- [ ] Cierra notificaciones y pestañas personales. Zoom del navegador al 110 % para que se lea bien.

---

## 1. Introducción y objetivo (0:00 – 0:45)

**MOSTRAR:** la pantalla de login de la app o el README en GitHub (la portada con el título).

**DECIR:**
> "Hola, soy Mell Arguello. Este es BladesInsight, una plataforma que estima las puntuaciones del patinaje artístico individual femenino senior y calcula qué necesita una patinadora para ganarle a otra. El core aprobado es el motor de estimación y análisis de brecha. Ese motor necesita datos maestros bien cargados: patinadoras, competencias, inscripciones y, sobre todo, el programa que cada patinadora planea ejecutar con el valor base de cada elemento. Este módulo de administración es el que carga y protege esos datos."

**Idea clave a transmitir:** la administración no es un adorno; sin sus datos el estimador no puede calcular el TES esperado.

---

## 2. Arquitectura MVC (0:45 – 2:00)

**MOSTRAR (en VS Code, recorriendo el árbol de carpetas):**
1. `src/entities/index.ts` — baja por las clases `Temporada`, `Competencia`, `Patinadora`, `Inscripcion`, `ProgramaPlaneado`, `ElementoPlaneado`.
2. `views/` — abre `form.hbs` y `list.hbs` un par de segundos.
3. `src/admin/` — muestra la lista de controladores.
4. `src/common/crud.controller.ts` — muestra las rutas `@Get`, `@Post`.

**DECIR:**
> "El proyecto sigue el patrón MVC. El **Modelo** son las entidades de TypeORM: cada clase es una tabla de la base de datos y coincide con el diagrama entidad-relación del documento de análisis. La **Vista** son plantillas Handlebars: una de lista y una de formulario que sirven para todos los recursos. El **Controlador** son clases de NestJS, una por recurso. Para no repetir código, todas heredan de un controlador base que ya trae listar, crear, editar y eliminar; cada recurso solo define sus campos y sus reglas de validación."
>
> "Se usa NestJS con TypeScript. En producción la base de datos es PostgreSQL en Render, y también soporta SQL Server, que es el motor del documento original."

**Si preguntan por qué Postgres:** Render no ofrece SQL Server; el código soporta ambos cambiando una variable de entorno.

---

## 3. Qué datos alimentan al core (2:00 – 2:45)

**MOSTRAR:** inicia sesión en la app (cuida que no se vea la contraseña) y deja el **panel principal** con las seis tarjetas.

**DECIR:**
> "El panel muestra los seis grupos de datos. Para estimar a una patinadora en una competencia próxima, el core necesita tres cosas: que esté **inscrita** en la competencia, que tenga un **programa planeado** para el segmento, y los **elementos** de ese programa con su valor base. La suma de valores base es la dificultad del programa, y es la base del TES esperado. Por eso las pantallas de administración están pensadas para dejar esos datos coherentes."

**MOSTRAR (opcional, 15 s):** menú superior: Temporadas, Competencias, Patinadoras, Inscripciones, Programas, Elementos.

---

## 4. Seguridad de acceso (2:45 – 3:15)

**MOSTRAR:**
1. Cierra sesión (botón **Salir**).
2. Escribe en la barra del navegador `.../admin/patinadoras` y muestra que te devuelve al login.
3. Intenta entrar con una contraseña incorrecta y muestra el mensaje de error.
4. Vuelve a iniciar sesión.

**DECIR:**
> "Todo lo que cuelga de `/admin` está protegido por un guard global: sin sesión, el sistema redirige al login. La contraseña se guarda cifrada con bcrypt, la sesión es un token JWT en una cookie `httpOnly`, y hay un límite de cinco intentos fallidos por IP. Las rutas JSON de los dropdowns también están protegidas."

---

## 5. Carga de datos con dropdowns en cascada — Requisito 2 (3:15 – 5:15)

### 5.1 Temporada y competencia (3:15 – 4:00)

**MOSTRAR:**
1. **Temporadas > Nuevo**: crea `2026/27` (`2026-07-01` a `2027-06-30`).
2. **Competencias > Nuevo**: fíjate en que **Temporada es un dropdown**, no un número. Selecciona `2026/27` y llena el resto con los datos sugeridos. Guarda.

**DECIR:**
> "Al crear una competencia no escribo el identificador de la temporada: elijo la temporada en un dropdown. Así es imposible referenciar una temporada que no existe."

### 5.2 Patinadora (4:00 – 4:15)

**MOSTRAR:** **Patinadoras > Nuevo**: crea a Ana Demo con país Ecuador (dropdown) y código `ISU-777001`. *(Aquí no te detengas en el código ISU: la validación se explica en la sección 6.)*

### 5.3 Inscripciones: dos cascadas (4:15 – 4:50)

**MOSTRAR:** **Inscripciones > Nuevo**.
1. Antes de elegir nada, muestra que **Competencia** y **Patinadora** están vacíos/deshabilitados.
2. Elige **Temporada = 2026/27** → el dropdown **Competencia** se llena solo con las competencias de esa temporada.
3. Elige **País = Ecuador** → el dropdown **Patinadora** se llena solo con las patinadoras de ese país.
4. Guarda.

**DECIR:**
> "Este formulario tiene dos cascadas. Al elegir la temporada, el segundo dropdown carga solo las competencias de esa temporada. Al elegir el país, carga solo las patinadoras de ese país. No hay ningún campo donde yo escriba un identificador a mano."

### 5.4 Elementos planeados: cascada de tres niveles (4:50 – 5:15)

Primero crea el programa: **Programas planeados > Nuevo** → País Ecuador → Patinadora Ana Demo → Temporada 2026/27 → Segmento Corto → guarda. *(Hazlo rápido; ya mostraste el patrón.)*

**MOSTRAR:** **Elementos planeados > Nuevo**.
1. Elige **País = Ecuador** → se carga **Patinadora**.
2. Elige **Patinadora = Demo, Ana** → se carga **Programa planeado** con `2026/27 · Corto`.
3. Elige ese programa y deja el formulario listo para la sección siguiente.

**DECIR:**
> "Aquí la cascada es de tres niveles: país, patinadora y programa planeado. Cada dropdown depende del anterior."

**MOSTRAR (opcional, 20 s, en VS Code):** abre `public/admin.js` y señala el `fetch` hacia `data.url`, y `misc.controllers.ts` para el endpoint `/admin/api/...`.

> "Técnicamente, cada dropdown hijo consulta un endpoint JSON cuando cambia el padre. Y al editar un registro, las cascadas se precargan con lo guardado."

---

## 6. Validaciones en el back-end — Requisito 1 (5:15 – 7:45)

**DECIR (introducción, 15 s):**
> "Ahora la parte más importante: los datos sensibles se validan en el servidor antes de grabarse. Las validaciones del navegador se pueden saltar, así que el servidor no confía en nada de lo que envía el formulario. Hay dos datos sensibles para el core."

### 6.1 Dato sensible 1: el código ISU (5:30 – 6:30)

**¿Por qué es sensible?** Es la clave con la que el proceso de carga enlaza los resultados oficiales con cada patinadora. Si está mal o repetido, los resultados se asignan a la patinadora equivocada y el estimador se corrompe.

**MOSTRAR (código):** abre `src/admin/patinadoras.controller.ts` y señala, en este orden:
1. La constante `ISU_ID` (expresión regular).
2. En `save()`: la normalización a mayúsculas, la comprobación del formato y la búsqueda de duplicados (`findOneBy({ isuId })`).
3. La validación de edad (15 años al 1 de julio).

**MOSTRAR (demostración, en la app):** **Patinadoras > Nuevo**:
1. Código `12345` → la página vuelve con el error **"Formato inválido…"** y los datos que escribiste siguen en el formulario.
2. Código `ISU-777001` (el de Ana, ya existente) → error **"Ese código ISU ya está registrado…"**.
3. Fecha de nacimiento `2020-03-01` con un código válido (`ISU-777002`) → error de la edad mínima.

**DECIR:**
> "Si ingreso un código con formato incorrecto, el servidor lo rechaza. Si ingreso uno que ya existe, también. Y si la fecha de nacimiento no cumple la edad mínima de la categoría senior, también. Esto no es JavaScript del navegador: los formularios llevan `novalidate`, y el que decide es el controlador de NestJS antes de ejecutar el `save` en la base."

### 6.2 Dato sensible 2: el valor base del elemento (6:30 – 7:30)

**¿Por qué es sensible?** El valor base de cada elemento es lo que mide la dificultad del programa y alimenta directamente el TES esperado. Un valor alterado cambiaría las estimaciones y la brecha.

**MOSTRAR (código):** abre `src/common/catalogos.ts` y señala `SALTOS_BASE` y la función `resolverElemento`. Luego `elementos-planeados.controller.ts`, la parte de `save()` donde se usa `resolverElemento(codigo)` y se guarda `info.base` (nunca `body.valorBase`).

**MOSTRAR (demostración, en la app):** **Elementos planeados > Nuevo**:
1. Elige País > Patinadora > Programa. Orden `1`, código `2A`. Guarda → en la lista aparece **tipo Salto, valor base 3.30**.
2. Nuevo elemento: orden `2`, código `3Lz+3T`. **Antes de guardar**, abre DevTools (F12 > Console) y pega:
   ```js
   document.querySelector('form.card').insertAdjacentHTML('beforeend','<input type="hidden" name="valorBase" value="99">')
   ```
   Guarda. En la lista aparece **10.10**, no 99.
3. Nuevo elemento: orden `3`, código `9Z` → error **"Código de elemento no reconocido…"**.
4. (Opcional) Orden `4`, código `3F`, marca "segunda mitad" en un programa **Corto** → error de que el bonus solo aplica al libre.

**DECIR:**
> "El valor base nunca se acepta del cliente. El formulario ni siquiera tiene ese campo. Incluso si alguien lo inyecta a mano, como acabo de hacer desde las herramientas del navegador con un 99, el servidor lo ignora y calcula el valor desde el catálogo ISU: 3Lz más 3T da 10.10. El servidor también determina el tipo de elemento y valida el orden, el máximo de elementos por segmento y que el bonus de segunda mitad aplique solo a saltos del programa libre."

### 6.3 Coherencia de las claves foráneas (7:30 – 7:45, solo si hay tiempo)

**DECIR:**
> "Además, aunque los dropdowns filtren, el servidor vuelve a comprobar que la competencia pertenezca a la temporada y la patinadora al país elegidos. La cascada mejora la experiencia, pero la integridad la garantiza el back-end."

**MOSTRAR:** en `inscripciones.controller.ts`, el bloque con los mensajes *"no pertenece a la temporada elegida"* / *"no pertenece al país elegido"*.

---

## 7. Cómo se conecta con el core (7:45 – 8:15)

**MOSTRAR:** la lista de **Elementos planeados** con los tres elementos de Ana (`2A`, `3Lz+3T`, `FCSp4`), y si quieres, el ejemplo numérico de la sección 2.6 del documento de análisis.

**DECIR:**
> "Con estos datos el core ya puede trabajar: Ana está inscrita en la competencia, tiene un programa corto planeado y sus elementos suman un valor base de 3.30 más 10.10 más 3.20. A ese valor base el estimador le suma el GOE esperado, calculado con su historial, para obtener el TES esperado. Y el análisis de brecha parte de esos mismos números."

---

## 8. Git y despliegue (8:15 – 9:00)

**MOSTRAR:**
1. El repositorio en GitHub (`github.com/mells012/BladesInsight`): lista de archivos y el **README** con las secciones de los dos requisitos.
2. El panel de Render con el servicio en estado **Live**.
3. La URL pública en la barra del navegador.

**DECIR:**
> "El código está versionado en Git y publicado en GitHub, con un README que explica la arquitectura, los dos requisitos y cómo ejecutarlo. El despliegue está en Render, con un archivo `render.yaml` que crea el servicio y la base PostgreSQL, y define las variables de producción: el secreto del token y la contraseña del administrador se generan automáticamente. La aplicación está disponible en esta URL."

**Cierre:**
> "Con esto, la administración queda lista para alimentar el core de BladesInsight con datos coherentes y validados. Gracias."

---

## Consejos de grabación

- **Si algo falla en vivo**, no lo ocultes: corrige y continúa; en edición se puede cortar. Lo importante es que se vea el comportamiento.
- **Hablar mientras haces clic**: describe lo que haces ("elijo el país Ecuador… y observen cómo se llena el dropdown de patinadoras").
- **No muestres** la contraseña, el token de GitHub ni variables de entorno de Render con valores secretos.
- **Si te falta tiempo**, recorta en este orden: 6.3, el opcional del punto 4 del paso 6.2, y la mención de `admin.js` en 5.4. **No recortes** la sección 5 ni la 6.1–6.2: son los dos requisitos que se evalúan.
- **Después de grabar**: pega el enlace en el README (línea `Video explicativo`) y sube el cambio.
