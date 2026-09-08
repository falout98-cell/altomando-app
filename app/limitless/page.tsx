"use client"
import { useState, useEffect } from 'react'
import { obtenerTorneosLimitless } from '../actions/limitless'

export default function LimitlessTracker() {
  const [minJugadores, setMinJugadores] = useState(100)
  const [torneos, setTorneos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  // Ejecutamos el bot cada vez que cambias el filtro
  useEffect(() => {
    const buscarDatos = async () => {
      setCargando(true)
      const datosReales = await obtenerTorneosLimitless(minJugadores)
      setTorneos(datosReales)
      setCargando(false)
    }
    buscarDatos()
  }, [minJugadores])

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      
      {/* Cabecera y Filtro */}
      <div className="bg-[#5B493B] rounded-2xl p-6 shadow-md mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-[#BBAE9D]">
        <div>
          <h1 className="text-2xl font-black text-[#F9F1DC] uppercase tracking-widest flex items-center gap-2">
            📡 Radar Limitless
          </h1>
          <p className="text-[#BBAE9D] text-sm font-bold mt-1 uppercase">Datos en Tiempo Real</p>
        </div>
        
        <div className="bg-[#F9F1DC] p-3 rounded-xl flex items-center gap-3 shadow-inner">
          <label className="text-xs font-black text-[#5B493B] uppercase tracking-wider">Filtro Top:</label>
          <select 
            value={minJugadores}
            onChange={(e) => setMinJugadores(Number(e.target.value))}
            className="bg-transparent text-[#5B493B] font-bold outline-none cursor-pointer text-sm"
          >
            <option value={50}>+50 Jugadores</option>
            <option value={100}>+100 Jugadores</option>
            <option value={200}>+200 Jugadores</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-32 text-[#5B493B] font-bold animate-pulse">
          Infiltrándose en los servidores de Limitless...
        </div>
      ) : torneos.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#BBAE9D] p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No se encontraron torneos con ese filtro.</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-[#5B493B] before:via-[#BBAE9D] before:to-transparent">
          
          {torneos.map((torneo) => (
            <div key={torneo.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#F9F1DC] bg-[#5B493B] text-[#F9F1DC] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                🏆
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border-2 border-[#BBAE9D] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{torneo.fecha}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    👤 {torneo.jugadores}
                  </span>
                </div>
                
                <h3 className="font-black text-gray-800 leading-tight mb-3">{torneo.nombre}</h3>
                
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🥇</span>
                    <span className="font-bold text-[#5B493B] text-sm truncate max-w-[150px]">{torneo.ganador}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">{torneo.organizador}</span>
                </div>

                <a 
                  href={torneo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#5B493B] text-[#F9F1DC] font-black text-xs py-2.5 rounded-xl uppercase tracking-widest hover:bg-[#BBAE9D] hover:text-[#5B493B] transition-colors cursor-pointer"
                >
                  Ver Lista del Ganador 🥇
                </a>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}