import './globals.css'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'Alto Mando - Tracker',
  description: 'Gestor de torneos y perfiles de Alto Mando',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        {/* Barra de navegación global */}
        <Navbar />
        
        {/* Contenido principal de cada página */}
        <main className="flex-1 pb-10 pt-6">
          {children}
        </main>
      </body>
    </html>
  )
}