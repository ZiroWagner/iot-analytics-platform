"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTelemetryStore } from '../presentation/store'
import type { TimeseriesPoint } from '@/features/analytics/domain/types'

/**
 * Subscribes a chart widget to real-time WebSocket telemetry.
 *
 * Merges historical data (fetched via API) with live points arriving via
 * WebSocket `telemetry_batch` events. Returns a unified `TimeseriesPoint[]`
 * array that the chart can render immediately.
 *
 * @param seriesConfig Array of {sensorId, metric} to subscribe to.
 * @param historicalData Data fetched from the backend API (initial load).
 * @returns { data, isRealtime, lastUpdate } Unified timeseries data.
 */
interface SeriesSubscription {
  sensorId: string
  metric: string
}

export function useRealtimeSeries(
  seriesConfig: SeriesSubscription[],
  historicalData: TimeseriesPoint[],
): { data: TimeseriesPoint[]; isRealtime: boolean; lastUpdate: number | null } {
  const realtimePoints = useTelemetryStore((s) => s.realtimePoints)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const prevPointsRef = useRef(0)

  // Build a set of keys for fast matching
  const seriesKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const s of seriesConfig) {
      keys.add(`${s.sensorId}:${s.metric}`)
    }
    return keys
  }, [seriesConfig])

  // Map series config to the dataKey format used by the chart
  const dataKeyMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of seriesConfig) {
      // The chart uses "sensorName:metric" as dataKey
      // We need to find the sensorName from historical data
      const samplePoint = historicalData.find(
        (p) => p[sensorNameFromPoint(p, s.sensorId, s.metric)] !== undefined,
      )
      if (samplePoint) {
        for (const key of Object.keys(samplePoint)) {
          if (key !== 'timestamp' && key !== 'timeLabel') {
            // We can't derive sensorName from the point directly, use the key as-is
            map.set(`${s.sensorId}:${s.metric}`, key)
            break
          }
        }
      }
    }
    return map
  }, [seriesConfig, historicalData])

  // Merge historical + realtime into a single array
  const mergedData = useMemo(() => {
    if (seriesConfig.length === 0) return []

    // Build a map from historical data keyed by timestamp
    const timeMap = new Map<number, Record<string, unknown>>()

    // Add historical points
    for (const point of historicalData) {
      const ts = typeof point.timestamp === 'string'
        ? new Date(point.timestamp).getTime()
        : point.timestamp instanceof Date
          ? point.timestamp.getTime()
          : 0

      const entry: Record<string, unknown> = {
        timestamp: point.timestamp,
        timeLabel: point.timeLabel,
      }

      // Copy all metric keys from the historical point
      for (const key of Object.keys(point)) {
        if (key !== 'timestamp' && key !== 'timeLabel') {
          entry[key] = (point as Record<string, unknown>)[key]
        }
      }

      timeMap.set(ts, entry)
    }

    // Add realtime points, merging into existing timestamps or creating new ones
    for (const rp of realtimePoints) {
      const lookupKey = `${rp.sensorId}:${rp.metric}`
      if (!seriesKeys.has(lookupKey)) continue

      const ts = new Date(rp.timestamp).getTime()
      let entry = timeMap.get(ts)

      if (!entry) {
        entry = {
          timestamp: rp.timestamp,
          timeLabel: new Date(rp.timestamp).toLocaleTimeString(),
        }
        timeMap.set(ts, entry)
      }

      // Find the matching dataKey for this sensor:metric
      const dataKey = dataKeyMap.get(lookupKey) || `${rp.metric}`
      entry[dataKey] = rp.value
    }

    // Convert map to sorted array
    return Array.from(timeMap.values())
      .map((entry) => ({
        timestamp: entry.timestamp as string | Date,
        timeLabel: entry.timeLabel as string,
        ...entry,
      }))
      .sort((a, b) => {
        const ta = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp instanceof Date ? a.timestamp.getTime() : 0
        const tb = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp instanceof Date ? b.timestamp.getTime() : 0
        return ta - tb
      })
  }, [historicalData, realtimePoints, seriesKeys, dataKeyMap, seriesConfig])

  // Track when realtime points change
  useEffect(() => {
    const count = realtimePoints.length
    if (count !== prevPointsRef.current) {
      prevPointsRef.current = count
      setLastUpdate(Date.now())
    }
  }, [realtimePoints])

  return {
    data: mergedData,
    isRealtime: lastUpdate !== null,
    lastUpdate,
  }
}

/**
 * Helper to find which key in a historical point corresponds to a sensor:metric.
 * Historical points use "sensorName:metric" as keys, but we only have sensorId.
 * This scans the point's keys to find one ending with the metric name.
 */
function sensorNameFromPoint(
  point: Record<string, unknown>,
  sensorId: string,
  metric: string,
): string | undefined {
  for (const key of Object.keys(point)) {
    if (key === 'timestamp' || key === 'timeLabel') continue
    if (key.endsWith(`:${metric}`)) {
      return key
    }
  }
  return undefined
}
