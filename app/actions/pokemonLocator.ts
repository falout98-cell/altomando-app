"use server"

export async function buscarTorneosOficiales() {
  try {
    console.log("⚓ Iniciando inmersión: Interceptando API de Pokémon...");

    // Calculamos las fechas: Desde hoy hasta dentro de 2 meses exactos
    const hoy = new Date();
    const fechaInicio = hoy.toISOString().split('T')[0];
    
    const dentroDeDosMeses = new Date();
    dentroDeDosMeses.setMonth(dentroDeDosMeses.getMonth() + 2);
    const fechaFin = dentroDeDosMeses.toISOString().split('T')[0];

    // Coordenadas de Cartagena, España
    const latitud = 37.6051;
    const longitud = -0.9862;
    // 50km son aproximadamente 31 millas (la API suele usar millas)
    const distanciaMillas = 31; 

    // Disparamos el Sónar hacia la API oculta de Pokémon
    // NOTA: Esta es la URL estándar de su API. Si tienen el escudo alto, nos dará error 403.
    const res = await fetch('https://events.pokemon.com/api/locator/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      // El paquete de datos con tus órdenes exactas
      body: JSON.stringify({
        latitude: latitud,
        longitude: longitud,
        distance: distanciaMillas,
        game: "tcg", // Solo cartas
        event_types: ["league_cup", "league_challenge"], 
        start_date: fechaInicio,
        end_date: fechaFin
      }),
      cache: 'no-store'
    });

    if (!res.ok) {
      console.log(`💥 ¡Impacto en el escudo anti-bots! Código: ${res.status}`);
      return [];
    }

    const datos = await res.json();
    const torneos: any[] = [];

    // Si pasamos el escudo, procesamos los eventos
    if (datos && datos.results) {
      datos.results.forEach((evento: any, index: number) => {
        torneos.push({
          id: `poke_${index}`,
          nombre: evento.name,
          fecha: evento.start_datetime,
          lugar: evento.location_name,
          tipo: evento.event_type === 'league_cup' ? 'Cup' : 'Challenge',
          distancia: evento.distance,
          direccion: evento.address
        });
      });
    }

    console.log(`🎯 Misión cumplida. Torneos oficiales detectados: ${torneos.length}`);
    return torneos;

  } catch (error) {
    console.error("❌ Fallo en los sistemas de comunicación:", error);
    return [];
  }
}