'use client';

import { useEffect, useState } from 'react';

export interface StoredUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  company?: { id: string; name: string };
  parkingLot?: { id: string; name: string } | null;
}

const ACTIVE_LOT_KEY = 'activeParkingLotId';
const LOT_CHANGE_EVENT = 'active-parking-lot-changed';

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

/**
 * Resuelve el parqueadero activo: preferencia guardada por el usuario, o el
 * parqueadero asignado en su perfil. Devuelve '' si no hay ninguno.
 */
export function getActiveParkingLotId(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(ACTIVE_LOT_KEY);
  if (stored) return stored;
  return getStoredUser()?.parkingLot?.id ?? '';
}

export function setActiveParkingLotId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_LOT_KEY, id);
  window.dispatchEvent(new CustomEvent(LOT_CHANGE_EVENT, { detail: id }));
}

/**
 * Hook reactivo con el parqueadero activo. Se re-renderiza cuando cambia el
 * selector (mismo tab vía CustomEvent, u otro tab vía 'storage').
 */
export function useActiveParkingLotId(): string {
  const [lotId, setLotId] = useState<string>('');

  useEffect(() => {
    setLotId(getActiveParkingLotId());

    const onChange = () => setLotId(getActiveParkingLotId());
    window.addEventListener(LOT_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(LOT_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return lotId;
}
