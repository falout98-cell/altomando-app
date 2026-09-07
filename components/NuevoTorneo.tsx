"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function NuevoTorneo() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState('')
  const [tienda, setTienda] = useState('')
  const [tipo, setTipo] = useState('Local')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioLogueado(session !== null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioLogueado(session !== null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!usuarioLogueado) return null;

  const guardarTorneo = async () => {
    if (!tienda || !fecha) return;
    
    const nombreGenerado = `${tipo} ${tienda}`;
    
    const { error } = await supabase.from('torneos').insert([{ 
      nombre: nombreGenerado, 
      fecha, 
      lugar: tienda, 
      tipo 
    }]);
    
    if (error) {
      alert("Error de la base de datos: " + error.message);
      console.error(error);
    } else {
      setAbierto(false);
      window.location.reload(); 
    }
  }

  return (
    <div className="w-full flex justify-end mb-4">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="border-[3px] border-orange-500 text-orange-600 font-black px-5 py-1 rounded-full uppercase tracking-widest hover:bg-orange-500 hover:text-white transition shadow-sm text-xs md:text-sm"
        >
          Añadir torneo +
        </button>
      ) : (
        <div className="bg-white p-5 rounded-2xl border-[3px] border-[#b67b4c] shadow-lg w-full mb-4">
          <h3 className="text-[#b67b4c] font-bold mb-4 uppercase tracking-wide text-sm">Registrar Evento</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tienda / Lugar</label>
              <input type="text" placeholder="Ej. DragonCT" className="w-full mt-1 p-2 bg-[#d9d9c2]/30 border border-gray-300 rounded-lg outline-none focus:border-[#b67b4c] text-gray-900 font-bold placeholder-gray-400" onChange={e => setTienda(e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Fecha</label>
              <input type="date" className="w-full mt-1 p-2 bg-[#d9d9c2]/30 border border-gray-300 rounded-lg outline-none focus:border-[#b67b4c] text-gray-900 font-bold" onChange={e => setFecha(e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Torneo</label>
              <select className="w-full mt-1 p-2 bg-[#d9d9c2]/30 border border-gray-300 rounded-lg outline-none focus:border-[#b67b4c] text-gray-900 font-bold" onChange={e => setTipo(e.target.value)}>
                <option value="Local">Local</option>
                <option value="Challenge">Challenge</option>
                <option value="Cup">Cup</option>
                <option value="Regional">Regional</option>
                <option value="Mundial">Mundial</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setAbierto(false)} className="px-4 py-2 text-gray-500 font-semibold text-sm hover:text-gray-800">Cancelar</button>
            <button onClick={guardarTorneo} className="px-6 py-2 bg-[#b67b4c] text-white rounded-full font-bold text-sm shadow-md hover:bg-[#9d683f]">Guardar</button>
          </div>
        </div>
      )}
    </div>
  )
}