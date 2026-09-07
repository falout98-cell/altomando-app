"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' // Ojo a la ruta, puede que necesites ajustar los '../' dependiendo de tu estructura
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PerfilJugadorPage() {
  const params = useParams()
  const jugadorId = params.id as string

  const [jugador, setJugador] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [statsGlobales, setStatsGlobales] = useState({ W: 0, L: 0, T: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (jugadorId) cargarPerfil()
  }, [jugadorId])

  const cargarPerfil = async () => {
    // 1. Obtener datos básicos del jugador
    const { data: dataJugador } = await supabase.from('jugadores').select('*').eq('id', jugadorId).single()
    if (dataJugador) setJugador(dataJugador)

    // 2. Buscar a qué torneos ha dicho "Voy"
    const { data: asistencias } = await supabase.from('asistencias').select('torneo_id').eq('jugador_id', jugadorId).eq('estado', 'Voy')
    
    if (asistencias && asistencias.length > 0) {
      const torneoIds = asistencias.map(a => a.torneo_id)

      // 3. Traer la info de esos torneos (ordenados del más reciente al más antiguo)
      const { data: torneos } = await supabase.from('torneos').select('*').in('id', torneoIds).order('fecha', { ascending: false })
      
      // 4. Traer los mazos que usó en todos esos torneos
      const { data: mazos } = await supabase.from('participaciones_mazos').select('*').eq('jugador_id', jugadorId)
      
      // 5. Traer todas las rondas jugadas por este jugador
      const { data: rondas } = await supabase.from('rondas_torneo').select('*').eq('jugador_id', jugadorId).order('numero_ronda', { ascending: true })

      let globalW = 0, globalL = 0, globalT = 0;
      
      // 6. Empaquetar todo esto por torneo para que sea fácil de dibujar en pantalla
      const torneosArmados = torneos?.map(torneo => {
        const mazosTorneo = mazos?.filter(m => m.torneo_id === torneo.id) || []
        const rondasTorneo = rondas?.filter(r => r.torneo_id === torneo.id) || []
        
        let tW = 0, tL = 0, tT = 0;
        
        rondasTorneo.forEach(r => {
          const res = r.resultado || ""
          tW += (res.match(/W/g) || []).length
          tL += (res.match(/L/g) || []).length
          tT += (res.match(/T/g) || []).length
        })

        globalW += tW; globalL += tL; globalT += tT;

        return {
          ...torneo,
          mazos: mazosTorneo,
          rondas: rondasTorneo,
          stats: { W: tW, L: tL, T: tT }
        }
      }) || []

      setHistorial(torneosArmados)
      setStatsGlobales({ W: globalW, L: globalL, T: globalT })
    }
    setCargando(false)
  }

  const obtenerSpriteUrl = (nombrePokemon: string) => {
    if (!nombrePokemon) return null;
    const formatted = nombrePokemon.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    return `https://play.pokemonshowdown.com/sprites/dex/${formatted}.png`;
  }

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'Local': return 'bg-white text-gray-700 border border-gray-300';
      case 'Challenge': return 'bg-[#b67b4c] text-white';
      case 'Cup': return 'bg-blue-600 text-white';
      case 'Regional': return 'bg-purple-700 text-white';
      case 'Mundial': return 'bg-amber-500 text-white font-black shadow-sm';
      default: return 'bg-[#b67b4c] text-white';
    }
  }

  if (cargando) return <div className="flex justify-center items-center h-64 text-[#b67b4c] font-bold">Cargando datos de combate...</div>
  if (!jugador) return <div className="text-center mt-10 font-bold text-red-500">Jugador no encontrado en la base de datos</div>

  const totalJuegos = statsGlobales.W + statsGlobales.L + statsGlobales.T
  const winRate = totalJuegos > 0 ? Math.round((statsGlobales.W / totalJuegos) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Botón de volver */}
      <Link href="/equipo" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-[#b67b4c] transition-colors mb-6">
        ← Volver al Roster
      </Link>

      {/* Cabecera del Perfil */}
      <div className="bg-white rounded-2xl border-[3px] border-[#b67b4c] shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* Avatar Provisional */}
        <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0">
           <span className="text-4xl font-black text-[#b67b4c]">{jugador.nombre.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex-1 text-center md:text-left w-full">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{jugador.nombre}</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Miembro de Alto Mando</p>
          
          {/* Stats Globales */}
          <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex flex-col items-center border-r border-gray-200">
              <span className="text-[10px] font-black text-gray-400 uppercase">Win Rate</span>
              <span className="text-lg font-black text-[#b67b4c]">{winRate}%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-green-600 uppercase">Wins</span>
              <span className="text-lg font-bold text-gray-800">{statsGlobales.W}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-red-600 uppercase">Losses</span>
              <span className="text-lg font-bold text-gray-800">{statsGlobales.L}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-yellow-600 uppercase">Ties</span>
              <span className="text-lg font-bold text-gray-800">{statsGlobales.T}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Torneos */}
      <div>
        <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Historial de Torneos</h3>
        
        {historial.length === 0 ? (
          <p className="text-sm text-gray-500 italic bg-white p-4 rounded-xl border border-gray-200">Aún no hay torneos registrados para este jugador.</p>
        ) : (
          <div className="space-y-4">
            {historial.map((torneo) => {
              const mazo1 = torneo.mazos.find((m: any) => m.slot === 1)?.pokemon_principal || ''
              const mazo2 = torneo.mazos.find((m: any) => m.slot === 2)?.pokemon_principal || ''
              const sp1 = obtenerSpriteUrl(mazo1)
              const sp2 = obtenerSpriteUrl(mazo2)

              return (
                <div key={torneo.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  
                  {/* Cabecera del Torneo (Lectura) */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{torneo.nombre}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{torneo.fecha} • {torneo.lugar}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Mazos usados en este torneo */}
                      <div className="flex gap-1">
                        {[sp1, sp2].map((sp, i) => (
                           <div key={i} className="w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center p-0.5 shadow-sm">
                             {sp ? <img src={sp} alt="Mazo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="text-[10px] text-gray-300 font-bold">?</span>}
                           </div>
                        ))}
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${obtenerColorTipo(torneo.tipo)}`}>
                        {torneo.tipo}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Rondas (Lectura) */}
                  <div className="p-4">
                    {torneo.rondas.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay rondas registradas en este torneo.</p>
                    ) : (
                      <div className="space-y-2">
                        {torneo.rondas.map((ronda: any) => {
                          const oponentes = (ronda.oponente || '/').split('/')
                          const op1 = obtenerSpriteUrl(oponentes[0])
                          const op2 = obtenerSpriteUrl(oponentes[1])
                          const resultadosBo3 = (ronda.resultado || "").split('')

                          return (
                            <div key={ronda.id} className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <span className="text-[10px] font-black text-gray-400 w-5 text-center shrink-0">R{ronda.numero_ronda}</span>
                              
                              <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase shrink-0">VS</div>
                              
                              <div className="flex gap-1 flex-1">
                                {[op1, op2].map((opSprite, i) => (
                                  <div key={i} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center p-0.5 shadow-sm">
                                    {opSprite ? <img src={opSprite} alt="Oponente" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="text-[8px] text-gray-300 font-bold">-</span>}
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-1 shrink-0">
                                {resultadosBo3.map((res: string, i: number) => {
                                  let color = 'bg-gray-100 text-gray-400 border-gray-200'
                                  if (res === 'W') color = 'bg-green-100 text-green-700 border-green-300'
                                  if (res === 'L') color = 'bg-red-100 text-red-700 border-red-300'
                                  if (res === 'T') color = 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  
                                  return (
                                    <div key={i} className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded border ${color}`}>
                                      {res}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resumen del torneo */}
                  <div className="bg-gray-100/50 px-4 py-2 border-t border-gray-200 flex justify-end gap-3 text-xs font-bold text-gray-600">
                     <span>Final:</span>
                     <span className="text-green-600">{torneo.stats.W}W</span>
                     <span className="text-red-600">{torneo.stats.L}L</span>
                     <span className="text-yellow-600">{torneo.stats.T}T</span>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}