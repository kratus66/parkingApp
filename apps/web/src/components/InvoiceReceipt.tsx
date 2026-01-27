'use client';

import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';

interface InvoiceReceiptProps {
  invoiceData: {
    invoiceNumber: string;
    issuedAt: string;
    ticketNumber: string;
    entryAt: string;
    exitAt: string;
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
      documentNumber: string;
      phone?: string;
      email?: string;
    } | null;
    parkingLot?: {
      name: string;
      address?: string;
    } | null;
    quote: {
      totalMinutes: number;
      billableMinutes: number;
      graceMinutesApplied: number;
      subtotal: number;
      total: number;
      dailyMaxApplied?: boolean;
      dailyMaxAmount?: number;
    };
    payment: {
      items: Array<{
        method: string;
        amount: number;
        receivedAmount?: number;
        changeAmount?: number;
        reference?: string;
      }>;
    };
  };
  onClose: () => void;
}

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ invoiceData, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Factura #${invoiceData.invoiceNumber}</title>
              <style>
                @media print {
                  @page { 
                    size: 80mm auto;
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
                  width: 80mm;
                  margin: 0 auto;
                  padding: 2mm;
                  background: white;
                  color: black;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { border-top: 1px dashed #000; margin: 2mm 0; }
                .double-line { border-top: 2px solid #000; margin: 2mm 0; }
                h1 { font-size: 14px; margin: 1mm 0; }
                h2 { font-size: 12px; margin: 1mm 0; }
                .big { font-size: 16px; font-weight: bold; }
                .small { font-size: 8px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 1mm 0; }
                .label { width: 50%; }
                .value { width: 50%; text-align: right; }
              </style>
            </head>
            <body>
              ${invoiceRef.current.innerHTML}
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

  const handleDownload = () => {
    if (invoiceRef.current) {
      const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura #${invoiceData.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      max-width: 80mm;
      margin: 20px auto;
      padding: 10px;
      background: white;
      color: black;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    .double-line { border-top: 2px solid #000; margin: 5px 0; }
    h1 { font-size: 16px; margin: 5px 0; }
    h2 { font-size: 14px; margin: 5px 0; }
    .big { font-size: 18px; font-weight: bold; }
    .small { font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    .label { width: 50%; }
    .value { width: 50%; text-align: right; }
  </style>
</head>
<body>
  ${invoiceRef.current.innerHTML}
</body>
</html>`;
      
      const blob = new Blob([content], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-${invoiceData.invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
    };
    return labels[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Factura Generada</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Vista previa de la factura */}
          <div className="bg-white text-black p-6 rounded-lg shadow-lg" style={{ width: '80mm', minWidth: '300px' }}>
            <div ref={invoiceRef}>
              <div className="center">
                <h1 className="bold">{invoiceData.parkingLot?.name || 'PARQUEADERO'}</h1>
                {invoiceData.parkingLot?.address && (
                  <div className="small">{invoiceData.parkingLot.address}</div>
                )}
              </div>

              <div className="line"></div>

              <div className="center">
                <h2>FACTURA</h2>
                <div className="big">#{invoiceData.invoiceNumber}</div>
                <div className="small">Ticket: #{invoiceData.ticketNumber}</div>
              </div>

              <div className="line"></div>

              <table>
                <tbody>
                  <tr>
                    <td className="label bold">Fecha emisión:</td>
                    <td className="value">{formatDate(invoiceData.issuedAt)}</td>
                  </tr>
                  <tr>
                    <td className="label bold">Hora emisión:</td>
                    <td className="value">{formatTime(invoiceData.issuedAt)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="line"></div>

              {invoiceData.customer && (
                <>
                  <div>
                    <div className="bold">CLIENTE:</div>
                    <div>{invoiceData.customer.fullName}</div>
                    <div className="small">Doc: {invoiceData.customer.documentNumber}</div>
                    {invoiceData.customer.phone && (
                      <div className="small">Tel: {invoiceData.customer.phone}</div>
                    )}
                  </div>
                  <div className="line"></div>
                </>
              )}

              <div>
                <div className="bold">VEHÍCULO:</div>
                {invoiceData.vehicle.plate && (
                  <div>{invoiceData.vehicle.plate}</div>
                )}
                {invoiceData.vehicle.bicycleCode && (
                  <div>{invoiceData.vehicle.bicycleCode}</div>
                )}
                {invoiceData.vehicle.brand && (
                  <div className="small">
                    {invoiceData.vehicle.brand} {invoiceData.vehicle.model} - {invoiceData.vehicle.color}
                  </div>
                )}
              </div>

              <div className="line"></div>

              <table>
                <tbody>
                  <tr>
                    <td className="label bold">Entrada:</td>
                    <td className="value">{formatDate(invoiceData.entryAt)} {formatTime(invoiceData.entryAt)}</td>
                  </tr>
                  <tr>
                    <td className="label bold">Salida:</td>
                    <td className="value">{formatDate(invoiceData.exitAt)} {formatTime(invoiceData.exitAt)}</td>
                  </tr>
                  <tr>
                    <td className="label bold">Tiempo total:</td>
                    <td className="value">{formatDuration(invoiceData.quote.totalMinutes)}</td>
                  </tr>
                  {invoiceData.quote.graceMinutesApplied > 0 && (
                    <tr>
                      <td className="label">Gracia aplicada:</td>
                      <td className="value">-{formatDuration(invoiceData.quote.graceMinutesApplied)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="label bold">Tiempo facturable:</td>
                    <td className="value">{formatDuration(invoiceData.quote.billableMinutes)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="line"></div>

              <table>
                <tbody>
                  <tr>
                    <td className="label">Servicio de parqueo:</td>
                    <td className="value">{formatCurrency(invoiceData.quote.subtotal)}</td>
                  </tr>
                  {invoiceData.quote.dailyMaxApplied && invoiceData.quote.dailyMaxAmount && (
                    <tr>
                      <td className="label small">Máximo diario aplicado:</td>
                      <td className="value small">{formatCurrency(invoiceData.quote.dailyMaxAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="double-line"></div>

              <table>
                <tbody>
                  <tr>
                    <td className="label bold big">TOTAL:</td>
                    <td className="value bold big">{formatCurrency(invoiceData.quote.total)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="line"></div>

              <div>
                <div className="bold">PAGO:</div>
                {invoiceData.payment.items.map((item, idx) => (
                  <div key={idx}>
                    <table>
                      <tbody>
                        <tr>
                          <td className="label">{getPaymentMethodLabel(item.method)}:</td>
                          <td className="value">{formatCurrency(item.amount)}</td>
                        </tr>
                        {item.receivedAmount && item.receivedAmount > item.amount && (
                          <>
                            <tr>
                              <td className="label small">Recibido:</td>
                              <td className="value small">{formatCurrency(item.receivedAmount)}</td>
                            </tr>
                            <tr>
                              <td className="label small">Cambio:</td>
                              <td className="value small">{formatCurrency(item.changeAmount || 0)}</td>
                            </tr>
                          </>
                        )}
                        {item.reference && (
                          <tr>
                            <td className="label small">Ref:</td>
                            <td className="value small">{item.reference}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              <div className="line"></div>

              <div className="center small">
                <div>Gracias por su preferencia</div>
                <div>Conserve esta factura</div>
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
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar
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
