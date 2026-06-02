"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTelemetryStore } from '../store'
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
  sensorName: string
  metric: string
}

export function useRealtimeSeries(
  seriesConfig: SeriesSubscription[],
  historicalData: TimeseriesPoint[],
): { data: TimeseriesPoint[]; isRealtime: boolean; lastUpdate: number | null } {
  const realtimePoints = useTelemetryStore((s) => s.realtimePoints)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const prevPointsRef = useRef(0)

  // Build lookup: "sensorId:metric" -> "sensorName:metric" (chart dataKey)
  const dataKeyMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of seriesConfig) {
      map.set(`${s.sensorId}:${s.metric}`, `${s.sensorName}:${s.metric}`)
    }
    return map
  }, [seriesConfig])

  // Build set of chart dataKeys for fast matching
  const chartDataKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const s of seriesConfig) {
      keys.add(`${s.sensorName}:${s.metric}`)
    }
    return keys
  }, [seriesConfig])

  // Merge historical + realtime into a single array
  const mergedData = useMemo(() => {
    if (seriesConfig.length === 0) return []

    // Build a map from historical data keyed by timestamp
    const timeMap = new Map<number, Record<string, unknown>>()

    // Add historical points
    for (const point of historicalData) {
      const ts = typeof point.timestamp === 'string'
        ? new Date(point.timestamp).getTime()
        : new Date(point.timestamp as string | number | Date).getTime()

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
      const dataKey = dataKeyMap.get(lookupKey)
      if (!dataKey || !chartDataKeys.has(dataKey)) continue

      const ts = new Date(rp.timestamp).getTime()
      let entry = timeMap.get(ts)

      if (!entry) {
        entry = {
          timestamp: rp.timestamp,
          timeLabel: new Date(rp.timestamp).toLocaleTimeString(),
        }
        timeMap.set(ts, entry)
      }

      // Use the mapped dataKey for this sensor:metric
      entry[dataKey] = rp.value
    }

    // Convert map to sorted array
    const sorted = Array.from(timeMap.values())
      .sort((a, b) => {
        const getTime = (t: unknown) => {
          if (typeof t === 'string') return new Date(t).getTime()
          if (t && typeof t === 'object' && 'getTime' in t) return (t as { getTime: () => number }).getTime()
          return 0
        }
        return getTime(a.timestamp) - getTime(b.timestamp)
      })

    // Normalize to TimeseriesPoint format
    return sorted.map((entry) => {
      const ts = entry.timestamp
      const normalizedTimestamp = typeof ts === 'string' ? ts : ts instanceof Date ? ts.toISOString() : String(ts)
      const result: TimeseriesPoint = {
        timestamp: normalizedTimestamp,
        timeLabel: entry.timeLabel as string,
      }
      for (const key of Object.keys(entry)) {
        if (key !== 'timestamp' && key !== 'timeLabel') {
          ;(result as Record<string, unknown>)[key] = entry[key]
        }
      }
      return result
    })
  }, [historicalData, realtimePoints, chartDataKeys, dataKeyMap, seriesConfig])

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


