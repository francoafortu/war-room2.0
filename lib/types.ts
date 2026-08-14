// Shared type definitions for War Room state

export interface StatusVar {
  id: string
  label: string
  description: string
  value: number
  max: number
}

export interface NewsItem {
  id: string
  headline: string
  country: string
  countryId: string
  coordinates: [number, number]
  side: "nato" | "csto"
}

export interface ZoneData {
  id: string
  name: string
  natoControl: number
  natoText: string
  cstoControl: number
  cstoText: string
  coordinates: [number, number]
}

export interface WarRoomState {
  id: string
  defcon_value: number
  status_vars: StatusVar[]
  breaking_news: NewsItem[]
  zones: ZoneData[]
  updated_at: string
}

export interface WarRoomLog {
  id: string
  version_number: number
  changes_summary: string
  snapshot_data: WarRoomState
  created_at: string
}

export const DEFAULT_STATUS_VARS: StatusVar[] = [
  { id: "estabilidad", label: "ESTABILIDAD ECON. PMR", description: "Salud financiera de Transnistria. Si baja de 20 → protestas civiles, moral -30%", value: 38, max: 100 },
  { id: "cobasna", label: "RIESGO COBASNA", description: "Probabilidad de detonación del arsenal de 20.000 toneladas", value: 22, max: 100 },
  { id: "opinion", label: "OPINIÓN PÚBLICA INTL.", description: "0 = Pro-OTSC  ←→  100 = Pro-OTAN. Determina legitimidad de intervención", value: 62, max: 100 },
  { id: "flujo", label: "FLUJO ENERGÉTICO", description: "Suministro gas Gazprom. <50 = resta -5 pts/turno a ESTABILIDAD", value: 48, max: 100 },
]

export const DEFAULT_NEWS: NewsItem[] = [
  {
    id: "news-1",
    headline: "TROPAS DESPLEGADAS EN LA FRONTERA",
    country: "Polonia",
    countryId: "616",
    coordinates: [19.1451, 51.9194],
    side: "nato"
  },
  {
    id: "news-2",
    headline: "MOVIMIENTO DE FLOTA EN EL MAR NEGRO",
    country: "Rusia",
    countryId: "643",
    coordinates: [37.6173, 55.7558],
    side: "csto"
  }
]

export const DEFAULT_ZONES: ZoneData[] = [
  {
    id: "zone-1",
    name: "Chisináu (Orilla Occidental)",
    natoControl: 100, natoText: "Moldavia / Pro-OTAN (100%)",
    cstoControl: 0, cstoText: "Moldavia / Pro-OTAN (100%)",
    coordinates: [28.8575, 47.0056]
  },
  {
    id: "zone-2",
    name: "Tiráspol (Orilla Oriental)",
    natoControl: 0, natoText: "Transnistria / OTSC (100%)",
    cstoControl: 100, cstoText: "Transnistria / OTSC (100%)",
    coordinates: [29.6265, 46.8364]
  },
  {
    id: "zone-3",
    name: "Puente de Dubasari",
    natoControl: 50, natoText: "Disputado (JCC - 50/50)",
    cstoControl: 50, cstoText: "Disputado (JCC - 50/50)",
    coordinates: [29.1578, 47.2683]
  },
  {
    id: "zone-4",
    name: "Zona de Seguridad (Tighina/Bender)",
    natoControl: 50, natoText: "Disputado (JCC - 50/50)",
    cstoControl: 50, cstoText: "Disputado (JCC - 50/50)",
    coordinates: [29.4754, 46.8242]
  },
  {
    id: "zone-5",
    name: "Depósito de Cobasna",
    natoControl: 0, natoText: "OTSC (90%) / Riesgo (10%)",
    cstoControl: 90, cstoText: "OTSC (90%) / Riesgo (10%)",
    coordinates: [29.1994, 47.7651]
  }
]

export const DEFAULT_DEFCON = 52
