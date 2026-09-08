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

    // FASE 1: Extraer datos básicos
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
      let linkGanador = "" 
      
      for (let i = indiceNombre + 2; i < textosValidos.length; i++) {
          const matchNum = textosValidos[i].match(/\d+/)
          if (matchNum) {
              jugadores = parseInt(matchNum[0], 10)
              ganador = textosValidos[i + 1] || "Desconocido"
              break
          }
      }

      if (ganador !== "Desconocido") {
        fila.find('a').each((_, el) => {
          if ($(el).text().trim() === ganador) {
            const href = $(el).attr('href')
            if (href) linkGanador = 'https://play.limitlesstcg.com' + href
          }
        })
      }
      
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

      const linkFinal = linkGanador !== "" ? linkGanador : linkTorneo

      if (jugadores >= minJugadores) {
        torneos.push({
          id: index,
          fecha,
          nombre,
          organizador,
          jugadores,
          ganador,
          link: linkFinal,
          sprites: []
        })
      }
    })

    const top15 = torneos.slice(0, 15)

    // FASE 2: Infiltración Quirúrgica (Sprites reales sin mezclar clasificados)
    const torneosConSprites = await Promise.all(top15.map(async (torneo) => {
      try {
        if (!torneo.link || torneo.link === '#') return torneo

        const resJugador = await fetch(torneo.link, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
          cache: 'no-store'
        })
        
        if (!resJugador.ok) return torneo

        const htmlJugador = await resJugador.text()
        const $$ = cheerio.load(htmlJugador)
        let spritesReales: string[] = []

        // 🎯 EL TRUCO DE LA CAJA
        // Buscamos el primer sprite de la página (El Pokémon #1 del ganador)
        const primerSprite = $$('img[src*="pokemon"]').first()
        
        if (primerSprite.length > 0) {
          // Seleccionamos la "caja HTML" que envuelve a ese Pokémon
          const cajaContenedora = primerSprite.parent()
          
          // Extraemos SOLO los Pokémon que compartan esa misma caja (su mazo real)
          cajaContenedora.find('img[src*="pokemon"]').each((_, el) => {
            const src = $$(el).attr('src')
            if (src) {
              const fullSrc = src.startsWith('http') ? src : 'https://play.limitlesstcg.com' + src
              if (!spritesReales.includes(fullSrc)) {
                spritesReales.push(fullSrc)
              }
            }
          })
        }

        if (spritesReales.length === 0) {
          spritesReales = ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"]
        }

        return { ...torneo, sprites: spritesReales }
      } catch (err) {
        return torneo
      }
    }))

    return torneosConSprites

  } catch (error) {
    console.error("❌ El bot falló:", error)
    return []
  }
}