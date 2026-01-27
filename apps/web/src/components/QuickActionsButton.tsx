'use client';

import React, { useState } from 'react';
import { LogIn, LogOut, Plus } from 'lucide-react';

interface QuickActionsButtonProps {
  onCheckIn: () => void;
  onCheckOut: () => void;
}

/**
 * Botón flotante de acciones rápidas
 * Muestra opciones para Check-In y Check-Out
 */
export const QuickActionsButton: React.FC<QuickActionsButtonProps> = ({
  onCheckIn,
  onCheckOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Opciones expandidas */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
          <button
            onClick={() => {
              onCheckIn();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <LogIn className="w-5 h-5" />
            <span className="font-medium">Registrar Entrada</span>
          </button>
          <button
            onClick={() => {
              onCheckOut();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Registrar Salida</span>
          </button>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl transition-all ${
          isOpen
            ? 'bg-red-600 hover:bg-red-700 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <Plus className="w-8 h-8 text-white mx-auto" />
      </button>
    </div>
  );
};
