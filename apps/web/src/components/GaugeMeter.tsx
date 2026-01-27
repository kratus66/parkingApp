"use client"

import { useMemo } from "react"

interface GaugeMeterProps {
  percentage: number
  occupied: number
  total: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
  sublabel?: string
}

export function GaugeMeter({ percentage: inputPercentage, occupied, total, size = "lg", showLabel = true, label, sublabel }: GaugeMeterProps) {
  const percentage = Math.min(inputPercentage, 100)

  const { color, status } = useMemo(() => {
    if (percentage <= 50) return { color: "hsl(var(--gauge-green))", status: "Fluido" }
    if (percentage <= 80) return { color: "hsl(var(--gauge-yellow))", status: "Medio" }
    return { color: "hsl(var(--gauge-red))", status: "Crítico" }
  }, [percentage])

  const dimensions = {
    sm: { width: 120, height: 80, strokeWidth: 8, fontSize: "text-lg" },
    md: { width: 180, height: 120, strokeWidth: 10, fontSize: "text-2xl" },
    lg: { width: 280, height: 180, strokeWidth: 14, fontSize: "text-4xl" },
  }

  const dim = dimensions[size]
  const radius = (dim.width - dim.strokeWidth * 2) / 2
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${dim.strokeWidth} ${dim.height - 10} A ${radius} ${radius} 0 0 1 ${dim.width - dim.strokeWidth} ${dim.height - 10}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={dim.strokeWidth}
          className="text-muted"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d={`M ${dim.strokeWidth} ${dim.height - 10} A ${radius} ${radius} 0 0 1 ${dim.width - dim.strokeWidth} ${dim.height - 10}`}
          fill="none"
          stroke={color}
          strokeWidth={dim.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease-out, stroke 0.3s ease",
          }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick, i) => {
          const angle = Math.PI - (tick / 100) * Math.PI
          const x1 = dim.width / 2 + (radius - 20) * Math.cos(angle)
          const y1 = dim.height - 10 - (radius - 20) * Math.sin(angle)
          const x2 = dim.width / 2 + (radius - 8) * Math.cos(angle)
          const y2 = dim.height - 10 - (radius - 8) * Math.sin(angle)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={2}
              className="text-muted-foreground/50"
            />
          )
        })}

        {/* Percentage text */}
        <text
          x={dim.width / 2}
          y={dim.height - 30}
          textAnchor="middle"
          className={`${dim.fontSize} font-bold fill-foreground`}
        >
          {Math.round(percentage)}%
        </text>
      </svg>

      {showLabel && (
        <div className="text-center mt-2">
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
          <p className="text-sm font-medium">{occupied} / {total} ocupados</p>
          {sublabel !== undefined ? (
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-1"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {sublabel || status}
            </span>
          ) : (
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-1"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {status}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
