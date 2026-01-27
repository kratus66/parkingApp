"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, DollarSign, Info } from "lucide-react"
import { ParkingMapMini } from "./parking-map-mini"

interface RegisterVehicleModalProps {
  open: boolean
  onClose: () => void
  vehicleType: "car" | "bicycle" | "truck" | "bus"
}

const vehicleLabels = {
  car: "Auto",
  bicycle: "Bicicleta",
  truck: "Camión",
  bus: "Bus",
}

const tariffs = {
  car: 3500,
  bicycle: 1000,
  truck: 7000,
  bus: 8500,
}

const suggestedSpots = {
  car: "B-12",
  bicycle: "C-05",
  truck: "A-03",
  bus: "D-08",
}

export function RegisterVehicleModal({ open, onClose, vehicleType }: RegisterVehicleModalProps) {
  const [plate, setPlate] = useState("")
  const [selectedType, setSelectedType] = useState(vehicleType)
  const [selectedSpot, setSelectedSpot] = useState(suggestedSpots[vehicleType])
  const [showParkingMap, setShowParkingMap] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    setIsSearching(true)
    setTimeout(() => setIsSearching(false), 1000)
  }

  const handleRegister = () => {
    // Handle registration logic
    onClose()
  }

  const isPlateRequired = vehicleType !== "bicycle"

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar ingreso - {vehicleLabels[vehicleType]}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plate input */}
            <div className="space-y-2">
              <Label htmlFor="plate">
                Placa {!isPlateRequired && <span className="text-muted-foreground">(opcional)</span>}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="plate"
                  placeholder="ABC-123"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider"
                />
                <Button variant="outline" onClick={handleSearch} disabled={!plate || isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Vehicle type selector */}
            <div className="space-y-2">
              <Label>Tipo de vehículo</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Auto</SelectItem>
                  <SelectItem value="bicycle">Bicicleta</SelectItem>
                  <SelectItem value="truck">Camión</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suggested parking spot */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">Puesto sugerido</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{selectedSpot}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Zona cercana y disponible
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowParkingMap(true)}>
                    Cambiar puesto
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tariff preview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tarifa estimada por hora</span>
                  </div>
                  <span className="text-lg font-semibold">${tariffs[selectedType].toLocaleString()} COP</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleRegister} disabled={isPlateRequired && !plate}>
              Registrar ingreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ParkingMapMini
        open={showParkingMap}
        onClose={() => setShowParkingMap(false)}
        onSelectSlot={(slot) => {
          setSelectedSpot(slot)
          setShowParkingMap(false)
        }}
        selectedSlot={selectedSpot}
        vehicleType={vehicleLabels[selectedType]}
      />
    </>
  )
}
