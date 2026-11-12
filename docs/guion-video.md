# Guion del video (5–7 min) — Administración que alimenta el core

1. **(0:00) Contexto.** BladesInsight estima puntuaciones y calcula "¿qué necesita para ganarle a X?". Para eso el core necesita datos maestros; esta administración los carga y los protege.
2. **(0:45) Arquitectura MVC.** Mostrar en VS Code: `entities/` (Modelo), `admin/*.controller.ts` (Controlador), `views/` (Vista). Explicar `crud.controller.ts` como base común.
3. **(1:30) Login.** Entrar al panel; mostrar que `/admin` sin sesión redirige a `/login`.
4. **(2:00) Flujo de carga.** Crear temporada → competencia (dropdown de temporada) → patinadora.
5. **(3:00) Requisito 2 — cascadas.** Inscripciones: elegir Temporada y ver cómo se carga Competencia; País → Patinadora. Elementos planeados: País → Patinadora → Programa (3 niveles). Mostrar `public/admin.js` y `/admin/api/*`.
6. **(4:15) Requisito 1 — validación en back-end.** Mostrar el código en `patinadoras.controller.ts`. Demostrar: ISU `12345` rechazado; ISU duplicado rechazado; en DevTools quitar el atributo/enviar `valorBase=99` en elementos y ver que el servidor lo ignora y calcula 10.10.
7. **(5:30) Cómo alimenta al core.** Inscritas + programa planeado + valor base = entrada del estimador (TES esperado).
8. **(6:15) Git y despliegue.** Mostrar el repositorio, el README y la URL desplegada.
