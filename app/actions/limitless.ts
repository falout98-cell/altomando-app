"use server"
import * as cheerio from 'cheerio'

export async function obtenerTorneosLimitless(minJugadores: number) {
  try {
    const res = await fetch('https://play.limitlesstcg.com/tournaments/completed?game=PTCG', { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store' 
    })
    
    if (!res.ok) return []
    
    const html = await res.text()
    const $ = cheerio.load(html)
    const torneos: any[] = []

    $('table tbody tr').each((index, element) => {
      const fila = $(element)
      
      const aTag = fila.find('a[href*="/tournament/"]').first()
      if (!aTag.length) return
      
      const nombre = aTag.text().trim()
      const linkTorneo = 'https://play.limitlesstcg.com' + aTag.attr('href')
      
      const textosValidos = fila.find('td')
        .map((i, el) => $(el).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(t => t.length > 0)
        
      const indiceNombre = textosValidos.findIndex(t => t.includes(nombre))
      if (indiceNombre === -1) return
      
      const organizador = textosValidos[indiceNombre + 1] || "Desconocido"
      
      let jugadores = 0
      let ganador = "Desconocido"
      let linkGanador = "" // 🎯 Variable para guardar el link directo al mazo
      
      for (let i = indiceNombre + 2; i < textosValidos.length; i++) {
          const matchNum = textosValidos[i].match(/\d+/)
          if (matchNum) {
              jugadores = parseInt(matchNum[0], 10)
              ganador = textosValidos[i + 1] || "Desconocido"
              break
          }
      }

      // 🎯 MISIÓN FRANCOTIRADOR: Buscar el link exacto de la lista del ganador
      if (ganador !== "Desconocido") {
        fila.find('a').each((_, el) => {
          if ($(el).text().trim() === ganador) {
            const href = $(el).attr('href')
            if (href) {
              // Construimos el enlace directo a su perfil de ese torneo
              linkGanador = 'https://play.limitlesstcg.com' + href
            }
          }
        })
      }
      
      // Fecha
      let fecha = "RECIENTE"
      const timeAttr = fila.find('[data-time]').attr('data-time')
      if (timeAttr) {
          const timeNum = parseInt(timeAttr, 10)
          const milisegundos = timeNum > 9999999999 ? timeNum : timeNum * 1000
          const dateObj = new Date(milisegundos)
          fecha = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()
      } else if (indiceNombre > 0) {
          fecha = textosValidos[0].toUpperCase()
      }

      // Usamos el link del ganador si existe; si no, por seguridad, mandamos al torneo general
      const linkFinal = linkGanador !== "" ? linkGanador : linkTorneo

      if (jugadores >= minJugadores) {
        torneos.push({
          id: index,
          fecha,
          nombre,
          organizador,
          jugadores,
          ganador,
          link: linkFinal, // 🎯 Usamos el link infiltrado
          sprites: ["0", "0", "0"]
        })
      }
    })

    return torneos.slice(0, 15)
  } catch (error) {
    console.error("❌ El bot falló:", error)
    return []
  }
}