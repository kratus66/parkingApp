import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: 'Parking System',
  description: 'Sistema de gestión de parqueaderos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
