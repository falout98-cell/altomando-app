"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function LoginButton() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user) {
    return (
      <div className="flex flex-col items-center gap-3 mb-8">
        <p className="text-gray-700 font-medium">
          Entrenador conectado: <span className="font-bold text-[#5B493B]">{user.user_metadata.full_name}</span>
        </p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-gray-500 underline hover:text-gray-800 transition"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
      className="mb-8 bg-white text-gray-800 font-bold px-6 py-3 rounded-xl shadow-md border-2 border-[#5B493B] hover:bg-gray-50 transition flex items-center gap-3 mx-auto"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
      Iniciar sesión con Google
    </button>
  )
}