"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Car, ParkingSquare, DollarSign, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

interface KPICardsProps {
  activeVehicles: number
  availableSpots: number
  dailyRevenue: number
  todayEntries: number
  todayExits: number
}

export function KPICards({ activeVehicles, availableSpots, dailyRevenue, todayEntries, todayExits }: KPICardsProps) {
  const kpis = [
    {
      label: "Vehículos activos",
      value: activeVehicles.toString(),
      icon: Car,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Cupos disponibles",
      value: availableSpots.toString(),
      icon: ParkingSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Recaudo del día",
      value: `$${dailyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Entradas hoy",
      value: todayEntries.toString(),
      icon: ArrowDownToLine,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Salidas hoy",
      value: todayExits.toString(),
      icon: ArrowUpFromLine,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
