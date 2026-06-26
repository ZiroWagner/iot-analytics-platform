"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { TimeRangePreset } from "../../domain/types"
import { format } from "date-fns"

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
  rangeStart?: string
  rangeEnd?: string
  onRangeChange?: (start: string, end: string) => void
}

export function TimeRangeSelector({
  value,
  onChange,
  customDate,
  onCustomDateChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
}: TimeRangeSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [rangeCalendarOpen, setRangeCalendarOpen] = useState(false)

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
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          className={cn(
            "h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-200 inline-flex items-center justify-center",
            value === 'custom'
              ? "bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => { onChange('custom'); setCalendarOpen(true) }}
        >
          Día
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          {value === 'custom' && onCustomDateChange && (
            <Calendar
              mode="single"
              selected={customDate ? (() => {
                const [y, m, d] = customDate!.split('-').map(Number)
                return new Date(y, m - 1, d)
              })() : undefined}
              onSelect={(date) => {
                if (date) {
                  onCustomDateChange(format(date, 'yyyy-MM-dd'))
                  setCalendarOpen(false)
                }
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      <Popover open={rangeCalendarOpen} onOpenChange={setRangeCalendarOpen}>
        <PopoverTrigger
          className={cn(
            "h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-200 inline-flex items-center justify-center",
            value === 'range'
              ? "bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => { onChange('range'); setRangeCalendarOpen(true) }}
        >
          Rango
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={rangeStart && rangeEnd ? {
              from: (() => { const [y,m,d] = rangeStart!.split('-').map(Number); return new Date(y,m-1,d) })(),
              to: (() => { const [y,m,d] = rangeEnd!.split('-').map(Number); return new Date(y,m-1,d) })(),
            } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to && onRangeChange) {
                onRangeChange(
                  format(range.from, 'yyyy-MM-dd'),
                  format(range.to, 'yyyy-MM-dd'),
                )
              }
            }}
          />
        </PopoverContent>
      </Popover>
      {value === 'custom' && customDate && (
        <span className="text-[10px] text-muted-foreground ml-1 font-mono">
          {customDate}
        </span>
      )}
      {value === 'range' && rangeStart && rangeEnd && (
        <span className="text-[10px] text-muted-foreground ml-1 font-mono">
          {rangeStart} ~ {rangeEnd}
        </span>
      )}
    </div>
  )
}
