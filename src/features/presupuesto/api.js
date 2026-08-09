import { getSupabase } from '../../lib/supabase'

/**
 * Inicializa un periodo: crea periodo + fondos + categorias + ingresos fijos.
 * Idempotente: si existe, devuelve el ID sin duplicar.
 * Se envian ambos parametros para desambiguar la firma de la RPC.
 */
export async function inicializarPeriodo(periodo, arrastrarSaldos = true) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('inicializar_periodo', {
    p_periodo: periodo,
    p_arrastrar_saldos: arrastrarSaldos,
  })

  if (error) throw error
  return data // UUID del periodo creado/existente
}

/**
 * Carga el periodo: sus fondos mensuales y categorias.
 * Se traen los movimientos con su detalle porque la pantalla del mes los lista
 * para editar/eliminar; asi el gasto por fondo y la lista salen de la misma query.
 * Filtra por periodo_id y usuario (garantizado por RLS).
 */
export async function obtenerFondosMensuales(periodoId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fondos_mensuales')
    .select(
      `*, categorias_mensuales(
        *,
        movimientos(
          id,
          descripcion,
          monto,
          fecha_transaccion,
          medio_pago,
          compra_cuota_id,
          numero_cuota,
          total_cuotas
        )
      )`
    )
    .eq('periodo_id', periodoId)
    .order('nombre', { ascending: true })

  if (error) throw error
  // Ordenar categorías alfabéticamente dentro de cada fondo
  if (data) {
    data.forEach(fondo => {
      if (fondo.categorias_mensuales) {
        fondo.categorias_mensuales.sort((a, b) => a.nombre.localeCompare(b.nombre))
      }
    })
  }
  return data || []
}

/**
 * Vista de resumen del periodo: ingresos, presupuesto, gasto, dinero sin asignar.
 */
