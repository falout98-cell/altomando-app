"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

// 👑 PON AQUÍ TU CORREO PARA TENER PERMISOS DE ADMINISTRADOR
const ADMIN_EMAIL = "falout98@gmail.com" 

let pokeCache: string[] = [];

function PokemonMazoInput({ value, onChange, placeholder, size = "normal" }: any) {
  const [busqueda, setBusqueda] = useState(value || '')
  const [enfocado, setEnfocado] = useState(false)
  const [sugerencias, setSugerencias] = useState<string[]>([])

  useEffect(() => {
    if (value !== busqueda) setBusqueda(value || '')
  }, [value])

  useEffect(() => {
    if (pokeCache.length === 0) {
      fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
        .then(res => res.json())
        .then(data => { pokeCache = data.results.map((p: any) => p.name) })
        .catch(err => console.error("Error cargando PokeAPI", err))
    }
  }, [])

  useEffect(() => {
    if (enfocado && busqueda.length > 1) {
      const validas = pokeCache.filter(p => p.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 10)
      setSugerencias(validas)
    } else {
      setSugerencias([])
    }
  }, [busqueda, enfocado])

  const spriteUrl = value ? `https://play.pokemonshowdown.com/sprites/dex/${value.toLowerCase().replace(/[^a-z0-9]/g, '')}.png` : null;

  if (value) {
    return (
      <div 
        className="relative group cursor-pointer flex justify-center items-center w-full h-full min-h-[32px] bg-white rounded-md border border-gray-200 shadow-sm"
        onClick={() => { onChange(''); setBusqueda(''); setEnfocado(true); }}
        title={`Click para cambiar ${value}`}
      >
         <img 
            src={spriteUrl} 
            alt={value} 
            className={size === 'small' ? "w-8 h-8 object-contain" : "w-10 h-10 object-contain"} 
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.classList.remove('hidden');
            }} 
         />
         <span className="hidden text-[10px] font-bold text-gray-700 capitalize text-center leading-tight truncate px-1">
            {value}
         </span>
         <div className="absolute inset-0 bg-red-500/80 hidden group-hover:flex items-center justify-center rounded-md cursor-pointer transition">
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Borrar</span>
         </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center bg-white px-2 rounded-md border border-gray-200 shadow-sm">
       <input
         type="text"
         value={busqueda}
         onChange={e => setBusqueda(e.target.value)}
         onFocus={() => setEnfocado(true)}
         onBlur={() => {
           setEnfocado(false);
           if (busqueda && busqueda !== value) {
             onChange(busqueda);
           }
         }}
         onKeyDown={(e) => {
           if (e.key === 'Enter' && busqueda) {
             onChange(busqueda);
             setEnfocado(false);
           }
         }}
         placeholder={placeholder}
         className={`w-full font-bold text-gray-800 bg-transparent outline-none placeholder-gray-300 ${size === 'small' ? 'text-[10px]' : 'text-xs'}`}
       />
       {enfocado && sugerencias.length > 0 && (
          <div className="absolute top-full left-0 z-50 bg-white border-2 border-[#b67b4c] rounded-md shadow-xl w-36 max-h-48 overflow-y-auto mt-1">
             {sugerencias.map(p => (
                <div
                  key={p}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    onChange(p);
                    setBusqueda(p);
                    setSugerencias([]);
                    setEnfocado(false);
                  }}
                  className="px-3 py-2 text-xs text-gray-700 hover:bg-[#b67b4c] hover:text-white cursor-pointer capitalize font-bold border-b border-gray-100 last:border-0"
                >
                  {p}
                </div>
             ))}
          </div>
       )}
    </div>
  )
}

