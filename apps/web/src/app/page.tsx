import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Sistema de Gestión de Parqueaderos
        </h1>
        <p className="text-center text-lg mb-8">
          Plataforma SaaS multi-empresa para administración de parqueaderos
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-white text-gray-600 border border-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
