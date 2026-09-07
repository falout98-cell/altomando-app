"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase' // Ajusta la ruta si tu lib/supabase está en otro sitio
import Link from 'next/link'

export default function EquipoPage() {
  const [jugadores, setJugadores] = useState<any[]>([])
  const [estadisticas, setEstadisticas] = useState<Record<string, { W: number, L: number, T: number }>>({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    // 1. Cargar jugadores
    const { data: listadoJugadores } = await supabase.from('jugadores').select('*').order('nombre')
    
    // 2. Cargar todas las rondas de todos los torneos para calcular las estadísticas globales
    const { data: listadoRondas } = await supabase.from('rondas_torneo').select('jugador_id, resultado')

    if (listadoJugadores) {
      setJugadores(listadoJugadores)
      
      // Inicializar contadores a 0
      const stats: Record<string, { W: number, L: number, T: number }> = {}
      listadoJugadores.forEach(j => {
        stats[j.id] = { W: 0, L: 0, T: 0 }
      })

      // Sumar resultados (contando cada letra W, L, T de los Bo3)
      if (listadoRondas) {
        listadoRondas.forEach(ronda => {
          const id = ronda.jugador_id
          const res = ronda.resultado || ""
          
          if (stats[id]) {
            stats[id].W += (res.match(/W/g) || []).length
            stats[id].L += (res.match(/L/g) || []).length
            stats[id].T += (res.match(/T/g) || []).length
          }
        })
      }
      
      setEstadisticas(stats)
    }
    setCargando(false)
  }

  if (cargando) {
    return <div className="flex justify-center items-center h-64 text-[#b67b4c] font-bold">Cargando Roster...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Cabecera de la página */}
      <div className="mb-8 border-b-4 border-[#b67b4c] pb-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest">Alto Mando</h1>
        <p className="text-gray-500 font-bold mt-1">Roster Oficial y Estadísticas Globales</p>
      </div>

      {/* Cuadrícula de Jugadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jugadores.map((jugador) => {
          const stats = estadisticas[jugador.id] || { W: 0, L: 0, T: 0 }
          const totalPartidas = stats.W + stats.L + stats.T
          const winRate = totalPartidas > 0 ? Math.round((stats.W / totalPartidas) * 100) : 0

          return (
            <Link 
              href={`/equipo/${jugador.id}`} 
              key={jugador.id}
              className="bg-white rounded-2xl border-[3px] border-gray-200 hover:border-[#b67b4c] shadow-sm hover:shadow-lg transition-all duration-300 p-5 group flex flex-col items-center cursor-pointer"
            >
              {/* Avatar genérico o Letra */}
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-[#b67b4c] transition-colors rounded-full flex items-center justify-center mb-3 shadow-inner">
                <span className="text-2xl font-black text-gray-400 group-hover:text-white">
                  {jugador.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-4">{jugador.nombre}</h2>
              
              {/* Estadísticas de combate (W-L-T) */}
              <div className="w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Récord (Juegos)</span>
                  <span className="text-xs font-black text-[#b67b4c]">{winRate}% WR</span>
                </div>
                
                <div className="flex justify-between text-center gap-2">
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md border border-green-200 flex-1">
                    <span className="block text-[10px] font-black uppercase">Win</span>
                    <span className="block text-sm font-bold">{stats.W}</span>
                  </div>
                  <div className="bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200 flex-1">
                    <span className="block text-[10px] font-black uppercase">Loss</span>
                    <span className="block text-sm font-bold">{stats.L}</span>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md border border-yellow-200 flex-1">
                    <span className="block text-[10px] font-black uppercase">Tie</span>
                    <span className="block text-sm font-bold">{stats.T}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full text-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-[#b67b4c] transition-colors">
                  Ver Perfil Completo ➔
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}