function Bo3Selector({ resultado, onChange }: any) {
  const partes = (resultado || "").split('');
  if (partes.length === 0) partes.push(''); 

  const handleChange = (index: number, val: string) => {
    const nuevas = [...partes];
    nuevas[index] = val;
    onChange(nuevas.filter(x => x !== '').join(''));
  }

  if (partes[partes.length - 1] !== '' && partes.length < 3) {
    partes.push('');
  }

  const colorLetra = (letra: string) => {
    if (letra === 'W') return 'text-green-700 bg-green-100 border-green-400'
    if (letra === 'L') return 'text-red-700 bg-red-100 border-red-400'
    if (letra === 'T') return 'text-orange-700 bg-orange-100 border-orange-400'
    return 'text-gray-400 bg-gray-50 border-gray-200'
  }

  return (
    <div className="flex gap-1">
      {partes.map((p, i) => (
         <select 
            key={i} 
            value={p} 
            onChange={e => handleChange(i, e.target.value)} 
            className={`text-[10px] font-black px-1 py-1 rounded-md border outline-none appearance-none cursor-pointer text-center w-8 shrink-0 shadow-sm ${colorLetra(p)}`}
         >
            <option value="">-</option>
            <option value="W">W</option>
            <option value="L">L</option>
            <option value="T">T</option>
         </select>
      ))}
    </div>
  )
}

// Función para determinar el estado de la ronda (Compatible con Bo1 y Bo3)
const obtenerEstadoRonda = (resultado: string) => {
  if (!resultado) return 'pendiente';

  const w = (resultado.match(/W/g) || []).length;
  const l = (resultado.match(/L/g) || []).length;
  const t = (resultado.match(/T/g) || []).length;

  // Si no hay ningún resultado todavía
  if (w === 0 && l === 0 && t === 0) return 'pendiente';

  // Quien tenga más victorias que derrotas, gana la ronda (sirve para "W" y para "WW" o "WT")
  if (w > l) return 'victoria';
  
  // Quien tenga más derrotas que victorias, pierde la ronda
  if (l > w) return 'derrota';
  
  // Si tienen el mismo número de W y L (ej. "WL"), o es un empate puro ("T")
  return 'empate';
}

