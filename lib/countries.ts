// ============================================================
// SHARED COUNTRY REFERENCE DATA
// Single source of truth for country ids/names/alliances used by
// both the map (globe-to-map-transform) and the geo utility.
// ============================================================

export const NATO_IDS = new Set(["840", "826", "250", "056", "124", "208", "352", "380", "442", "578", "528", "620", "246", "752", "616"])
export const CSTO_IDS = new Set(["643", "364", "156", "408", "112", "051", "398", "417", "762", "688", "760", "004"])

export const COUNTRY_NAMES: Record<string, string> = {
  "840": "Estados Unidos", "826": "Reino Unido", "250": "Francia", "056": "Bélgica",
  "124": "Canadá", "208": "Dinamarca", "352": "Islandia", "380": "Italia",
  "442": "Luxemburgo", "578": "Noruega", "528": "Países Bajos", "620": "Portugal",
  "246": "Finlandia", "752": "Suecia", "616": "Polonia",
  "643": "Rusia", "364": "Irán", "156": "China", "408": "Corea del Norte",
  "112": "Bielorrusia", "051": "Armenia", "398": "Kazajistán", "417": "Kirguistán",
  "762": "Tayikistán", "688": "Serbia", "760": "Siria", "004": "Afganistán",
  "032": "Argentina", "036": "Australia", "076": "Brasil", "152": "Chile",
  "170": "Colombia", "818": "Egipto", "276": "Alemania", "300": "Grecia",
  "356": "India", "360": "Indonesia", "392": "Japón", "484": "México",
  "566": "Nigeria", "586": "Pakistán", "410": "Corea del Sur", "710": "Sudáfrica",
  "724": "España", "792": "Turquía", "804": "Ucrania", "862": "Venezuela",
  "012": "Argelia", "050": "Bangladés", "068": "Bolivia", "100": "Bulgaria",
  "116": "Camboya", "120": "Camerún", "144": "Sri Lanka", "178": "Congo",
  "180": "R.D. Congo", "188": "Costa Rica", "191": "Croacia", "192": "Cuba",
  "196": "Chipre", "203": "Chequia", "214": "Rep. Dominicana",
  "218": "Ecuador", "222": "El Salvador", "231": "Etiopía", "268": "Georgia",
  "288": "Ghana", "320": "Guatemala", "332": "Haití", "340": "Honduras",
  "348": "Hungría", "368": "Irak", "372": "Irlanda", "376": "Israel",
  "400": "Jordania", "404": "Kenia", "414": "Kuwait", "418": "Laos",
  "422": "Líbano", "434": "Libia", "458": "Malasia", "466": "Malí",
  "504": "Marruecos", "508": "Mozambique", "512": "Omán", "524": "Nepal",
  "554": "Nueva Zelanda", "558": "Nicaragua", "562": "Níger",
  "604": "Perú", "608": "Filipinas", "642": "Rumania", "682": "Arabia Saudita",
  "686": "Senegal", "704": "Vietnam", "716": "Zimbabue", "756": "Suiza",
  "764": "Tailandia", "784": "E.A.U.", "788": "Túnez", "800": "Uganda",
  "858": "Uruguay", "860": "Uzbekistán", "887": "Yemen", "894": "Zambia",
  "024": "Angola", "104": "Myanmar", "158": "Taiwán",
}

export function nid(id: any): string {
  return String(id || "0").padStart(3, "0")
}

export function getCountryName(id: any, fallback?: string): string {
  return COUNTRY_NAMES[nid(id)] || fallback || `País ${id}`
}

export function getCountrySide(id: any): "nato" | "csto" | "neutral" {
  const n = nid(id)
  if (NATO_IDS.has(n)) return "nato"
  if (CSTO_IDS.has(n)) return "csto"
  return "neutral"
}

// Normalize a name for tolerant matching: lowercase, strip accents/punctuation.
export function normalizeCountry(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9]/g, "") // remove spaces/punctuation
    .trim()
}

// Reverse lookup: normalized country name -> numeric id.
export const NAME_TO_ID: Record<string, string> = Object.entries(COUNTRY_NAMES).reduce(
  (acc, [id, name]) => {
    acc[normalizeCountry(name)] = id
    return acc
  },
  {} as Record<string, string>,
)

// Resolve a free-text country input to a numeric id (or null if unknown).
export function resolveCountryId(input: string): string | null {
  if (!input) return null
  return NAME_TO_ID[normalizeCountry(input)] ?? null
}
