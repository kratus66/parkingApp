"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ParkingSlot {
  id: string
  status: "free" | "occupied" | "reserved"
  zone: string
}

interface ParkingMapMiniProps {
  open: boolean
  onClose: () => void
  onSelectSlot: (slotId: string) => void
  selectedSlot?: string
  vehicleType: string
}

const generateParkingSlots = (): ParkingSlot[] => {
  const zones = ["A", "B", "C", "D"]
  const slots: ParkingSlot[] = []

  zones.forEach((zone) => {
    for (let i = 1; i <= 12; i++) {
      const random = Math.random()
      let status: "free" | "occupied" | "reserved" = "free"
      if (random > 0.6) status = "occupied"
      else if (random > 0.5) status = "reserved"

      slots.push({
        id: `${zone}-${i.toString().padStart(2, "0")}`,
        status,
        zone,
      })
    }
  })

  return slots
}

const parkingSlots = generateParkingSlots()

export function ParkingMapMini({ open, onClose, onSelectSlot, selectedSlot, vehicleType }: ParkingMapMiniProps) {
  const zones = ["A", "B", "C", "D"]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mapa de Estacionamiento - {vehicleType}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <span>Reservado</span>
          </div>
        </div>

        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Zona {zone}</h4>
              <div className="grid grid-cols-12 gap-1">
                {parkingSlots
                  .filter((slot) => slot.zone === zone)
                  .map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => slot.status === "free" && onSelectSlot(slot.id)}
                      disabled={slot.status !== "free"}
                      className={cn(
                        "aspect-square rounded text-[10px] font-mono transition-all",
                        slot.status === "free" && "bg-green-500 hover:bg-green-600 text-white cursor-pointer",
                        slot.status === "occupied" && "bg-red-500 text-white cursor-not-allowed",
                        slot.status === "reserved" && "bg-gray-400 text-white cursor-not-allowed",
                        selectedSlot === slot.id && "ring-2 ring-primary ring-offset-2",
                      )}
                    >
                      {slot.id.split("-")[1]}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {selectedSlot && <Button onClick={onClose}>Seleccionar {selectedSlot}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
