import { describe, it, expect } from 'vitest'
import { calcularImpacto, calcularImpactoConValidacion, generarPeriodosCuotas } from './calcularImpacto'

describe('calcularImpacto - Regla R2', () => {
  describe('Caso: Compra el día exacto de cierre', () => {
    it('debe impactar en el mes de la compra', () => {
      const fecha = new Date(2026, 8, 15) // 15 septiembre 2026 (mes 8)
      const diaCierre = 15
      const resultado = calcularImpacto(fecha, diaCierre)
      const esperado = new Date(2026, 8, 1) // 1 septiembre 2026

      expect(resultado).toEqual(esperado)
      expect(resultado.getDate()).toBe(1)
    })

    it('múltiples meses con mismo día de cierre', () => {
      const casosTest = [
        { fecha: new Date(2026, 0, 15), diaCierre: 15, esperado: new Date(2026, 0, 1) }, // enero
        { fecha: new Date(2026, 6, 15), diaCierre: 15, esperado: new Date(2026, 6, 1) }, // julio
        { fecha: new Date(2026, 11, 15), diaCierre: 15, esperado: new Date(2026, 11, 1) }, // diciembre
      ]

      casosTest.forEach(({ fecha, diaCierre, esperado }) => {
        const resultado = calcularImpacto(fecha, diaCierre)
        expect(resultado).toEqual(esperado)
      })
    })
  })

  describe('Caso: Compra el día posterior al cierre', () => {
    it('debe impactar en el mes siguiente', () => {
      const fecha = new Date(2026, 8, 16) // 16 septiembre 2026
      const diaCierre = 15
      const resultado = calcularImpacto(fecha, diaCierre)
      const esperado = new Date(2026, 9, 1) // 1 octubre 2026

      expect(resultado).toEqual(esperado)
      expect(resultado.getDate()).toBe(1)
    })

    it('debe cruzar el año correctamente', () => {
      const fecha = new Date(2026, 11, 20) // 20 diciembre 2026
      const diaCierre = 15
      const resultado = calcularImpacto(fecha, diaCierre)
      const esperado = new Date(2027, 0, 1) // 1 enero 2027

      expect(resultado).toEqual(esperado)
      expect(resultado.getFullYear()).toBe(2027)
    })
  })

  describe('Caso: Compras en diciembre impactando en enero', () => {
    it('compra el 16 de diciembre con cierre en 15 debe impactar en enero', () => {
      const fecha = new Date(2026, 11, 16) // 16 diciembre 2026
      const diaCierre = 15
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getFullYear()).toBe(2027)
      expect(resultado.getMonth()).toBe(0) // enero
      expect(resultado.getDate()).toBe(1)
    })

    it('compra el 15 de diciembre con cierre en 15 debe impactar en diciembre', () => {
      const fecha = new Date(2026, 11, 15) // 15 diciembre 2026
      const diaCierre = 15
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getFullYear()).toBe(2026)
      expect(resultado.getMonth()).toBe(11) // diciembre
      expect(resultado.getDate()).toBe(1)
    })
  })

  describe('Caso: Tarjeta con dia_cierre = 31 en meses de 28/30 días', () => {
    it('compra el 31 de enero (mes con 31 días) con cierre 31 debe impactar en enero', () => {
      const fecha = new Date(2026, 0, 31) // 31 enero 2026
      const diaCierre = 31
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getMonth()).toBe(0) // enero
      expect(resultado.getDate()).toBe(1)
    })

    it('compra el 30 de abril (mes con 30 días) con cierre 31 debe impactar en abril', () => {
      const fecha = new Date(2026, 3, 30) // 30 abril 2026
      const diaCierre = 31
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getMonth()).toBe(3) // abril
      expect(resultado.getDate()).toBe(1)
    })

    it('compra el 28 de febrero (mes con 28 días) con cierre 31 debe impactar en febrero', () => {
      const fecha = new Date(2026, 1, 28) // 28 febrero 2026
      const diaCierre = 31
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getMonth()).toBe(1) // febrero
      expect(resultado.getDate()).toBe(1)
    })

    it('compra el 1 de marzo con cierre 31 debe impactar en marzo (1 <= 31)', () => {
      const fecha = new Date(2026, 2, 1) // 1 marzo 2026
      const diaCierre = 31
      const resultado = calcularImpacto(fecha, diaCierre)

      expect(resultado.getMonth()).toBe(2) // marzo
      expect(resultado.getDate()).toBe(1)
    })
  })

  describe('Caso: Entrada como string ISO', () => {
    it('debe aceptar fecha en formato ISO string', () => {
      const resultado = calcularImpacto('2026-09-16', 15)
      const esperado = new Date(2026, 9, 1)

      expect(resultado).toEqual(esperado)
    })

    it('debe aceptar fecha con timestamp ISO completo', () => {
      const resultado = calcularImpacto('2026-09-16T10:30:00Z', 15)
      const esperado = new Date(2026, 9, 1)

      expect(resultado).toEqual(esperado)
    })
  })

  describe('Validaciones y errores', () => {
    it('debe lanzar error si diaCierre < 1', () => {
      expect(() => calcularImpacto(new Date(2026, 8, 15), 0)).toThrow(RangeError)
    })

    it('debe lanzar error si diaCierre > 31', () => {
      expect(() => calcularImpacto(new Date(2026, 8, 15), 32)).toThrow(RangeError)
    })

    it('debe lanzar error si fechaCompra es inválida', () => {
      expect(() => calcularImpacto('invalid-date', 15)).toThrow()
    })

    it('debe lanzar error si diaCierre no es número', () => {
      expect(() => calcularImpacto(new Date(2026, 8, 15), '15')).toThrow(RangeError)
    })
  })

  describe('Con validación adicional', () => {
    it('debe validar que el resultado siempre sea día 1', () => {
      const resultado = calcularImpactoConValidacion(new Date(2026, 8, 16), 15)
      expect(resultado.getDate()).toBe(1)
    })
  })
})

