"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"

interface Alert {
  id: string | number
  type: "critical" | "warning" | "info"
  message: string
}

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return {
          icon: AlertTriangle,
          bg: "bg-red-500/10",
          text: "text-red-600 dark:text-red-400",
          border: "border-red-500/30",
        }
      case "warning":
        return {
          icon: AlertCircle,
          bg: "bg-amber-500/10",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-500/30",
        }
      case "info":
        return {
          icon: Info,
          bg: "bg-blue-500/10",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-500/30",
        }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin alertas activas</p>
        ) : (
          alerts.map((alert) => {
            const styles = getAlertStyles(alert.type)
            const Icon = styles.icon
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${styles.bg} ${styles.border}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${styles.text}`} />
                <span className={`text-sm ${styles.text}`}>{alert.message}</span>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
