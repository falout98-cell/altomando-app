"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navLinks = [
    { name: 'Torneos', href: '/' },
    { name: 'Roster', href: '/equipo' },
    { name: 'Limitless', href: '/limitless' },
    { name: 'Ace Reward', href: '/ace-reward' }
  ]

  return (
    <nav className="bg-[#5B493B] text-[#F9F1DC] shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Nombre del Equipo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Escudo Alto Mando" 
                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform bg-[#F9F1DC] rounded-full p-0.5" 
              />
              <span className="text-xl font-black tracking-widest uppercase hidden sm:block text-[#F9F1DC]">
                Alto Mando
              </span>
            </Link>
          </div>

          {/* Enlaces de navegación */}
          <div className="flex items-center gap-2 sm:gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#F9F1DC] text-[#5B493B] shadow-sm scale-105' 
                      : 'text-[#F9F1DC]/80 hover:bg-[#BBAE9D]/30 hover:text-[#F9F1DC]'
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