describe('generarPeriodosCuotas', () => {
  it('debe generar N fechas consecutivas de período', () => {
    const primerPeriodo = new Date(2026, 9, 1) // octubre 2026
    const cantidadCuotas = 3
    const resultado = generarPeriodosCuotas(primerPeriodo, cantidadCuotas)

    expect(resultado).toHaveLength(3)
    expect(resultado[0]).toEqual(new Date(2026, 9, 1)) // octubre
    expect(resultado[1]).toEqual(new Date(2026, 10, 1)) // noviembre
    expect(resultado[2]).toEqual(new Date(2026, 11, 1)) // diciembre
  })

  it('debe cruzar el año correctamente', () => {
    const primerPeriodo = new Date(2026, 11, 1) // diciembre 2026
    const cantidadCuotas = 3
    const resultado = generarPeriodosCuotas(primerPeriodo, cantidadCuotas)

    expect(resultado).toHaveLength(3)
    expect(resultado[0].getFullYear()).toBe(2026) // diciembre 2026
    expect(resultado[1].getFullYear()).toBe(2027) // enero 2027
    expect(resultado[2].getFullYear()).toBe(2027) // febrero 2027
  })

  it('debe mantener día = 1 en todas las fechas', () => {
    const primerPeriodo = new Date(2026, 9, 1)
    const cantidadCuotas = 12
    const resultado = generarPeriodosCuotas(primerPeriodo, cantidadCuotas)

    resultado.forEach((fecha) => {
      expect(fecha.getDate()).toBe(1)
    })
  })

  it('debe validar que primerPeriodo sea día 1', () => {
    const periodoInvalido = new Date(2026, 9, 15)
    expect(() => generarPeriodosCuotas(periodoInvalido, 3)).toThrow()
  })

  it('debe validar que cantidadCuotas >= 1', () => {
    const primerPeriodo = new Date(2026, 9, 1)
    expect(() => generarPeriodosCuotas(primerPeriodo, 0)).toThrow(RangeError)
  })
})
