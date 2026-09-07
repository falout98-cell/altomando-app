"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  // Definimos las rutas principales
  const navLinks = [
    { name: 'Torneos', href: '/' },
    { name: 'Roster', href: '/equipo' }
  ]

  return (
    <nav className="bg-[#b67b4c] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Nombre del Equipo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Escudo Alto Mando" 
                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform bg-white rounded-full p-0.5" 
              />
              <span className="text-xl font-black tracking-widest uppercase hidden sm:block">
                Alto Mando
              </span>
            </Link>
          </div>

          {/* Enlaces de navegación */}
          <div className="flex items-center gap-2 sm:gap-4">
            {navLinks.map((link) => {
              // Comprobamos si la URL actual coincide con el enlace para marcarlo como activo
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-[#b67b4c] shadow-sm scale-105' 
                      : 'text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>
          
        </div>
      </div>
    </nav>
  )
}