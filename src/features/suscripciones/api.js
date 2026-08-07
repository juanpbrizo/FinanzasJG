import { getSupabase } from '../../lib/supabase'

/**
 * API para gestionar suscripciones recurrentes.
 * Sin dependencias de React; todos los errores lanzan excepciones.
 */

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ============================================================================
// CRUD: SUSCRIPCIONES
// ============================================================================

export async function obtenerSuscripciones() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('suscripciones')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function obtenerSuscripcionesPorTarjeta(tarjetaId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('tarjeta_id', tarjetaId)
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function obtenerSuscripcion(suscripcionId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('id', suscripcionId)
    .single()

  if (error) throw error
  return data
}

export async function crearSuscripcion(payload) {
  const supabase = getSupabase()

  const nombre = payload.nombre?.trim()
  const monto = Number(payload.monto)
  const tarjeta_id = payload.tarjeta_id?.trim()
  const categoria_plantilla_id = payload.categoria_plantilla_id?.trim()
    ? payload.categoria_plantilla_id.trim()
    : null
  const frecuencia = payload.frecuencia?.toUpperCase()
  const mes_cobro_anual = payload.mes_cobro_anual
    ? parseInt(payload.mes_cobro_anual, 10)
    : null
  const dia_vencimiento = parseInt(payload.dia_vencimiento, 10)

  if (!nombre) throw new Error('El nombre de la suscripción es obligatorio')
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto debe ser un número mayor a 0')
  }
  if (!tarjeta_id || !RE_UUID.test(tarjeta_id)) {
    throw new Error('Seleccioná una tarjeta válida')
  }
  if (!['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'].includes(frecuencia)) {
    throw new Error('Frecuencia inválida')
  }
  if (frecuencia === 'ANUAL' && (!mes_cobro_anual || mes_cobro_anual < 1 || mes_cobro_anual > 12)) {
    throw new Error('Las suscripciones anuales requieren un mes de cobro (1-12)')
  }
  if (!Number.isInteger(dia_vencimiento) || dia_vencimiento < 1 || dia_vencimiento > 31) {
    throw new Error('El día de vencimiento debe ser un entero entre 1 y 31')
  }

  const { data, error } = await supabase
    .from('suscripciones')
    .insert([
      {
        nombre,
        monto,
        tarjeta_id,
        categoria_plantilla_id,
        frecuencia,
        mes_cobro_anual: frecuencia === 'ANUAL' ? mes_cobro_anual : null,
        dia_vencimiento,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarSuscripcion(suscripcionId, payload) {
  const supabase = getSupabase()

  const update = {}

  if ('nombre' in payload) {
    const nombre = payload.nombre?.trim()
    if (!nombre) throw new Error('El nombre no puede estar vacío')
    update.nombre = nombre
  }

  if ('monto' in payload) {
    const monto = Number(payload.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error('El monto debe ser un número mayor a 0')
    }
    update.monto = monto
  }

  if ('dia_vencimiento' in payload) {
    const dia = parseInt(payload.dia_vencimiento, 10)
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      throw new Error('El día debe ser un entero entre 1 y 31')
    }
    update.dia_vencimiento = dia
  }

  if ('activa' in payload) {
    update.activa = Boolean(payload.activa)
  }

  if ('frecuencia' in payload) {
    const frecuencia = payload.frecuencia?.toUpperCase()
    if (!['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'].includes(frecuencia)) {
      throw new Error('Frecuencia inválida')
    }
    update.frecuencia = frecuencia

    if ('mes_cobro_anual' in payload) {
      const mes = payload.mes_cobro_anual ? parseInt(payload.mes_cobro_anual, 10) : null
      if (frecuencia === 'ANUAL' && (!mes || mes < 1 || mes > 12)) {
        throw new Error('Las suscripciones anuales requieren un mes de cobro válido')
      }
      update.mes_cobro_anual = mes
    }
  }

  const { data, error } = await supabase
    .from('suscripciones')
    .update(update)
    .eq('id', suscripcionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function desactivarSuscripcion(suscripcionId) {
  return actualizarSuscripcion(suscripcionId, { activa: false })
}

export async function eliminarSuscripcion(suscripcionId) {
  const supabase = getSupabase()
  const { error } = await supabase.from('suscripciones').delete().eq('id', suscripcionId)

  if (error) throw error
}
