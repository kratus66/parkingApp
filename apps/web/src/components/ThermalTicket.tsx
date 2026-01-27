'use client';

import React, { useRef } from 'react';
import { Printer } from 'lucide-react';

interface ThermalTicketProps {
  ticketData: {
    ticketNumber: string;
    entryAt: string;
    spot: {
      code: string;
      type: string;
    };
    vehicle: {
      plate?: string;
      bicycleCode?: string;
      vehicleType: string;
      brand?: string;
      model?: string;
      color?: string;
    };
    customer?: {
      fullName: string;
      documentType: string;
      documentNumber: string;
      phone?: string;
      email?: string;
    } | null;
    parkingLot?: {
      name: string;
      address?: string;
    } | null;
  };
  onClose: () => void;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({ ticketData, onClose }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ticketRef.current) {
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket #${ticketData.ticketNumber}</title>
              <style>
                @media print {
                  @page { 
                    size: 33mm auto;
                    margin: 0;
                  }
                  body { 
                    margin: 0;
                    padding: 0;
                  }
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 10px;
                  line-height: 1.3;
                  width: 33mm;
                  margin: 0 auto;
                  padding: 2mm;
                  background: white;
                  color: black;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-top: 1px dashed #000; margin: 2mm 0; }
                h1 { font-size: 12px; margin: 1mm 0; }
                h2 { font-size: 11px; margin: 1mm 0; }
                .big { font-size: 14px; font-weight: bold; }
                .small { font-size: 8px; }
              </style>
            </head>
            <body>
              ${ticketRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Ticket Generado</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Ticket Preview */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Vista previa del ticket */}
          <div className="bg-white text-black p-4 rounded-lg shadow-lg" style={{ width: '33mm', minWidth: '125px' }}>
            <div ref={ticketRef}>
              <div className="center">
                <h1 className="bold">{ticketData.parkingLot?.name || 'PARQUEADERO'}</h1>
                {ticketData.parkingLot?.address && (
                  <div className="small">{ticketData.parkingLot.address}</div>
                )}
              </div>

              <div className="line"></div>

              <div className="center">
                <h2>TICKET DE ENTRADA</h2>
                <div className="big">#{ticketData.ticketNumber}</div>
              </div>

              <div className="line"></div>

              <div>
                <div className="bold">FECHA:</div>
                <div>{formatDate(ticketData.entryAt)}</div>
                <div className="bold">HORA:</div>
                <div>{formatTime(ticketData.entryAt)}</div>
              </div>

              <div className="line"></div>

              <div>
                <div className="bold">PUESTO:</div>
                <div className="big center">{ticketData.spot.code}</div>
                <div className="small center">
                  Tipo: {ticketData.spot.type === 'CAR' ? 'Auto' : 
                         ticketData.spot.type === 'MOTORCYCLE' ? 'Moto' : 
                         ticketData.spot.type === 'BICYCLE' ? 'Bicicleta' : 'Camión/Bus'}
                </div>
              </div>

              <div className="line"></div>

              <div>
                <div className="bold">VEHÍCULO:</div>
                {ticketData.vehicle.plate && (
                  <div className="big">{ticketData.vehicle.plate}</div>
                )}
                {ticketData.vehicle.bicycleCode && (
                  <div className="big">{ticketData.vehicle.bicycleCode}</div>
                )}
                {ticketData.vehicle.brand && (
                  <div className="small">
                    {ticketData.vehicle.brand} {ticketData.vehicle.model}
                  </div>
                )}
                {ticketData.vehicle.color && (
                  <div className="small">Color: {ticketData.vehicle.color}</div>
                )}
              </div>

              {ticketData.vehicle.vehicleType === 'BICYCLE' && ticketData.customer && (
                <>
                  <div className="line"></div>
                  <div>
                    <div className="bold">CLIENTE:</div>
                    <div>{ticketData.customer.fullName}</div>
                    <div className="small">
                      {ticketData.customer.documentType} {ticketData.customer.documentNumber}
                    </div>
                    {ticketData.customer.phone && (
                      <div className="small">Tel: {ticketData.customer.phone}</div>
                    )}
                  </div>
                </>
              )}

              <div className="line"></div>

              <div className="center small">
                <div>Conserve este ticket</div>
                <div>Es necesario para la salida</div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir Ticket
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
