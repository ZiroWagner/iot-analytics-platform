"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { RefreshCw } from "lucide-react"

const PRESETS: { value: number; label: string }[] = [
  { value: 0, label: 'Live' },
  { value: 3000, label: '3s' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 30000, label: '30s' },
]

interface RefreshIntervalSelectorProps {
  value: number
  onChange: (value: number) => void
}

export function RefreshIntervalSelector({ value, onChange }: RefreshIntervalSelectorProps) {
  const currentLabel = PRESETS.find(p => p.value === value)?.label ?? `${value}ms`

  return (
    <Select value={String(value)} onValueChange={(val) => onChange(parseInt(val ?? '0'))}>
      <SelectTrigger className="h-8 min-w-[80px] text-xs bg-background/60 gap-1">
        <RefreshCw className="h-3 w-3 text-emerald-400 shrink-0" />
        <span className="text-xs">{currentLabel}</span>
      </SelectTrigger>
      <SelectContent side="bottom" align="end">
        {PRESETS.map((preset) => (
          <SelectItem key={preset.value} value={String(preset.value)}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
