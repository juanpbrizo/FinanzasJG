# FinanzasJG

Aplicacion web de finanzas personales con presupuesto mensual, fondos/categorias, ingresos, tarjetas de credito y analytics.

## Stack

- React 19 + Vite
- Tailwind CSS
- TanStack Query
- Supabase (Auth, PostgREST, PostgreSQL)

## Funcionalidades principales

- Acceso restringido por invitacion (email + contrasena, sin registro publico)
- Gestion de periodos mensuales (`/mes/:periodo`)
- Ingresos del periodo (crear, editar, eliminar)
- Fondos y categorias de plantilla (`/configuracion`)
- Sincronizacion de plantilla hacia el mes activo
- Registro de gastos por categoria con **selector en cascada Fondo → Categoría**
- Transferencias entre fondos
- Cierre de mes
- Tarjetas de credito y compras en cuotas
- **Suscripciones recurrentes** (Netflix, Spotify, etc) - liquidación automática con frecuencias variables
- Analytics anual

## Requisitos

- Node.js 20+
- npm 10+
- Proyecto Supabase configurado

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno en `.env.local`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

3. Levantar entorno de desarrollo:

```bash
npm run dev
```

## Acceso (aplicacion privada)

El login usa email + contrasena (`signInWithPassword`). No hay registro publico ni
envio de correos: las cuentas se crean manualmente desde Supabase
(Authentication > Users > Add user, con contrasena y "Auto Confirm User" activado).

Cualquier combinacion invalida muestra "Credenciales incorrectas o usuario no autorizado."
sin revelar si el email existe.

## Scripts disponibles

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de produccion
- `npm run preview`: previsualizacion local del build
- `npm run lint`: analisis ESLint
- `npm run lint:fix`: autocorreccion de lint
- `npm run format`: formateo con Prettier
- `npm run format:check`: verificacion de formato
- `npm run verify`: lint + build

## Base de datos y migraciones

Las migraciones SQL se encuentran en `supabase/migrations`.

Para este estado del proyecto, aplicar en orden:

1. `20260806000000_esquema_inicial.sql`
2. `20260806000001_fase1_rpc_y_vistas.sql`
3. `20260806000002_fase2_tarjetas_y_cuotas.sql`
4. `20260806000003_fase3_transferencias_y_cierre.sql`
5. `20260806000004_fase4_arrastre_saldos_y_analytics.sql`
6. `20260806000005_fix_overload_inicializar_periodo.sql`
7. `20260806000006_default_usuario_id.sql`
8. `20260806000007_sincronizar_fondos_plantilla.sql`
9. `20260806000008_fix_resumen_periodo_cartesiano.sql`
10. `20260806000009_fix_trigger_fondos_mensuales.sql`
11. `20260806000010_fix_movimientos_insert_403.sql`
12. `20260806000011_fix_compras_cuotas_400_404.sql`
13. `20260806000012_liquidacion_dinamica_cuotas.sql`
14. `20260807000000_suscripciones_recurrentes.sql` - Suscripciones con liquidación automática
15. `20260807000001_fix_suscripciones_default_usuario_id.sql` - RLS correction
16. `20260807000002_fix_suscripciones_categoria_plantilla.sql` - Schema fix

### Características de las suscripciones

- Registro de servicios recurrentes (MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL)
- Liquidación automática al inicializar o sincronizar el período
- Descuento del límite disponible de la tarjeta como gasto comprometido
- Frecuencias personalizables con mes de cobro anual para suscripciones anuales
- RLS por usuario para privacidad

### Formularios con cascada Fondo → Categoría

Los formularios de "Crear Gasto" y "Compra en Cuotas" ahora usan un selector en cascada:
1. Seleccionar **Fondo** (Comida, Ocio, Servicios, etc)
2. Se despliegan únicamente las **Categorías** de ese Fondo
3. La categoría se limpia automáticamente si el usuario cambia el fondo

Las compras en cuotas se registran en `compras_cuotas` y sus movimientos se
liquidan automaticamente por periodo al inicializar o sincronizar el mes.

## Correcciones y mejoras recientes

- Se corrigio el INSERT de gastos para adjuntar `usuario_id` y resolver el 403 en `movimientos`.
- Se ajusto el flujo de compras en cuotas para evitar 400 por payload invalido y 404 en la vista de estado/proyeccion.
- Implementado módulo completo de **Suscripciones Recurrentes** con:
  - Tabla `suscripciones` con RLS por usuario
  - ENUM `frecuencia_suscripcion` con 5 opciones de periodicidad
  - RPC `liquidar_suscripciones_periodo()` para generación automática de movimientos
  - Integración en `inicializar_periodo()` y `sincronizar_fondos_desde_plantilla()`
  - Vista `v_resumen_tarjetas` actualizada con CTE para cálculo de comprometido (cuotas + suscripciones)
  - Migraciones idempotentes para aplicación repetible
- Refactorizado UI: selector en cascada **Fondo → Categoría** en formularios de gastos y compras
- `npm run verify` pasa limpio con lint + build.

## Estructura (resumen)

- `src/features/presupuesto`: presupuesto mensual, ingresos y fondos
- `src/features/tarjetas`: tarjetas y cuotas
- `src/features/configuracion`: plantilla de fondos y categorias
- `src/components/ui`: componentes base reutilizables
- `supabase/migrations`: versionado de esquema y logica SQL

## Verificacion recomendada

```bash
npm run verify
```

## Licencia

Uso privado por defecto. Agregar licencia explicita si se desea publicar con terminos abiertos.
