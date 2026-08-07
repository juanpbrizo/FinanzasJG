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
- Registro de gastos por categoria
- Transferencias entre fondos
- Cierre de mes
- Tarjetas de credito y compras en cuotas
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
