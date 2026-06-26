import { describe, expect, it } from 'vitest'
import {
  calculateMean,
  calculateStandardDeviation,
  calculateZScores,
  detectAnomalies,
  projectFutureValues,
  polynomialRegression,
} from '@/features/analytics/domain/math-utils'

describe('math-utils', () => {
  describe('calculateMean', () => {
    it('returns 0 for empty array', () => {
      expect(calculateMean([])).toBe(0)
    })

    it('calculates correct mean for a set of numbers', () => {
      expect(calculateMean([2, 4, 6, 8])).toBe(5)
    })
  })

  describe('calculateStandardDeviation', () => {
    it('returns 0 for single element or empty array', () => {
      expect(calculateStandardDeviation([], 0)).toBe(0)
      expect(calculateStandardDeviation([5], 5)).toBe(0)
    })

    it('calculates correct standard deviation', () => {
      const vals = [2, 4, 4, 4, 5, 5, 7, 9]
      const mean = calculateMean(vals) // 5
      const stdDev = calculateStandardDeviation(vals, mean)
      expect(stdDev).toBeCloseTo(2)
    })
  })

  describe('calculateZScores', () => {
    it('returns zeroes if standard deviation is zero', () => {
      expect(calculateZScores([5, 5, 5])).toEqual([0, 0, 0])
    })

    it('calculates correct Z-scores', () => {
      const zScores = calculateZScores([2, 8]) // mean=5, stdDev=3
      expect(zScores[0]).toBe(-1)
      expect(zScores[1]).toBe(1)
    })
  })

  describe('detectAnomalies', () => {
    it('detects outliers above threshold', () => {
      const vals = [10, 10.1, 9.9, 10.2, 9.8, 10.0, 50.0] // 50 is a huge outlier
      const anomalies = detectAnomalies(vals, 2.0)
      expect(anomalies[6]).toBe(true)
      expect(anomalies[0]).toBe(false)
    })
  })

  describe('projectFutureValues', () => {
    it('returns empty array if input is empty', () => {
      expect(projectFutureValues([], 3)).toEqual([])
    })

    it('projects constant values if only one point', () => {
      expect(projectFutureValues([10], 3)).toEqual([10, 10, 10])
    })

    it('projects linear trend correctly when degree=1', () => {
      // y = 2x + 1
      const projections = projectFutureValues([1, 3, 5], 3, 1)
      expect(projections[0]).toBeCloseTo(7)
      expect(projections[1]).toBeCloseTo(9)
      expect(projections[2]).toBeCloseTo(11)
    })

    it('defaults to quadratic (degree=2)', () => {
      // y = x² — perfect quadratic: x=0:0, x=1:1, x=2:4, x=3:9
      const projections = projectFutureValues([0, 1, 4, 9], 3)
      expect(projections[0]).toBeCloseTo(16, 0)
      expect(projections[1]).toBeCloseTo(25, 0)
      expect(projections[2]).toBeCloseTo(36, 0)
    })
  })

  describe('polynomialRegression', () => {
    it('returns empty for empty input', () => {
      expect(polynomialRegression([], 2, 5)).toEqual([])
    })

    it('returns flat line for single point', () => {
      expect(polynomialRegression([42], 2, 3)).toEqual([42, 42, 42])
    })

    it('fits a perfect linear trend with degree=1', () => {
      // y = 3x + 2
      // x=0:2, x=1:5, x=2:8
      const result = polynomialRegression([2, 5, 8], 1, 2)
      expect(result[0]).toBeCloseTo(11) // x=3
      expect(result[1]).toBeCloseTo(14) // x=4
    })

    it('fits a perfect quadratic curve with degree=2', () => {
      // y = 2x² + 3x + 1
      // x=0:1, x=1:6, x=2:15, x=3:28
      const result = polynomialRegression([1, 6, 15, 28], 2, 2)
      expect(result[0]).toBeCloseTo(45) // x=4
      expect(result[1]).toBeCloseTo(66) // x=5
    })

    it('fits a perfect cubic curve with degree=3', () => {
      // y = x³
      // x=0:0, x=1:1, x=2:8, x=3:27, x=4:64
      const result = polynomialRegression([0, 1, 8, 27, 64], 3, 2)
      expect(result[0]).toBeCloseTo(125) // x=5
      expect(result[1]).toBeCloseTo(216) // x=6
    })

    it('follows a noisy quadratic trend approximately', () => {
      // y ≈ x² — small noise
      const values = [0.1, 1.1, 3.8, 9.2]
      const result = polynomialRegression(values, 2, 2)
      expect(result[0]).toBeGreaterThan(13)
      expect(result[0]).toBeLessThan(18)
      expect(result[1]).toBeGreaterThan(20)
      expect(result[1]).toBeLessThan(28)
    })

    it('clamps degree to n-1 when n is small', () => {
      // 2 points, degree=5 should act as degree=1
      const result = polynomialRegression([10, 20], 5, 1)
      expect(result[0]).toBeCloseTo(30)
    })
  })
})
