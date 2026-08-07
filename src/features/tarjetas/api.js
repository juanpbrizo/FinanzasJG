import { getSupabase } from '../../lib/supabase'

/**
 * API pura para tarjetas de crédito y compras en cuotas.
 * Sin dependencias de React; todos los errores lanzan excepciones.
 */

// ============================================================================
// TARJETAS DE CRÉDITO (CRUD)
// ============================================================================

export async function obtenerTarjetas() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tarjetas_credito')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function obtenerTarjeta(tarjetaId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tarjetas_credito')
    .select('*')
    .eq('id', tarjetaId)
    .single()

  if (error) throw error
  return data
}

export async function crearTarjeta(payload) {
  const supabase = getSupabase()
  const nombre = payload.nombre?.trim()
  const limite_total = Number(payload.limite_total)
  const dia_cierre = parseInt(payload.dia_cierre, 10)
  const dia_vencimiento = parseInt(payload.dia_vencimiento, 10)

  if (!nombre) throw new Error('El nombre de la tarjeta es obligatorio')
  if (!Number.isFinite(limite_total) || limite_total < 0) {
    throw new Error('El límite total debe ser un número mayor o igual a 0')
  }
  if (!Number.isInteger(dia_cierre) || dia_cierre < 1 || dia_cierre > 31) {
    throw new Error('El día de cierre debe ser un entero entre 1 y 31')
  }
  if (!Number.isInteger(dia_vencimiento) || dia_vencimiento < 1 || dia_vencimiento > 31) {
    throw new Error('El día de vencimiento debe ser un entero entre 1 y 31')
  }

  const { data, error } = await supabase
    .from('tarjetas_credito')
    .insert([{ nombre, limite_total, dia_cierre, dia_vencimiento }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarTarjeta(tarjetaId, payload) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tarjetas_credito')
    .update(payload)
    .eq('id', tarjetaId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function eliminarTarjeta(tarjetaId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('tarjetas_credito').delete().eq('id', tarjetaId)

  if (error) throw error
}

// ============================================================================
// COMPRAS EN CUOTAS (RPC y Queries)
// ============================================================================

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const RE_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Registra una compra en N cuotas via RPC.
 * El payload se normaliza a los tipos que espera la funcion de Postgres
 * (uuid / numeric / integer / date) para evitar 400 Bad Request.
 */
export async function registrarCompraCuotas(payload) {
  const supabase = getSupabase()

  const tarjeta_id = payload.tarjeta_id?.trim()
  const categoria_plantilla_id = payload.categoria_plantilla_id?.trim() || null
  const descripcion = payload.descripcion?.trim()
  const monto_total = Number(payload.monto_total)
  const cantidad_cuotas = parseInt(payload.cantidad_cuotas, 10)
  const fecha_compra = payload.fecha_compra

  if (!tarjeta_id || !RE_UUID.test(tarjeta_id)) {
    throw new Error('Seleccioná una tarjeta válida')
  }
  if (!categoria_plantilla_id || !RE_UUID.test(categoria_plantilla_id)) {
    throw new Error('Seleccioná la categoría del presupuesto donde se imputarán las cuotas')
  }
  if (!descripcion) {
    throw new Error('La descripción es obligatoria')
  }
  if (!Number.isFinite(monto_total) || monto_total <= 0) {
    throw new Error('El monto total debe ser un número mayor a 0')
  }
  if (!Number.isInteger(cantidad_cuotas) || cantidad_cuotas < 1) {
    throw new Error('La cantidad de cuotas debe ser un entero mayor o igual a 1')
  }
  if (!fecha_compra || !RE_FECHA_ISO.test(fecha_compra)) {
    throw new Error('La fecha de compra debe tener formato YYYY-MM-DD')
  }

  const { data, error } = await supabase.rpc('registrar_compra_cuotas', {
    p_tarjeta_id: tarjeta_id,
    p_descripcion: descripcion,
    p_monto_total: monto_total,
    p_cantidad_cuotas: cantidad_cuotas,
    p_fecha_compra: fecha_compra,
    p_categoria_plantilla_id: categoria_plantilla_id,
    p_es_monto_variable: Boolean(payload.es_monto_variable),
  })

  if (error) throw error
  return data
}

export async function obtenerComprasCuotas(tarjetaId = null) {
  const supabase = getSupabase()
  let query = supabase.from('compras_cuotas').select(`
    id,
    tarjeta_id,
    descripcion,
    monto_total,
    cantidad_cuotas,
    fecha_compra,
    primer_periodo_impacto,
    categoria_plantilla_id,
    es_monto_variable,
    created_at
  `)

  if (tarjetaId) {
    query = query.eq('tarjeta_id', tarjetaId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function obtenerCompraCuota(compraId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('compras_cuotas')
    .select('*')
    .eq('id', compraId)
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// MOVIMIENTOS (Cuotas)
// ============================================================================

export async function obtenerMovimientosCompraCuotas(compraId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('movimientos')
    .select(`
      id,
      categoria_mensual_id,
      descripcion,
      monto,
      fecha_transaccion,
      medio_pago,
      compra_cuota_id,
      numero_cuota,
      total_cuotas,
      monto_teorico,
      ajustado_manualmente,
      created_at
    `)
    .eq('compra_cuota_id', compraId)
    .order('numero_cuota', { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================================================
// CUOTAS INDIVIDUALES (Edición)
// ============================================================================

export async function actualizarCuotaIndividual(movimientoId, nuevoMonto) {
  const supabase = getSupabase()

  if (!movimientoId || nuevoMonto <= 0) {
    throw new Error('movimientoId requerido y nuevoMonto > 0')
  }

  const { error } = await supabase.rpc('actualizar_cuota_individual', {
    p_movimiento_id: movimientoId,
    p_nuevo_monto: nuevoMonto,
  })

  if (error) throw error
}

export async function recalcularCuotasPendientes(compraId, nuevoSaldo) {
  const supabase = getSupabase()

  if (!compraId || nuevoSaldo <= 0) {
    throw new Error('compraId requerido y nuevoSaldo > 0')
  }

  const { error } = await supabase.rpc('recalcular_cuotas_pendientes', {
    p_compra_cuota_id: compraId,
    p_nuevo_saldo: nuevoSaldo,
  })

  if (error) throw error
}

// ============================================================================
// VISTAS (Estado de Compras)
// ============================================================================

export async function obtenerEstadoCompraCuotas(compraId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('v_estado_compra_cuotas')
    .select('*')
    .eq('compra_cuota_id', compraId)
    .single()

  if (error) throw error
  return data
}

export async function obtenerEstadoComprasCuotas(tarjetaId = null) {
  const supabase = getSupabase()
  let query = supabase
    .from('v_estado_compra_cuotas')
    .select('*')
    .order('compra_cuota_id', { ascending: false })

  if (tarjetaId) {
    query = query.eq('tarjeta_id', tarjetaId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula el límite disponible de una tarjeta.
 * disponible = limite_total - (suma de cuotas pendientes)
 */
export async function calcularDisponibleTarjeta(tarjetaId) {
  // Obtiene la tarjeta
  const tarjeta = await obtenerTarjeta(tarjetaId)
  if (!tarjeta) throw new Error('Tarjeta no encontrada')

  // Obtiene todas las compras en cuotas
  const compras = await obtenerComprasCuotas(tarjetaId)

  // Suma de cuotas pendientes (aproximado; en Fase 3 optimizamos con una view dedicada)
  let totalComprometido = 0
  for (const compra of compras) {
    const movimientos = await obtenerMovimientosCompraCuotas(compra.id)
    const sumaCuotas = movimientos.reduce((acc, m) => acc + parseFloat(m.monto || 0), 0)
    totalComprometido += sumaCuotas
  }

  return {
    limite_total: tarjeta.limite_total,
    comprometido: totalComprometido,
    disponible: tarjeta.limite_total - totalComprometido,
  }
}
