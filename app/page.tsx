"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TorneoCard from '../components/TorneoCard'

export default function Home() {
  const [torneos, setTorneos] = useState<any[]>([])
  const [usuario, setUsuario] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  // Estados para controlar el modal de crear torneo
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoLugar, setNuevoLugar] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState('Challenge')

  // Estados para el Calendario interactivo
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [torneosDiaSeleccionado, setTorneosDiaSeleccionado] = useState<any[] | null>(null)

  // Estado para el acordeón de torneos pasados
  const [mostrarPasados, setMostrarPasados] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user || null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null)
    })

    cargarTorneos()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const cargarTorneos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('torneos')
      .select('*')
    
    if (!error && data) {
      setTorneos(data)
    }
    setCargando(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const iniciarSesionGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      alert("Error al iniciar sesión con Google: " + error.message)
    }
  }

  const guardarTorneo = async (e: React.FormEvent) => {
    e.preventDefault()
    const lugarFinal = nuevoLugar.trim() || 'Cartagena'
    const fechaFinal = nuevaFecha || null 
    const nombreGenerado = `${nuevoTipo} ${lugarFinal}`

    const { data, error } = await supabase.from('torneos').insert([{
      nombre: nombreGenerado,
      fecha: fechaFinal,
      lugar: lugarFinal,
      tipo: nuevoTipo
    }]).select()

    if (!error && data) {
      setTorneos(prev => [...prev, data[0]])
      setNuevaFecha('')
      setNuevoLugar('')
      setNuevoTipo('Challenge')
      setModalAbierto(false)
    } else {
      alert("Error al crear el torneo: " + (error?.message || "Error desconocido"))
    }
  }

  // --- LÓGICA DE FECHAS Y SEPARACIÓN DE TORNEOS ---
  // Obtenemos la fecha de hoy en formato local (YYYY-MM-DD)
  const hoy = new Date();
  // Ajuste rápido de zona horaria para evitar bailes de días
  const offset = hoy.getTimezoneOffset()
  const fechaHoyStr = new Date(hoy.getTime() - (offset*60*1000)).toISOString().split('T')[0]

  // Próximos: Fecha mayor o igual a hoy (Ordenados de más cercano a más lejano)
  const proximosTorneos = torneos
    .filter(t => (t.fecha || "") >= fechaHoyStr)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  // Pasados: Fecha menor a hoy (Ordenados del más reciente al más antiguo)
  const torneosPasados = torneos
    .filter(t => (t.fecha || "") < fechaHoyStr)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())


  // --- LÓGICA DEL CALENDARIO ---
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate()
  const diaInicioMes = new Date(anioActual, mesActual, 1).getDay()
  const celdasVacias = diaInicioMes === 0 ? 6 : diaInicioMes - 1 // Lunes como primer día

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion
    let nuevoAnio = anioActual
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio-- }
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++ }
    setMesActual(nuevoMes)
    setAnioActual(nuevoAnio)
  }

  const obtenerColorPuntito = (tipo: string) => {
    switch (tipo) {
      case 'Challenge': return 'bg-[#5B493B]'
      case 'Cup': return 'bg-blue-500'
      case 'Regional': return 'bg-purple-500'
      case 'Mundial': return 'bg-amber-500'
      default: return 'bg-gray-400'
    }
  }

  const nombreEntrenador = usuario?.user_metadata?.full_name || usuario?.email?.split('@')[0] || "Invitado"
  const avatarEntrenador = usuario?.user_metadata?.avatar_url

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* 1. TARJETA PRINCIPAL (Cuartel General) */}
      <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-sm p-6 sm:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#5B493B]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#BBAE9D]/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center md:text-left z-10 flex flex-col md:flex-row items-center gap-4">
          <img src="/logo.png" alt="Escudo Alto Mando" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-widest uppercase drop-shadow-sm">Alto Mando</h1>
            <p className="text-sm font-bold text-[#5B493B] uppercase tracking-widest mt-1">Cuartel General</p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-xl border border-gray-200 shadow-inner">
          {avatarEntrenador ? (
            <img src={avatarEntrenador} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm object-cover border border-gray-300" />
          ) : (
            <div className="w-10 h-10 bg-[#5B493B] text-[#F9F1DC] rounded-full flex items-center justify-center font-black text-lg shadow-sm uppercase">
              {nombreEntrenador.charAt(0)} 
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Entrenador conectado</span>
            <span className="text-sm font-bold text-gray-800 capitalize">{nombreEntrenador}</span>
          </div>
          
          {usuario ? (
            <>
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              <button onClick={cerrarSesion} className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors underline decoration-dashed underline-offset-4 cursor-pointer">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              <button onClick={iniciarSesionGoogle} className="text-xs font-bold text-[#5B493B] hover:text-orange-700 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#5B493B]/30 shadow-sm cursor-pointer">
                Google Login
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CALENDARIO ESTRATÉGICO */}
      <div className="bg-white rounded-2xl border-[2px] border-[#BBAE9D] shadow-sm p-5 mb-10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-[#5B493B] uppercase tracking-widest">Calendario de Operaciones</h3>
          <div className="flex items-center gap-4">
            <button onClick={() => cambiarMes(-1)} className="text-[#5B493B] font-black text-xl hover:scale-125 transition-transform cursor-pointer">&lt;</button>
            <span className="w-32 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">{nombresMeses[mesActual]} {anioActual}</span>
            <button onClick={() => cambiarMes(1)} className="text-[#5B493B] font-black text-xl hover:scale-125 transition-transform cursor-pointer">&gt;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-[10px] font-black text-[#BBAE9D] uppercase pb-2">{d}</div>
          ))}
          
          {Array.from({ length: celdasVacias }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}

          {Array.from({ length: diasEnMes }).map((_, i) => {
            const diaNum = i + 1;
            const fechaString = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
            const torneosDelDia = torneos.filter(t => t.fecha === fechaString);
            const esHoy = fechaString === fechaHoyStr;

            return (
              <div key={diaNum} className="relative group p-1">
                <button 
                  onClick={() => torneosDelDia.length > 0 && setTorneosDiaSeleccionado(torneosDelDia)}
                  className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-bold transition-all
                    ${esHoy ? 'bg-[#F9F1DC] border-2 border-[#5B493B] text-[#5B493B]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-[#BBAE9D]'}
                    ${torneosDelDia.length > 0 ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                  `}
                >
                  <span>{diaNum}</span>
                  {/* Puntitos de colores para los torneos */}
                  {torneosDelDia.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {torneosDelDia.slice(0, 3).map((t, idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${obtenerColorPuntito(t.tipo)}`}></span>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Modal de Detalle del Calendario */}
        {torneosDiaSeleccionado && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b-2 border-[#F9F1DC] pb-2 mb-4">
              <h4 className="font-black text-[#5B493B] uppercase tracking-wider">
                Misiones del día {torneosDiaSeleccionado[0].fecha}
              </h4>
              <button onClick={() => setTorneosDiaSeleccionado(null)} className="text-gray-400 hover:text-red-500 font-bold text-xl cursor-pointer">✕</button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {torneosDiaSeleccionado.map(t => (
                <div key={t.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">{t.nombre}</h5>
                    <span className="text-[10px] font-black text-gray-500 uppercase">📍 {t.lugar}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider text-white ${obtenerColorPuntito(t.tipo)}`}>
                    {t.tipo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. SECCIÓN: PRÓXIMOS TORNEOS */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b-2 border-[#BBAE9D] pb-4">
        <h2 className="text-2xl font-black text-[#5B493B] uppercase tracking-wider">Próximos Torneos</h2>
        
        {usuario && (
          <button onClick={() => setModalAbierto(true)} className="bg-[#F9F1DC] text-[#5B493B] border-2 border-[#5B493B] font-black px-6 py-2 rounded-full text-xs hover:bg-[#5B493B] hover:text-[#F9F1DC] transition-all shadow-sm flex items-center gap-2 cursor-pointer">
            <span>AÑADIR TORNEO</span>
            <span className="text-lg leading-none">+</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-32 text-[#5B493B] font-bold">Cargando inteligencia...</div>
      ) : proximosTorneos.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#BBAE9D] p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No hay misiones programadas por ahora.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {proximosTorneos.map((torneo) => (
            <TorneoCard key={torneo.id} torneo={torneo} />
          ))}
        </div>
      )}

      {/* 4. SECCIÓN: EVENTOS ANTERIORES (Acordeón) */}
      {!cargando && torneosPasados.length > 0 && (
        <div className="mt-12 mb-8">
          <button 
            onClick={() => setMostrarPasados(!mostrarPasados)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-[#F9F1DC] text-[#5B493B] border-2 border-[#BBAE9D] rounded-xl transition-all cursor-pointer font-black uppercase tracking-widest text-sm shadow-sm"
          >
            <span>Eventos Anteriores</span>
            <span className={`transform transition-transform duration-300 ${mostrarPasados ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {mostrarPasados && (
            <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-300 opacity-80 hover:opacity-100 transition-opacity">
              {torneosPasados.map((torneo) => (
                <TorneoCard key={torneo.id} torneo={torneo} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA CREAR TORNEO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Programar Nuevo Torneo</h3>
            <form onSubmit={guardarTorneo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B] cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lugar</label>
                <input type="text" value={nuevoLugar} onChange={e => setNuevoLugar(e.target.value)} placeholder="Ej. Cartagena" className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Torneo</label>
                <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B] cursor-pointer">
                  <option value="Local">Local</option>
                  <option value="Challenge">Challenge</option>
                  <option value="Cup">Cup</option>
                  <option value="Regional">Regional</option>
                  <option value="Mundial">Mundial</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg transition cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-xs font-black text-white bg-[#5B493B] hover:bg-[#BBAE9D] rounded-lg transition shadow-sm cursor-pointer">Guardar Torneo</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  )
}