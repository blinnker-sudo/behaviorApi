# @identity/api

API NestJS con motor de behaviors dirigido por configuración, soporta múltiples países cargados dinámicamente al arranque.

## Cómo correr

Instalar dependencias (incluye libs locales de país):

```bash
npm install
```

Correr en modo país específico (variable `COUNTRY`):

```bash
COUNTRY=MX npm run start
COUNTRY=PE npm run start
```

Modo desarrollo con watch:

```bash
COUNTRY=MX npm run start:dev
```

## Endpoints

Los 3 endpoints reciben el mismo `DataWorkflowDto`. El campo `flow` indica qué pipeline ejecutar.

| Método | Ruta                  | Fase     |
|--------|-----------------------|----------|
| POST   | `/workflows/init`     | INIT     |
| POST   | `/workflows/layout`   | LAYOUT   |
| POST   | `/workflows/complete` | COMPLETE |

Respuestas:
- `201` — pipeline ejecutado, devuelve el resultado del último behavior.
- `400` — DTO inválido o step inválido.
- `501` — flow no soportado por el país cargado.
- `500` — error inesperado.

## Cómo agregar un país nuevo

1. Crear repo `lib-<pais>` con la misma estructura que `lib-mexico`:
   - `src/contracts/` con duplicados de `Behavior`, `BehaviorContext`, `CountryConfig`, `Step`.
   - `src/behavior/` con `BEHAVIOR_METADATA` (mismo string `'BEHAVIOR_METADATA'`) y el decorador `RegisterBehavior`.
   - `src/behaviors/` con las clases.
   - `src/<pais>.module.ts` declarando los providers.
   - `src/index.ts` con todos los barrels.
2. Crear `src/country/configs/<pais>.behaviors.json` **en este repo (api)** con los flows del país.
3. Instalar la lib: `npm install ../lib-<pais>`.
4. Agregar el `case '<CODIGO>'` en [src/country/country.module.ts](src/country/country.module.ts), importar el JSON local y agregar el código a `SUPPORTED`.
5. Listo. No hay que tocar el controller ni el registry.

## Estructura interna

- [src/behavior/](src/behavior/) — `BehaviorRegistry`, `@RegisterBehavior`, tokens.
- [src/country/](src/country/) — `CountryModule.forRoot()` que resuelve la lib del país por `process.env.COUNTRY`.
- [src/country/configs/](src/country/configs/) — JSON de flows por país (la API decide qué flows existen, las libs solo proveen behaviors).
- [src/workflows/](src/workflows/) — `WorkflowsController` (sin ifs por país).
- [src/contracts/](src/contracts/) — interfaces y DTOs (duplicados también en cada `lib-<pais>`).
- [src/common/all-exceptions.filter.ts](src/common/all-exceptions.filter.ts) — filtro global de errores.

## Tests

```bash
npm test
```

Cubre: unit tests del registry (orden, propagación de state, `NotImplementedException`, validación de boot) e integración HTTP con MX y PE.