export default function TorneoCard({ torneo }: { torneo: any }) {
  const [abierto, setAbierto] = useState(false)
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null) 
  const [jugadores, setJugadores] = useState<any[]>([])
  const [asistencias, setAsistencias] = useState<Record<string, string>>({})
  const [mazos, setMazos] = useState<Record<string, any>>({})
  const [rondas, setRondas] = useState<Record<string, any[]>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioEmail(session?.user?.email || null)
    })
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioEmail(session?.user?.email || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (abierto) cargarDatos()
    else cargarBasicos()
  }, [abierto])

  const cargarBasicos = async () => {
    const { data: listadoJugadores } = await supabase.from('jugadores').select('*').order('nombre')
    if (listadoJugadores) setJugadores(listadoJugadores)
    const { data: listadoAsistencias } = await supabase.from('asistencias').select('*').eq('torneo_id', torneo.id)
    if (listadoAsistencias) {
      const mapa: Record<string, string> = {}
      listadoAsistencias.forEach((a: any) => { mapa[a.jugador_id] = a.estado })
      setAsistencias(mapa)
    }
  }

  const cargarDatos = async () => {
    await cargarBasicos();
    const { data: listadoMazos } = await supabase.from('participaciones_mazos').select('*').eq('torneo_id', torneo.id)
    if (listadoMazos) {
      const mapaMazos: Record<string, any> = {}
      listadoMazos.forEach((m: any) => {
        if (!mapaMazos[m.jugador_id]) mapaMazos[m.jugador_id] = {}
        mapaMazos[m.jugador_id][m.slot] = m.pokemon_principal
      })
      setMazos(mapaMazos)
    }
    const { data: listadoRondas } = await supabase.from('rondas_torneo').select('*').eq('torneo_id', torneo.id).order('numero_ronda', { ascending: true })
    if (listadoRondas) {
      const mapaRondas: Record<string, any[]> = {}
      listadoRondas.forEach((r: any) => {
        if (!mapaRondas[r.jugador_id]) mapaRondas[r.jugador_id] = []
        mapaRondas[r.jugador_id].push(r)
      })
      setRondas(mapaRondas)
    }
  }

  const cambiarEstado = async (jugadorId: string, nuevoEstado: string) => {
    const estadoActual = asistencias[jugadorId]
    if (estadoActual === nuevoEstado) {
      setAsistencias(prev => { const copia = { ...prev }; delete copia[jugadorId]; return copia })
      await supabase.from('asistencias').delete().match({ torneo_id: torneo.id, jugador_id: jugadorId })
    } else {
      setAsistencias(prev => ({ ...prev, [jugadorId]: nuevoEstado }))
      await supabase.from('asistencias').upsert({ torneo_id: torneo.id, jugador_id: jugadorId, estado: nuevoEstado }, { onConflict: 'torneo_id,jugador_id' })
    }
  }

  const guardarMazo = async (jugadorId: string, slot: number, pokemon: string) => {
    setMazos(prev => ({ ...prev, [jugadorId]: { ...(prev[jugadorId] || {}), [slot]: pokemon } }))
    if (!pokemon.trim()) {
      await supabase.from('participaciones_mazos').delete().match({ torneo_id: torneo.id, jugador_id: jugadorId, slot: slot })
    } else {
      await supabase.from('participaciones_mazos').upsert({
        torneo_id: torneo.id, jugador_id: jugadorId, slot: slot, pokemon_principal: pokemon
      }, { onConflict: 'torneo_id,jugador_id,slot' })
    }
  }

  const añadirRonda = async (jugadorId: string) => {
    const rondasJugador = rondas[jugadorId] || []
    const numeroRonda = rondasJugador.length + 1
    const { data, error } = await supabase.from('rondas_torneo').insert([{
      torneo_id: torneo.id, jugador_id: jugadorId, numero_ronda: numeroRonda, oponente: '/', resultado: ''
    }]).select()
    if (!error && data) {
      setRondas(prev => ({ ...prev, [jugadorId]: [...(prev[jugadorId] || []), data[0]] }))
    }
  }

  const actualizarRonda = async (rondaId: string, jugadorId: string, campo: string, valor: string) => {
    setRondas(prev => ({
      ...prev,
      [jugadorId]: prev[jugadorId].map(r => r.id === rondaId ? { ...r, [campo]: valor } : r)
    }))
    await supabase.from('rondas_torneo').update({ [campo]: valor }).eq('id', rondaId)
  }

  const eliminarRonda = async (rondaId: string, jugadorId: string) => {
    if (!confirm("¿Borrar esta ronda?")) return;
    setRondas(prev => ({ ...prev, [jugadorId]: prev[jugadorId].filter(r => r.id !== rondaId) }))
    await supabase.from('rondas_torneo').delete().eq('id', rondaId)
  }

  const eliminarTorneo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Seguro que quieres eliminar el torneo ${torneo.nombre}?`)) return;
    const { error } = await supabase.from('torneos').delete().eq('id', torneo.id);
    if (!error) window.location.reload();
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

  const obtenerSpriteUrl = (nombrePokemon: string) => {
    if (!nombrePokemon) return null;
    const formatted = nombrePokemon.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    return `https://play.pokemonshowdown.com/sprites/dex/${formatted}.png`;
  }

  const totalVoy = Object.values(asistencias).filter(e => e === 'Voy').length;
  const totalNoVoy = Object.values(asistencias).filter(e => e === 'No voy').length;
  const totalDuda = Object.values(asistencias).filter(e => e === 'Duda').length;
  const totalRespondidos = totalVoy + totalNoVoy + totalDuda;
  const totalJugadores = jugadores.length > 0 ? jugadores.length : 11;
  const totalPendientes = Math.max(0, totalJugadores - totalRespondidos);
  
  const esAdminGlobal = usuarioEmail === ADMIN_EMAIL;

  return (
    <div className="bg-white p-5 rounded-2xl border-[3px] border-[#b67b4c] shadow-sm mb-4 relative overflow-hidden">
      
      <div onClick={() => setAbierto(!abierto)} className="cursor-pointer flex justify-between items-center relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800">{torneo.nombre}</h3>
            {esAdminGlobal && (
              <button onClick={eliminarTorneo} title="Eliminar torneo" className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer">🗑️</button>
            )}
          </div>
          <div className="flex gap-4 text-gray-500 text-sm font-medium mt-1">
            <p>📅 {torneo.fecha}</p>
            <p>📍 {torneo.lugar}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md border border-green-300">✅ {totalVoy} van</span>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-300">❌ {totalNoVoy} no</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md border border-orange-300">❓ {totalDuda} dudas</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-300">⏳ {totalPendientes} pdts</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${obtenerColorTipo(torneo.tipo)}`}>{torneo.tipo}</span>
          <span className="text-gray-400 font-bold">{abierto ? '▲' : '▼'}</span>
        </div>
      </div>

      {abierto && (
        <div className="mt-5 pt-4 border-t border-gray-200 space-y-4 relative z-10">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Convocatoria y Resultados</h4>
          {jugadores.map((jugador) => {
            const estadoActual = asistencias[jugador.id]
            const mazoJugador = mazos[jugador.id] || {}
            const rondasJugador = rondas[jugador.id] || []
            
            const esSuPerfil = usuarioEmail && usuarioEmail === jugador.email
            const puedeEditar = esAdminGlobal || esSuPerfil

            return (
              <div key={jugador.id} className={`flex flex-col py-3 px-4 rounded-xl border shadow-sm gap-3 transition-colors ${puedeEditar ? 'bg-orange-50/30 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <Link 
                    href={`/equipo/${jugador.id}`} 
                    className={`font-bold text-sm min-w-[130px] hover:underline transition-colors cursor-pointer ${puedeEditar ? 'text-[#b67b4c]' : 'text-gray-800 hover:text-[#b67b4c]'}`}
                    title={`Ver perfil de ${jugador.nombre}`}
                  >
                    {jugador.nombre} {puedeEditar && <span className="text-[10px] ml-1 bg-orange-100 text-[#b67b4c] px-1.5 py-0.5 rounded uppercase tracking-wider">Tú</span>}
                  </Link>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {puedeEditar ? (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => cambiarEstado(jugador.id, 'Voy')} className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold border-2 transition ${estadoActual === 'Voy' ? 'bg-green-600 text-white border-green-700 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-green-100 hover:border-green-400'}`}>Voy</button>
                        <button onClick={() => cambiarEstado(jugador.id, 'No voy')} className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold border-2 transition ${estadoActual === 'No voy' ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-red-100 hover:border-red-400'}`}>No voy</button>
                        <button onClick={() => cambiarEstado(jugador.id, 'Duda')} className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold border-2 transition ${estadoActual === 'Duda' ? 'bg-orange-500 text-white border-orange-600 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-orange-100 hover:border-orange-400'}`}>Duda</button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 shrink-0 cursor-not-allowed opacity-90">
                        {estadoActual === 'Voy' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 shadow-sm">Voy</span>}
                        {estadoActual === 'No voy' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 shadow-sm">No voy</span>}
                        {estadoActual === 'Duda' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 shadow-sm">Duda</span>}
                        {!estadoActual && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-300 shadow-sm">Pendiente</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 w-full xl:w-auto h-10">
                      {[1, 2].map((slot) => {
                        const mazoActual = mazoJugador[slot] || '';
                        const sprite = obtenerSpriteUrl(mazoActual);
                        
                        return puedeEditar ? (
                          <div key={slot} className="w-28 h-full">
                            <PokemonMazoInput value={mazoActual} onChange={(val: string) => guardarMazo(jugador.id, slot, val)} placeholder={`Mazo ${slot}`} />
                          </div>
                        ) : (
                          <div key={slot} className="w-10 h-10 bg-white rounded-md border border-gray-200 shadow-sm flex items-center justify-center p-1 cursor-not-allowed">
                             {sprite ? <img src={sprite} alt="Mazo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="text-[10px] text-gray-300 font-bold">?</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {estadoActual === 'Voy' && (
                  <div className="mt-2 pt-3 border-t border-gray-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">Rondas Suizo (Bo3)</span>
                      {puedeEditar && (
                        <button onClick={() => añadirRonda(jugador.id)} className="cursor-pointer text-xs font-bold text-[#b67b4c] bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition border border-orange-200">
                          + Añadir ronda
                        </button>
                      )}
                    </div>
                    
                    {rondasJugador.length > 0 ? (
                      <div className="space-y-2">
                        {rondasJugador.map((ronda) => {
                          const oponentes = (ronda.oponente || '/').split('/')
                          const op1 = oponentes[0] || ''
                          const op2 = oponentes[1] || ''
                          const spriteOp1 = obtenerSpriteUrl(op1)
                          const spriteOp2 = obtenerSpriteUrl(op2)
                          const resultadosBo3 = (ronda.resultado || "").split('')

                          // APLICAMOS LA LÓGICA DE COLORES
                          const estadoRonda = obtenerEstadoRonda(ronda.resultado || "");
                          let claseFondoRonda = puedeEditar ? 'bg-white border-gray-200' : 'bg-gray-50/50 border-gray-100';
                          
                          if (estadoRonda === 'victoria') claseFondoRonda = 'bg-green-50 border-green-400 shadow-sm';
                          else if (estadoRonda === 'derrota') claseFondoRonda = 'bg-red-50 border-red-400 shadow-sm';
                          else if (estadoRonda === 'empate') claseFondoRonda = 'bg-orange-50 border-orange-400 shadow-sm';

                          return (
                            <div key={ronda.id} className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-2 rounded-lg border gap-3 transition-colors ${claseFondoRonda}`}>
                              <span className={`text-xs font-black w-6 text-center shrink-0 ${estadoRonda !== 'pendiente' ? 'text-gray-700' : 'text-gray-400'}`}>
                                R{ronda.numero_ronda}
                              </span>
                              
                              <div className="flex items-center gap-2 flex-1 h-8">
                                {puedeEditar ? (
                                  <>
                                    <div className="w-24 h-full"><PokemonMazoInput value={op1} onChange={(val: string) => actualizarRonda(ronda.id, jugador.id, 'oponente', `${val}/${op2}`)} placeholder="Rival 1" size="small" /></div>
                                    <div className="w-24 h-full"><PokemonMazoInput value={op2} onChange={(val: string) => actualizarRonda(ronda.id, jugador.id, 'oponente', `${op1}/${val}`)} placeholder="Rival 2" size="small" /></div>
                                  </>
                                ) : (
                                  <div className="flex gap-1">
                                    {[spriteOp1, spriteOp2].map((opSprite, i) => (
                                      <div key={i} className={`w-8 h-8 border rounded-md flex items-center justify-center p-0.5 shadow-sm opacity-90 ${estadoRonda !== 'pendiente' ? 'bg-white/50 border-gray-300' : 'bg-white border-gray-200'}`}>
                                        {opSprite ? <img src={opSprite} alt="Oponente" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="text-[10px] text-gray-300 font-bold">-</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {puedeEditar ? (
                                <Bo3Selector resultado={ronda.resultado} onChange={(nuevoResult: string) => actualizarRonda(ronda.id, jugador.id, 'resultado', nuevoResult)} />
                              ) : (
                                <div className="flex gap-1 shrink-0 opacity-90">
                                  {resultadosBo3.map((res: string, i: number) => {
                                    let color = 'bg-gray-100 text-gray-400 border-gray-200'
                                    if (res === 'W') color = 'bg-green-100 text-green-700 border-green-400'
                                    if (res === 'L') color = 'bg-red-100 text-red-700 border-red-400'
                                    if (res === 'T') color = 'bg-orange-100 text-orange-700 border-orange-400'
                                    return <div key={i} className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded border shadow-sm ${color}`}>{res}</div>
                                  })}
                                </div>
                              )}

                              {puedeEditar && <button onClick={() => eliminarRonda(ronda.id, jugador.id)} className="text-gray-300 hover:text-red-500 transition px-1 shrink-0 cursor-pointer">✕</button>}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic text-center py-2">No hay rondas registradas aún.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}