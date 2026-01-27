'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentReceiptProps {
  receiptData: {
    ticketNumber: string;
    entryAt: string;
    exitAt: string;
    duration: {
      minutes: number;
      hours: number;
      formatted: string;
    };
    amount: {
      ratePerHour: number;
      totalHours: number;
      totalAmount: number;
      formattedAmount: string;
    };
    spot: {
      code: string;
      type: string;
      zone: {
        name: string;
      };
    };
    vehicle: {
      type: string;
      licensePlate?: string;
      bicycleCode?: string;
    };
    customer?: {
      fullName: string;
      documentNumber: string;
    };
    parkingLot: {
      name: string;
      address: string;
      phone?: string;
    };
  };
}

/**
 * Componente para mostrar e imprimir el recibo de pago (ticket de salida)
 * Formato optimizado para impresoras térmicas de 33mm
 */
export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ receiptData }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('payment-receipt')?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Pago - ${receiptData.ticketNumber}</title>
          <style>
            @page {
              size: 33mm auto;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 33mm;
              font-family: 'Courier New', monospace;
              font-size: 8pt;
              line-height: 1.3;
              padding: 2mm;
              background: white;
              color: black;
            }
            
            .receipt {
              width: 100%;
            }
            
            .text-center {
              text-align: center;
            }
            
            .font-bold {
              font-weight: bold;
            }
            
            .text-xs {
              font-size: 7pt;
            }
            
            .text-sm {
              font-size: 8pt;
            }
            
            .text-base {
              font-size: 9pt;
            }
            
            .text-lg {
              font-size: 10pt;
            }
            
            .text-xl {
              font-size: 12pt;
            }
            
            .my-1 {
              margin-top: 1mm;
              margin-bottom: 1mm;
            }
            
            .my-2 {
              margin-top: 2mm;
              margin-bottom: 2mm;
            }
            
            .my-3 {
              margin-top: 3mm;
              margin-bottom: 3mm;
            }
            
            .py-1 {
              padding-top: 1mm;
              padding-bottom: 1mm;
            }
            
            .border-t {
              border-top: 1px dashed black;
            }
            
            .border-b {
              border-bottom: 1px dashed black;
            }
            
            .border-double {
              border-top: 2px solid black;
              border-bottom: 2px solid black;
            }
            
            .flex {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .uppercase {
              text-transform: uppercase;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
      {/* Preview del ticket */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-lg max-w-[33mm] mx-auto overflow-auto">
        <div id="payment-receipt" className="font-mono text-[8pt] leading-tight text-black">
          {/* Header */}
          <div className="text-center mb-2">
            <div className="font-bold text-[10pt] uppercase">{receiptData.parkingLot.name}</div>
            <div className="text-[7pt] my-1">{receiptData.parkingLot.address}</div>
            {receiptData.parkingLot.phone && (
              <div className="text-[7pt]">Tel: {receiptData.parkingLot.phone}</div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Título */}
          <div className="text-center font-bold text-[12pt] my-2 uppercase">
            RECIBO DE PAGO
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Número de ticket */}
          <div className="text-center my-2">
            <div className="text-[7pt]">Ticket Nº</div>
            <div className="font-bold text-[10pt]">{receiptData.ticketNumber}</div>
          </div>

          {/* Información de fechas y horas */}
          <div className="my-2 text-[8pt]">
            <div className="flex justify-between mb-1">
              <span>Entrada:</span>
              <span className="font-bold">
                {format(new Date(receiptData.entryAt), 'dd/MM/yy HH:mm', { locale: es })}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Salida:</span>
              <span className="font-bold">
                {format(new Date(receiptData.exitAt), 'dd/MM/yy HH:mm', { locale: es })}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Duración */}
          <div className="my-2">
            <div className="flex justify-between text-[8pt]">
              <span>Tiempo total:</span>
              <span className="font-bold">{receiptData.duration.formatted}</span>
            </div>
            <div className="text-center text-[7pt] text-gray-600">
              ({receiptData.duration.minutes} minutos)
            </div>
          </div>

          {/* Información del vehículo */}
          <div className="my-2 text-[8pt]">
            <div className="flex justify-between mb-1">
              <span>Tipo:</span>
              <span className="font-bold">{receiptData.vehicle.type}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>
                {receiptData.vehicle.licensePlate ? 'Placa:' : 'Código:'}
              </span>
              <span className="font-bold">
                {receiptData.vehicle.licensePlate || receiptData.vehicle.bicycleCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Puesto:</span>
              <span className="font-bold">
                {receiptData.spot.zone.name} - {receiptData.spot.code}
              </span>
            </div>
          </div>

          {/* Cliente (solo para bicicletas) */}
          {receiptData.customer && (
            <div className="my-2 text-[8pt]">
              <div className="flex justify-between mb-1">
                <span>Cliente:</span>
                <span className="font-bold text-right">{receiptData.customer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Doc:</span>
                <span className="font-bold">{receiptData.customer.documentNumber}</span>
              </div>
            </div>
          )}

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Cálculo del cobro */}
          <div className="my-2 text-[8pt]">
            <div className="flex justify-between mb-1">
              <span>Tarifa/hora:</span>
              <span>${receiptData.amount.ratePerHour.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Horas cobradas:</span>
              <span className="font-bold">{receiptData.amount.totalHours}</span>
            </div>
          </div>

          <div className="border-t-2 border-b-2 border-black py-1 my-2"></div>

          {/* Total a pagar */}
          <div className="text-center my-2">
            <div className="text-[8pt] mb-1">TOTAL A PAGAR</div>
            <div className="font-bold text-[14pt]">
              {receiptData.amount.formattedAmount}
            </div>
          </div>

          <div className="border-t-2 border-b-2 border-black py-1 my-2"></div>

          {/* Footer */}
          <div className="text-center text-[7pt] my-2">
            <div>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</div>
            <div className="mt-2 font-bold">¡GRACIAS POR SU VISITA!</div>
            <div className="mt-1">Vuelva pronto</div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir Recibo
        </button>
      </div>
    </div>
  );
};
