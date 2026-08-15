import { geoContains, geoBounds } from "d3"
import { feature } from "topojson-client"
import { nid, resolveCountryId } from "@/lib/countries"

// Cache the fetched world features so we only download the atlas once.
let featuresCache: any[] | null = null
let loadingPromise: Promise<any[]> | null = null

async function loadFeatures(): Promise<any[]> {
  if (featuresCache) return featuresCache
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    const world: any = await res.json()
    const feats = (feature(world, world.objects.countries) as any).features as any[]
    featuresCache = feats
    return feats
  })()
  return loadingPromise
}

// Returns a random [lon, lat] point that lies inside the given country's
// geometry, or null if the country can't be resolved. Uses rejection sampling
// against the country's bounding box so the point is always on land within the
// selected country.
export async function getRandomPointInCountry(countryInput: string): Promise<[number, number] | null> {
  const id = resolveCountryId(countryInput)
  if (!id) return null

  let feats: any[]
  try {
    feats = await loadFeatures()
  } catch {
    return null
  }

  const target = feats.find((f) => nid(f.id) === id)
  if (!target) return null

  // Bounding box of the country: [[west, south], [east, north]].
  const [[west, south], [rawEast, north]] = geoBounds(target)

  // Countries that cross the antimeridian (e.g. Russia) come back with
  // west > east. Unwrap the eastern edge by +360 so the longitude span is
  // continuous, then wrap sampled longitudes back into [-180, 180].
  const east = rawEast < west ? rawEast + 360 : rawEast
  const wrapLon = (lon: number) => (lon > 180 ? lon - 360 : lon)

  // Rejection sampling: pick random points inside the bbox until one lands
  // inside the country polygon.
  for (let i = 0; i < 600; i++) {
    const lon = wrapLon(west + Math.random() * (east - west))
    const lat = south + Math.random() * (north - south)
    if (geoContains(target, [lon, lat])) {
      return [lon, lat]
    }
  }

  // Fallback: the bbox center (wrapped), still a reasonable point for the country.
  return [wrapLon((west + east) / 2), (south + north) / 2]
}
