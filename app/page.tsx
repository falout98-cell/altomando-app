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
      .order('fecha', { ascending: false })
    
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

  // Función para guardar el torneo
  const guardarTorneo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const lugarFinal = nuevoLugar.trim() || 'Cartagena'
    
    // Enviamos la fecha directamente en el formato YYYY-MM-DD que exige Supabase
    const fechaFinal = nuevaFecha || null 
    
    const nombreGenerado = `${nuevoTipo} ${lugarFinal}`

    const { data, error } = await supabase.from('torneos').insert([{
      nombre: nombreGenerado,
      fecha: fechaFinal,
      lugar: lugarFinal,
      tipo: nuevoTipo
    }]).select()

    if (!error && data) {
      // Ordenamos para que el nuevo torneo se coloque bien en la lista
      setTorneos(prev => {
        const nuevos = [data[0], ...prev]
        return nuevos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      })
      setNuevaFecha('')
      setNuevoLugar('')
      setNuevoTipo('Challenge')
      setModalAbierto(false)
    } else {
      alert("Error al crear el torneo: " + (error?.message || "Error desconocido"))
    }
  }

  const nombreEntrenador = usuario?.user_metadata?.full_name || usuario?.email?.split('@')[0] || "Invitado"
  const avatarEntrenador = usuario?.user_metadata?.avatar_url

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Tarjeta Principal - Cuartel General */}
      <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-sm p-6 sm:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#5B493B]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gray-200/50 rounded-full blur-2xl pointer-events-none"></div>

        {/* AQUÍ ESTÁ EL CAMBIO DEL ESCUDO */}
        <div className="text-center md:text-left z-10 flex flex-col md:flex-row items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Escudo Alto Mando" 
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
          />
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-widest uppercase drop-shadow-sm">Alto Mando</h1>
            <p className="text-sm font-bold text-[#5B493B] uppercase tracking-widest mt-1">Cuartel General</p>
          </div>
        </div>

        {/* Panel de Usuario Conectado */}
        <div className="z-10 flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-xl border border-gray-200 shadow-inner">
          {avatarEntrenador ? (
            <img src={avatarEntrenador} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm object-cover border border-gray-300" />
          ) : (
            <div className="w-10 h-10 bg-[#5B493B] text-white rounded-full flex items-center justify-center font-black text-lg shadow-sm uppercase">
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
              <button 
                onClick={cerrarSesion} 
                className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors underline decoration-dashed underline-offset-4 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              <button 
                className="text-xs font-bold text-[#5B493B] hover:text-orange-700 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#5B493B]/30 shadow-sm cursor-pointer"
                onClick={iniciarSesionGoogle}
              >
                <span>Google Login</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cabecera de la sección de Torneos */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b-2 border-gray-200 pb-4">
        <h2 className="text-2xl font-black text-[#5B493B] uppercase tracking-wider">Próximos Torneos</h2>
        
        {usuario && (
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-orange-50 text-orange-600 border-2 border-orange-500 font-black px-6 py-2 rounded-full text-xs hover:bg-orange-500 hover:text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>AÑADIR TORNEO</span>
            <span className="text-lg leading-none">+</span>
          </button>
        )}
      </div>

      {/* Lista de Torneos */}
      {cargando ? (
        <div className="flex justify-center items-center h-32 text-[#5B493B] font-bold">
          Cargando torneos...
        </div>
      ) : torneos.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No hay torneos programados todavía.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {torneos.map((torneo) => (
            <TorneoCard key={torneo.id} torneo={torneo} />
          ))}
        </div>
      )}

      {/* MODAL PARA CREAR TORNEO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border-[3px] border-[#5B493B] shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">
              Programar Nuevo Torneo
            </h3>

            <form onSubmit={guardarTorneo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                {/* Aquí está el input de tipo date que abre el calendario */}
                <input 
                  type="date" 
                  value={nuevaFecha} 
                  onChange={e => setNuevaFecha(e.target.value)} 
                  className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lugar</label>
                <input 
                  type="text" 
                  value={nuevoLugar} 
                  onChange={e => setNuevoLugar(e.target.value)} 
                  placeholder="Ej. Cartagena"
                  className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Torneo</label>
                <select 
                  value={nuevoTipo} 
                  onChange={e => setNuevoTipo(e.target.value)}
                  className="w-full text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#5B493B] cursor-pointer"
                >
                  <option value="Local">Local</option>
                  <option value="Challenge">Challenge</option>
                  <option value="Cup">Cup</option>
                  <option value="Regional">Regional</option>
                  <option value="Mundial">Mundial</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-[#5B493B] hover:bg-orange-800 rounded-lg transition shadow-sm cursor-pointer"
                >
                  Guardar Torneo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
    </div>
  )
}