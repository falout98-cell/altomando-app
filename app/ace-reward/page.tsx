"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// Puntuaciones oficiales
const PTS_CHALLENGE = [
  { label: "-", value: 0 },
  { label: "1º (+15 CP)", value: 15 },
  { label: "2º (+12 CP)", value: 12 },
  { label: "3º/4º (+10 CP)", value: 10 },
  { label: "5º-8º (+8 CP)", value: 8 }
]

const PTS_CUP = [
  { label: "-", value: 0 },
  { label: "1º (+50 CP)", value: 50 },
  { label: "2º (+40 CP)", value: 40 },
  { label: "3º/4º (+32 CP)", value: 32 },
  { label: "5º-8º (+25 CP)", value: 25 }
]

export default function AceRewardPage() {
  const [jugadores, setJugadores] = useState<any[]>([])
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  // 1. Cargar los datos desde Supabase al entrar
  useEffect(() => {
    cargarClasificacion()
  }, [])

  const cargarClasificacion = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('ace_reward')
      .select('*')
      
    if (data) {
      setJugadores(data)
    } else if (error) {
      console.error("Error cargando expediente:", error)
    }
    setCargando(false)
  }

  // Orden: De más CP a menos. Si hay empate, orden alfabético.
  const jugadoresOrdenados = [...jugadores].sort((a, b) => 
    b.total - a.total || a.nombre.localeCompare(b.nombre)
  )

  const recalcularTotal = (challenges: number[], cups: number[]) => {
    const sumaCh = challenges.reduce((a, b) => a + b, 0)
    const sumaCu = cups.reduce((a, b) => a + b, 0)
    return sumaCh + sumaCu
  }

  // 2. Actualizar en pantalla y guardar en Supabase a la vez
  const actualizarPuntos = async (categoria: 'challenges' | 'cups', index: number, valor: number) => {
    if (!jugadorSeleccionado) return

    const nuevosDatos = [...jugadorSeleccionado[categoria]]
    nuevosDatos[index] = valor
    
    const nuevoTotal = categoria === 'challenges' 
      ? recalcularTotal(nuevosDatos, jugadorSeleccionado.cups)
      : recalcularTotal(jugadorSeleccionado.challenges, nuevosDatos)

    const jugadorActualizado = {
      ...jugadorSeleccionado,
      [categoria]: nuevosDatos,
      total: nuevoTotal
    }

    setJugadorSeleccionado(jugadorActualizado)
    setJugadores(jugadores.map(j => j.id === jugadorActualizado.id ? jugadorActualizado : j))

    const { error } = await supabase
      .from('ace_reward')
      .update({
        [categoria]: nuevosDatos,
        total: nuevoTotal
      })
      .eq('id', jugadorActualizado.id)

    if (error) {
      console.error("Error guardando los CP:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Cabecera Ace Reward */}
      <div className="bg-gradient-to-r from-[#5B493B] to-[#3A2E25] rounded-2xl p-6 shadow-lg mb-8 text-center border-b-4 border-amber-500 relative overflow-hidden flex flex-col items-center">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl font-black text-[#F9F1DC] uppercase tracking-widest flex items-center justify-center gap-3 relative z-10">
          ⭐ Ace Reward
        </h1>
        <p className="text-[#BBAE9D] text-sm font-bold mt-2 uppercase tracking-wider relative z-10">
          Clasificación Oficial del Equipo
        </p>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-32 text-[#5B493B] font-bold animate-pulse">
          Accediendo a los archivos de Alto Mando...
        </div>
      ) : jugadores.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#BBAE9D] p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">La clasificación está vacía. Registra a los entrenadores en la base de datos.</p>
        </div>
      ) : (
        /* Tabla de Clasificación */
        <div className="bg-white rounded-2xl border-[3px] border-[#BBAE9D] shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b-2 border-[#BBAE9D] font-black text-[#5B493B] uppercase text-xs sm:text-sm tracking-wider">
            <div className="col-span-2 sm:col-span-1 text-center">Rango</div>
            <div className="col-span-6 sm:col-span-7">Entrenador</div>
            <div className="col-span-4 text-center text-amber-600">CP Totales</div>
          </div>

          <div className="divide-y divide-gray-100">
            {jugadoresOrdenados.map((jugador, index) => (
              <div 
                key={jugador.id} 
                onClick={() => setJugadorSeleccionado(jugador)}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#F9F1DC]/50 cursor-pointer transition-colors group"
              >
                <div className="col-span-2 sm:col-span-1 text-center font-black text-gray-400 group-hover:text-[#5B493B]">
                  #{index + 1}
                </div>
                <div className="col-span-6 sm:col-span-7 font-bold text-gray-800 text-lg">
                  {jugador.nombre}
                </div>
                <div className="col-span-4 text-center">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-sm border border-amber-200">
                    {jugador.total} CP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal del Expediente de Jugador */}
      {jugadorSeleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
            
            {/* Cabecera del Modal */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-5 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                  Expediente: <span className="text-[#5B493B]">{jugadorSeleccionado.nombre}</span>
                </h3>
                <p className="text-sm font-bold text-amber-600 mt-1">Total acumulado: {jugadorSeleccionado.total} CP</p>
              </div>
              <button 
                onClick={() => setJugadorSeleccionado(null)} 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold text-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-8">
              
              {/* Sección Cups */}
              <div>
                <h4 className="flex items-center gap-2 font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-100 pb-2">
                  🏆 League Cups (Top 4)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((slotIndex) => (
                    <div key={`cup-${slotIndex}`} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Slot {slotIndex + 1}</label>
                      <select 
                        value={jugadorSeleccionado.cups[slotIndex]}
                        onChange={(e) => actualizarPuntos('cups', slotIndex, Number(e.target.value))}
                        className="w-full text-sm font-bold text-gray-800 bg-white p-2.5 rounded-lg border border-gray-300 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                      >
                        {PTS_CUP.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección Challenges */}
              <div>
                <h4 className="flex items-center gap-2 font-black text-[#5B493B] uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                  ⚔️ League Challenges (Top 4)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((slotIndex) => (
                    <div key={`challenge-${slotIndex}`} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Slot {slotIndex + 1}</label>
                      <select 
                        value={jugadorSeleccionado.challenges[slotIndex]}
                        onChange={(e) => actualizarPuntos('challenges', slotIndex, Number(e.target.value))}
                        className="w-full text-sm font-bold text-gray-800 bg-white p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B] cursor-pointer shadow-sm"
                      >
                        {PTS_CHALLENGE.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button 
                onClick={() => setJugadorSeleccionado(null)} 
                className="px-6 py-2.5 text-sm font-black text-white bg-[#5B493B] hover:bg-[#BBAE9D] rounded-xl transition shadow-sm cursor-pointer uppercase tracking-widest"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  )
}