export async function obtenerResumenPeriodo(periodoId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('v_resumen_periodo')
    .select('*')
    .eq('periodo_id', periodoId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Obtiene un periodo especifico por fecha.
 */
export async function obtenerPeriodo(periodo) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('periodos_mes')
    .select('*')
    .eq('periodo', periodo)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Re-clona los fondos/categorias de la plantilla hacia un periodo ya existente.
 * Util cuando el mes se inicializo antes de configurar la plantilla.
 * @returns {Promise<number>} Cantidad de fondos nuevos creados.
 */
export async function sincronizarFondosDesdePlantilla(periodo) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('sincronizar_fondos_desde_plantilla', {
    p_periodo: periodo,
  })

  if (error) throw error
  return data ?? 0
}

/**
 * Actualiza un fondo mensual (tipicamente su monto presupuestado).
 * @param {string} fondoId
 * @param {object} payload - { monto_presupuestado }
 */
export async function actualizarFondoMensual(fondoId, payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fondos_mensuales')
    .update(payload)
    .eq('id', fondoId)
    .select()

  if (error) throw error
  return data[0]
}

/**
 * Registra un gasto (movimiento simple).
 * El `usuario_id` se adjunta explicitamente: la policy RLS exige
 * `usuario_id = auth.uid()` y omitirlo devuelve 403 Forbidden.
 * @param {object} payload - { categoria_mensual_id, descripcion, monto, fecha_transaccion, medio_pago }
 */
export async function crearGasto(payload) {
  const supabase = getSupabase()

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser()

  if (errorUsuario) throw errorUsuario
  if (!user) throw new Error('Sesión expirada. Volvé a iniciar sesión para registrar el gasto.')

  const monto = Number(payload.monto)
  const camposFaltantes = [
    ['categoría', payload.categoria_mensual_id],
    ['descripción', payload.descripcion?.trim()],
    ['fecha', payload.fecha_transaccion],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (camposFaltantes.length > 0) {
    throw new Error(`Faltan datos obligatorios: ${camposFaltantes.join(', ')}.`)
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto debe ser un número mayor a 0.')
  }

  const { data, error } = await supabase
    .from('movimientos')
    .insert([
      {
        usuario_id: user.id,
        categoria_mensual_id: payload.categoria_mensual_id,
        descripcion: payload.descripcion.trim(),
        monto,
        fecha_transaccion: payload.fecha_transaccion,
        medio_pago: payload.medio_pago || 'efectivo',
      },
    ])
    .select()

  if (error) throw error
  return data[0]
}

/**
 * Edita un gasto ya registrado.
 * El periodo cerrado lo rechaza el trigger `tr_bloquear_cambios_movimientos_cerrado`
 * (Regla R5); aca solo se validan los datos del formulario.
 * @param {string} movimientoId
 * @param {object} payload - { categoria_mensual_id, descripcion, monto, fecha_transaccion, medio_pago }
 */
export async function actualizarGasto(movimientoId, payload) {
  const supabase = getSupabase()

  const monto = Number(payload.monto)
  const camposFaltantes = [
    ['categoría', payload.categoria_mensual_id],
    ['descripción', payload.descripcion?.trim()],
    ['fecha', payload.fecha_transaccion],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (camposFaltantes.length > 0) {
    throw new Error(`Faltan datos obligatorios: ${camposFaltantes.join(', ')}.`)
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto debe ser un número mayor a 0.')
  }

  const { data, error } = await supabase
    .from('movimientos')
    .update({
      categoria_mensual_id: payload.categoria_mensual_id,
      descripcion: payload.descripcion.trim(),
      monto,
      fecha_transaccion: payload.fecha_transaccion,
      medio_pago: payload.medio_pago || 'efectivo',
    })
    .eq('id', movimientoId)
    .select()

  if (error) throw error
  return data[0]
}

/**
 * Elimina un gasto. El trigger de periodo cerrado bloquea el borrado (Regla R5).
 * @param {string} movimientoId
 */
export async function eliminarGasto(movimientoId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('movimientos').delete().eq('id', movimientoId)

  if (error) throw error
}

/**
 * Obtiene los ingresos de un periodo.
 */
export async function obtenerIngresos(periodoId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ingresos')
    .select('*')
    .eq('periodo_id', periodoId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtiene la plantilla de fondos del usuario.
 */
export async function obtenerFondosPlantilla() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fondos_plantilla')
    .select('*, categorias_plantilla(*)')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw error
  // Ordenar categorías alfabéticamente dentro de cada fondo
  if (data) {
    data.forEach(fondo => {
      if (fondo.categorias_plantilla) {
        fondo.categorias_plantilla.sort((a, b) => a.nombre.localeCompare(b.nombre))
      }
    })
  }
  return data || []
}

/**
 * Crea un nuevo fondo en la plantilla.
 */
export async function crearFondoPlantilla(payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('fondos_plantilla').insert([payload]).select()

  if (error) throw error
  return data[0]
}

/**
 * Crea una nueva categoria dentro de un fondo plantilla.
 */
export async function crearCategoriaPlantilla(payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('categorias_plantilla').insert([payload]).select()

  if (error) throw error
  return data[0]
}

/**
 * Actualiza un fondo de la plantilla.
 * @param {string} fondoId
 * @param {object} payload - { nombre, monto_sugerido, tipo }
 */
export async function actualizarFondoPlantilla(fondoId, payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fondos_plantilla')
    .update(payload)
    .eq('id', fondoId)
    .select()

  if (error) throw error
  return data[0]
}

/**
 * Elimina un fondo plantilla y sus categorias asociadas.
 */
export async function eliminarFondoPlantilla(fondoId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('fondos_plantilla').delete().eq('id', fondoId)

  if (error) throw error
}

/**
 * Elimina una categoria plantilla.
 */
export async function eliminarCategoriaPlantilla(categoriaId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('categorias_plantilla').delete().eq('id', categoriaId)

  if (error) throw error
}

/**
 * Transfiere un monto de un fondo a otro (RPC Fase 3).
 * @param {object} payload - { periodo_id, origen_id, destino_id, monto, motivo }
 */
export async function transferirEntreFondos(payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('transferir_entre_fondos', {
    p_periodo_id: payload.periodo_id,
    p_origen_id: payload.origen_id,
    p_destino_id: payload.destino_id,
    p_monto: payload.monto,
    p_motivo: payload.motivo || 'Reasignación de fondos',
  })

  if (error) throw error
  return data
}

/**
 * Cierra un periodo, congelando sus movimientos en solo lectura (RPC Fase 3).
 * @param {date} periodo - Fecha del periodo (ej. "2026-08-01")
 */
export async function cerrarPeriodo(periodo) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('cerrar_periodo', { p_periodo: periodo })

  if (error) throw error
}

/**
 * Obtiene el historial de transferencias de un periodo.
 */
export async function obtenerHistorialTransferencias(periodoId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('transferencias_fondos')
    .select(
      `
      *,
      fondo_origen:fondo_origen_id(nombre),
      fondo_destino:fondo_destino_id(nombre)
    `
    )
    .eq('periodo_id', periodoId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtiene todos los movimientos de un período (para exportación, análisis).
 */
export async function obtenerMovimientosDelPeriodo(periodoId) {
  const supabase = getSupabase()
  // Verifica que el período existe (RLS lo filtrará automáticamente)
  const { error: errPeriodo } = await supabase
    .from('periodos_mes')
    .select('id')
    .eq('id', periodoId)
    .single()

  if (errPeriodo) throw errPeriodo

  const { data, error } = await supabase
    .from('movimientos')
    .select(
      `
      id,
      fecha_transaccion,
      descripcion,
      monto,
      medio_pago,
      numero_cuota,
      total_cuotas,
      categoria_mensual_id,
      categorias_mensuales(nombre, fondo_mensual_id, fondos_mensuales(nombre, tipo))
    `
    )
    .order('fecha_transaccion', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtiene datos de analytics anuales: últimos 12 meses resumidos.
 */
export async function obtenerAnalyticsAnual() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('v_analytics_anual')
    .select('*')
    .limit(12)

  if (error) throw error
  return data || []
}

/**
 * Crea un nuevo ingreso en un periodo.
 * @param {object} payload - { periodo_id, descripcion, monto, es_fijo, fecha }
 */
export async function crearIngreso(payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('ingresos').insert([payload]).select()

  if (error) throw error
  return data[0]
}

/**
 * Actualiza un ingreso existente.
 * @param {string} ingresoId - ID del ingreso a actualizar
 * @param {object} payload - Campos a actualizar (descripcion, monto, es_fijo, fecha)
 */
export async function actualizarIngreso(ingresoId, payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ingresos')
    .update(payload)
    .eq('id', ingresoId)
    .select()

  if (error) throw error
  return data[0]
}

/**
 * Elimina un ingreso.
 * @param {string} ingresoId - ID del ingreso a eliminar
 */
export async function eliminarIngreso(ingresoId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('ingresos').delete().eq('id', ingresoId)

  if (error) throw error
}
