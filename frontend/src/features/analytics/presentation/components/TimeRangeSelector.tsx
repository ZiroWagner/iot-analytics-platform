"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import type { TimeRangePreset } from "../../domain/types"

const PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
]

interface TimeRangeSelectorProps {
  value: TimeRangePreset
  onChange: (value: TimeRangePreset) => void
  customDate?: string
  onCustomDateChange?: (date: string) => void
}

export function TimeRangeSelector({ value, onChange, customDate, onCustomDateChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-background/60 backdrop-blur-sm border border-border rounded-lg p-1">
      <Clock className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
      {PRESETS.map((preset) => (
        <Button
          key={preset.value}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-200",
            value === preset.value
              ? "bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-200",
          value === 'custom'
            ? "bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        onClick={() => onChange('custom')}
      >
        Día
      </Button>
      {value === 'custom' && onCustomDateChange && (
        <input
          type="date"
          value={customDate || ''}
          onChange={(e) => onCustomDateChange(e.target.value)}
          className="h-7 text-xs bg-background border border-border rounded px-1 ml-1 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      )}
    </div>
  )
}
