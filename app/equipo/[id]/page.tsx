"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' 
import { useParams } from 'next/navigation'
import Link from 'next/link'

// --- CEREBRO BO3: Lógica matemática para rondas de torneo ---
const calcularResultadoRonda = (resultadoBo3: string) => {
  const res = resultadoBo3 || "";
  const wins = (res.match(/W/g) || []).length;
  const losses = (res.match(/L/g) || []).length;
  const ties = (res.match(/T/g) || []).length;

  if (wins > losses) return 'W'; 
  if (losses > wins) return 'L'; 
  if (wins === losses && wins > 0) return 'T'; 
  if (ties > 0 && wins === 0 && losses === 0) return 'T'; 
  
  return null; 
}

export default function PerfilJugadorPage() {
  const params = useParams()
  const jugadorId = params.id as string

  const [jugador, setJugador] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [statsGlobales, setStatsGlobales] = useState({ W: 0, L: 0, T: 0 })
  
  // NUEVO ESTADO: Guardará las estadísticas agrupadas por mazo
  const [estadisticasMazos, setEstadisticasMazos] = useState<any[]>([])
  
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (jugadorId) cargarPerfil()
  }, [jugadorId])

  const cargarPerfil = async () => {
    const { data: dataJugador } = await supabase.from('jugadores').select('*').eq('id', jugadorId).single()
    if (dataJugador) setJugador(dataJugador)

    const { data: asistencias } = await supabase.from('asistencias').select('torneo_id').eq('jugador_id', jugadorId).eq('estado', 'Voy')
    
    if (asistencias && asistencias.length > 0) {
      const torneoIds = asistencias.map(a => a.torneo_id)
      const { data: torneos } = await supabase.from('torneos').select('*').in('id', torneoIds).order('fecha', { ascending: false })
      const { data: mazos } = await supabase.from('participaciones_mazos').select('*').eq('jugador_id', jugadorId)
      const { data: rondas } = await supabase.from('rondas_torneo').select('*').eq('jugador_id', jugadorId).order('numero_ronda', { ascending: true })

      let globalW = 0, globalL = 0, globalT = 0;
      
      // NUEVO: Diccionario para agrupar los datos por mazo
      const statsPorMazo: Record<string, any> = {};
      
      const torneosArmados = torneos?.map(torneo => {
        const mazosTorneo = mazos?.filter(m => m.torneo_id === torneo.id) || []
        const rondasTorneo = rondas?.filter(r => r.torneo_id === torneo.id) || []
        
        let tW = 0, tL = 0, tT = 0;
        
        // Identificamos el mazo principal que usó en este torneo
        const mazoPrincipal = mazosTorneo.find((m: any) => m.slot === 1)?.pokemon_principal || 'Desconocido';
        
        rondasTorneo.forEach(r => {
          const resultadoFinalRonda = calcularResultadoRonda(r.resultado);
          if (!resultadoFinalRonda) return; // Si la ronda está vacía, no suma
          
          // Suma al global del torneo
          if (resultadoFinalRonda === 'W') tW++;
          if (resultadoFinalRonda === 'L') tL++;
          if (resultadoFinalRonda === 'T') tT++;

          // --- LOGICA DE ESTADÍSTICAS POR MAZO Y MATCHUP ---
          if (!statsPorMazo[mazoPrincipal]) {
            statsPorMazo[mazoPrincipal] = { W: 0, L: 0, T: 0, matchups: {} };
          }
          
          const oponentes = (r.oponente || '/').split('/');
          const rivalPrincipal = oponentes[0] || 'Desconocido';

          if (!statsPorMazo[mazoPrincipal].matchups[rivalPrincipal]) {
            statsPorMazo[mazoPrincipal].matchups[rivalPrincipal] = { W: 0, L: 0, T: 0 };
          }

          // Sumamos el resultado al mazo y al enfrentamiento concreto
          statsPorMazo[mazoPrincipal][resultadoFinalRonda]++;
          statsPorMazo[mazoPrincipal].matchups[rivalPrincipal][resultadoFinalRonda]++;
        })

        globalW += tW; globalL += tL; globalT += tT;

        return {
          ...torneo,
          mazos: mazosTorneo,
          rondas: rondasTorneo,
          stats: { W: tW, L: tL, T: tT }
        }
      }) || []

      // Convertimos el diccionario en un array ordenado para mostrarlo fácilmente en pantalla
      const arrayStatsMazos = Object.entries(statsPorMazo).map(([nombreMazo, stats]: any) => {
        const totalPartidas = stats.W + stats.L + stats.T;
        const winRate = totalPartidas > 0 ? Math.round((stats.W / totalPartidas) * 100) : 0;
        
        const matchupsArray = Object.entries(stats.matchups).map(([nombreRival, mStats]: any) => {
           const mTotal = mStats.W + mStats.L + mStats.T;
           const mWinRate = mTotal > 0 ? Math.round((mStats.W / mTotal) * 100) : 0;
           return { nombreRival, ...mStats, total: mTotal, winRate: mWinRate };
        }).sort((a, b) => b.total - a.total); // Ordenamos los rivales por los que más veces ha enfrentado

        return {
          nombreMazo,
          ...stats,
          total: totalPartidas,
          winRate,
          matchups: matchupsArray
        };
      }).sort((a, b) => b.total - a.total); // Ordenamos los mazos por los que más ha jugado

      setHistorial(torneosArmados)
      setStatsGlobales({ W: globalW, L: globalL, T: globalT })
      setEstadisticasMazos(arrayStatsMazos)
    }
    setCargando(false)
  }

  const obtenerSpriteUrl = (nombrePokemon: string) => {
    if (!nombrePokemon || nombrePokemon === 'Desconocido') return undefined;
    const formatted = nombrePokemon.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    return `https://play.pokemonshowdown.com/sprites/gen5/${formatted}.png`;
  }

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'Local': return 'bg-white text-gray-700 border border-gray-300';
      case 'Challenge': return 'bg-[#5B493B] text-white';
      case 'Cup': return 'bg-blue-600 text-white';
      case 'Regional': return 'bg-purple-700 text-white';
      case 'Mundial': return 'bg-amber-500 text-white font-black shadow-sm';
      default: return 'bg-[#5B493B] text-white';
    }
  }

  if (cargando) return <div className="flex justify-center items-center h-64 text-[#5B493B] font-bold">Cargando datos de combate...</div>
  if (!jugador) return <div className="text-center mt-10 font-bold text-red-500">Jugador no encontrado en la base de datos</div>

  const totalJuegos = statsGlobales.W + statsGlobales.L + statsGlobales.T
  const winRate = totalJuegos > 0 ? Math.round((statsGlobales.W / totalJuegos) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      
      <Link href="/equipo" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-[#5B493B] transition-colors mb-6">
        ← Volver al Roster
      </Link>

      {/* Cabecera del Perfil */}
      <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0">
           <span className="text-4xl font-black text-[#5B493B]">{jugador.nombre.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 text-center md:text-left w-full">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{jugador.nombre}</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Miembro de Alto Mando</p>
          
          <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex flex-col items-center border-r border-gray-200">
              <span className="text-[10px] font-black text-gray-400 uppercase">Win Rate</span>
              <span className="text-lg font-black text-[#5B493B]">{winRate}%</span>
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

      {/* NUEVA SECCIÓN: ANÁLISIS DE MAZOS */}
      {estadisticasMazos.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-black text-[#5B493B] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Análisis de Mazos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estadisticasMazos.map((mazoData, idx) => {
              const spriteMazo = obtenerSpriteUrl(mazoData.nombreMazo)
              
              return (
                <div key={idx} className="bg-white rounded-2xl border-[2px] border-orange-200 shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Cabecera del Mazo */}
                  <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full border border-orange-200 shadow-sm flex items-center justify-center p-1 relative">
                        {spriteMazo ? <img src={spriteMazo} alt={mazoData.nombreMazo} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-300 font-bold">?</span>}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 capitalize text-sm">{mazoData.nombreMazo}</h4>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">{mazoData.total} Partidas jugadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="block text-xl font-black text-[#5B493B]">{mazoData.winRate}%</span>
                       <span className="text-[10px] font-bold text-gray-500">{mazoData.W}W - {mazoData.L}L - {mazoData.T}T</span>
                    </div>
                  </div>

                  {/* Lista de Matchups */}
                  <div className="p-3 bg-white flex-1">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 px-1">Rendimiento por Matchup</h5>
                    {mazoData.matchups.length === 0 ? (
                      <p className="text-xs text-gray-400 italic px-1">Sin datos de rivales.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {mazoData.matchups.map((rival: any, i: number) => {
                          const spriteRival = obtenerSpriteUrl(rival.nombreRival)
                          // Coloreamos el winrate del matchup
                          let colorWR = 'text-gray-600'
                          if (rival.winRate > 50) colorWR = 'text-green-600'
                          if (rival.winRate < 50 && rival.total > 1) colorWR = 'text-red-500' // Solo rojo si ha jugado más de 1 y pierde

                          return (
                            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {spriteRival ? <img src={spriteRival} alt={rival.nombreRival} className="w-full h-full object-contain" /> : <span className="text-[8px] text-gray-300">-</span>}
                                </div>
                                <span className="text-xs font-bold text-gray-700 capitalize">{rival.nombreRival}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 rounded border border-gray-200 shadow-sm">{rival.W}W {rival.L}L {rival.T}T</span>
                                <span className={`text-xs font-black w-8 text-right ${colorWR}`}>{rival.winRate}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                  
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{torneo.nombre}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{torneo.fecha} • {torneo.lugar}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
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
                          
                          const dictamenRonda = calcularResultadoRonda(ronda.resultado);

                          return (
                            <div key={ronda.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <span className="text-[10px] font-black text-gray-400 w-5 text-center shrink-0">R{ronda.numero_ronda}</span>
                              
                              <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase shrink-0">VS</div>
                              
                              <div className="flex gap-1 flex-1 min-w-[60px]">
                                {[op1, op2].map((opSprite, i) => (
                                  <div key={i} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center p-0.5 shadow-sm">
                                    {opSprite ? <img src={opSprite} alt="Oponente" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="text-[8px] text-gray-300 font-bold">-</span>}
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-1 shrink-0 ml-auto sm:ml-0">
                                {resultadosBo3.map((res: string, i: number) => {
                                  let color = 'bg-gray-100 text-gray-400 border-gray-200'
                                  if (res === 'W') color = 'bg-green-100 text-green-700 border-green-300'
                                  if (res === 'L') color = 'bg-red-100 text-red-700 border-red-300'
                                  if (res === 'T') color = 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  
                                  return (
                                    <div key={i} className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded border ${color}`}>
                                      {res}
                                    </div>
                                  )
                                })}
                              </div>

                              {dictamenRonda && (
                                <>
                                  <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
                                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                    dictamenRonda === 'W' ? 'bg-green-600 text-white border-green-700' :
                                    dictamenRonda === 'L' ? 'bg-red-600 text-white border-red-700' :
                                    'bg-yellow-500 text-white border-yellow-600'
                                  }`}>
                                    {dictamenRonda === 'W' ? 'WIN' : dictamenRonda === 'L' ? 'LOSS' : 'TIE'}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-100/50 px-4 py-2 border-t border-gray-200 flex justify-end gap-3 text-xs font-bold text-gray-600">
                     <span>Final del Torneo:</span>
                     <span className="text-green-600 bg-green-100 px-1.5 rounded">{torneo.stats.W}W</span>
                     <span className="text-red-600 bg-red-100 px-1.5 rounded">{torneo.stats.L}L</span>
                     <span className="text-yellow-600 bg-yellow-100 px-1.5 rounded">{torneo.stats.T}T</span>
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