'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  getActiveParkingLotId,
  setActiveParkingLotId,
} from '@/lib/parkingContext';

interface ParkingLot {
  id: string;
  name: string;
}

export function ParkingLotSelector() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response: any = await api.get('/parking-lots');
        // Resiliente al envelope { data, meta } o al arreglo directo
        const list: ParkingLot[] = Array.isArray(response)
          ? response
          : response?.data ?? [];
        if (!mounted) return;

        setLots(list);

        // Si no hay parqueadero activo aún, tomar el primero disponible
        let current = getActiveParkingLotId();
        if (!current && list.length > 0) {
          current = list[0].id;
          setActiveParkingLotId(current);
        }
        setActive(current);
      } catch (err) {
        console.error('Error cargando parqueaderos:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (id: string) => {
    setActive(id);
    setActiveParkingLotId(id);
  };

  if (lots.length === 0) return null;

  // Con un solo parqueadero, mostrarlo como etiqueta (no hay nada que elegir)
  if (lots.length === 1) {
    return (
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="font-medium text-foreground">{lots[0].name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <select
        value={active}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-card border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Seleccionar parqueadero"
      >
        {lots.map((lot) => (
          <option key={lot.id} value={lot.id}>
            {lot.name}
          </option>
        ))}
      </select>
    </div>
  );
}
