"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import { Button } from "@/components/ui/button"

// ============================================================
// COUNTRY ALLIANCE DATA
// ============================================================

const NATO_IDS = new Set(["840","826","250","056","124","208","352","380","442","578","528","620","246","752","616"])
const CSTO_IDS = new Set(["643","364","156","408","112","051","398","417","762","688","760","004"])

const COUNTRY_NAMES: Record<string, string> = {
  "840":"Estados Unidos","826":"Reino Unido","250":"Francia","056":"Bélgica",
  "124":"Canadá","208":"Dinamarca","352":"Islandia","380":"Italia",
  "442":"Luxemburgo","578":"Noruega","528":"Países Bajos","620":"Portugal",
  "246":"Finlandia","752":"Suecia","616":"Polonia",
  "643":"Rusia","364":"Irán","156":"China","408":"Corea del Norte",
  "112":"Bielorrusia","051":"Armenia","398":"Kazajistán","417":"Kirguistán",
  "762":"Tayikistán","688":"Serbia","760":"Siria","004":"Afganistán",
  "032":"Argentina","036":"Australia","076":"Brasil","152":"Chile",
  "170":"Colombia","818":"Egipto","276":"Alemania","300":"Grecia",
  "356":"India","360":"Indonesia","392":"Japón","484":"México",
  "566":"Nigeria","586":"Pakistán","410":"Corea del Sur","710":"Sudáfrica",
  "724":"España","792":"Turquía","804":"Ucrania","862":"Venezuela",
  "012":"Argelia","050":"Bangladés","068":"Bolivia","100":"Bulgaria",
  "116":"Camboya","120":"Camerún","144":"Sri Lanka","178":"Congo",
  "180":"R.D. Congo","188":"Costa Rica","191":"Croacia","192":"Cuba",
  "196":"Chipre","203":"Chequia","214":"Rep. Dominicana",
  "218":"Ecuador","222":"El Salvador","231":"Etiopía","268":"Georgia",
  "288":"Ghana","320":"Guatemala","332":"Haití","340":"Honduras",
  "348":"Hungría","368":"Irak","372":"Irlanda","376":"Israel",
  "400":"Jordania","404":"Kenia","414":"Kuwait","418":"Laos",
  "422":"Líbano","434":"Libia","458":"Malasia","466":"Malí",
  "504":"Marruecos","508":"Mozambique","512":"Omán","524":"Nepal",
  "554":"Nueva Zelanda","558":"Nicaragua","562":"Níger",
  "604":"Perú","608":"Filipinas","642":"Rumania","682":"Arabia Saudita",
  "686":"Senegal","704":"Vietnam","716":"Zimbabue","756":"Suiza",
  "764":"Tailandia","784":"E.A.U.","788":"Túnez","800":"Uganda",
  "858":"Uruguay","860":"Uzbekistán","887":"Yemen","894":"Zambia",
  "024":"Angola","104":"Myanmar","158":"Taiwán",
}

function nid(id: any): string { return String(id || "0").padStart(3, "0") }
function getCountryName(id: any, fallback?: string): string { return COUNTRY_NAMES[nid(id)] || fallback || `País ${id}` }
function getCountrySide(id: any): "nato" | "csto" | "neutral" {
  const n = nid(id); if (NATO_IDS.has(n)) return "nato"; if (CSTO_IDS.has(n)) return "csto"; return "neutral"
}
function getCountryFill(id: any): string {
  const s = getCountrySide(id); return s === "nato" ? "#0c2d6b" : s === "csto" ? "#4a0e0e" : "#071120"
}
function getCountryStroke(id: any): string {
  const s = getCountrySide(id); return s === "nato" ? "#3b82f6" : s === "csto" ? "#ef4444" : "#1e3a8a"
}
function getCountryHoverFill(id: any): string {
  const s = getCountrySide(id); return s === "nato" ? "#1e40af" : s === "csto" ? "#7f1d1d" : "#0f1a2e"
}
function getStrokeWidth(id: any): number { return getCountrySide(id) === "neutral" ? 0.4 : 0.8 }

// ============================================================
// TYPES & PROJECTION
// ============================================================

export interface NewsMarker {
  id: string
  coordinates: [number, number]
  side: "nato" | "csto"
}

export interface ZoneMarker {
  id: string
  name: string
  coordinates: [number, number]
}

interface Props {
  onCountryClick?: (id: string, name: string, side: "nato" | "csto" | "neutral") => void
  newsMarkers?: NewsMarker[]
  activeNewsId?: string | null
  onNewsMarkerClick?: (id: string) => void
  zones?: ZoneMarker[]
  activeZoneId?: string | null
  onZoneMarkerClick?: (id: string) => void
  onMapClick?: (coords: [number, number]) => void
  isPlacingPoint?: boolean
  }

function interpolateProjection(raw0: any, raw1: any) {
  const mutate: any = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y)
    const [x1, y1] = raw1(x, y)
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]
  })
  let t = 0
  return Object.assign((mutate as any)(t), {
    alpha(_: number) { return arguments.length ? (mutate as any)((t = +_)) : t },
  })
}

// ============================================================
// COMPONENT
// ============================================================

export function GlobeToMapTransform({ onCountryClick, newsMarkers = [], activeNewsId, onNewsMarkerClick, zones = [], activeZoneId, onZoneMarkerClick, onMapClick, isPlacingPoint = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState([0])
  const [worldData, setWorldData] = useState<any[]>([])
  const [rotation, setRotation] = useState([0, 0])
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState([0, 0])
  const [viewMode, setViewMode] = useState<"interactive" | "static2d">("interactive")
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; side: string } | null>(null)
  const zoomTransformRef = useRef(d3.zoomIdentity)
  // Converts a screen pixel into geographic [lon, lat] using the current projection.
  const invertRef = useRef<((clientX: number, clientY: number) => [number, number] | null) | null>(null)
  // Keep the latest "placing" state readable inside d3 event callbacks without
  // re-running the heavy draw effect every time it toggles.
  const isPlacingRef = useRef(isPlacingPoint)
  isPlacingRef.current = isPlacingPoint
  // True when the last pointer interaction was a drag/pan (so we don't treat the
  // trailing click as a point placement).
  const didDragRef = useRef(false)
  // Screen position of the last mousedown, used to measure drag distance
  // robustly (independent of React state) inside the d3 click listener.
  const downPosRef = useRef<{ x: number; y: number } | null>(null)

  const width = 800
  const height = 500

  // Load world data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        const world: any = await res.json()
        setWorldData(feature(world, world.objects.countries).features)
      } catch {
        setWorldData([{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]] }, properties: {}, id: "0" }])
      }
    }
    load()
  }, [])

  // Drag-to-rotate (interactive mode only)
  const handleMouseDown = (event: React.MouseEvent) => {
    // Reset drag tracking on every press so a clean click can place a point.
    didDragRef.current = false
    downPosRef.current = { x: event.clientX, y: event.clientY }
    if (viewMode === "static2d") return
    setIsDragging(true)
    setTooltip(null)
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) setLastMouse([event.clientX - rect.left, event.clientY - rect.top])
  }
  const handleMouseMove = (event: React.MouseEvent) => {
    if (viewMode === "static2d" || !isDragging) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const cur = [event.clientX - rect.left, event.clientY - rect.top]
    const dx = cur[0] - lastMouse[0], dy = cur[1] - lastMouse[1]
    // Classify as a drag only when the pointer has moved a meaningful TOTAL
    // distance from where it was pressed. A real human "click" always jitters
    // a few pixels between mousedown and mouseup, so a small per-move delta must
    // NOT count as a drag or it would swallow the click that places the point.
    const down = downPosRef.current
    if (down) {
      const total = Math.hypot(event.clientX - down.x, event.clientY - down.y)
      if (total > 8) didDragRef.current = true
    }
    const sensitivity = progress[0] / 100 < 0.5 ? 0.5 : 0.25
    setRotation(prev => [prev[0] + dx * sensitivity, Math.max(-90, Math.min(90, prev[1] - dy * sensitivity))])
    setLastMouse(cur)
  }
  const handleMouseUp = (event?: React.MouseEvent) => {
    setIsDragging(false)
    // Point placement: on pointer-up while in placing mode, if the pointer did
    // not travel far from where it was pressed (i.e. a tap/click, not a
    // drag/pan/rotate), drop the point exactly under the cursor. Handling this
    // on mouseup — instead of the native click — is robust because d3-zoom
    // swallows click events after any movement.
    if (!isPlacingRef.current || !event) return
    const down = downPosRef.current
    const moved = down ? Math.hypot(event.clientX - down.x, event.clientY - down.y) : 0
    if (didDragRef.current || moved > 8) return
    const coords = invertRef.current?.(event.clientX, event.clientY)
    if (coords) onMapClick?.(coords)
  }

  // ---- DRAW VISUALIZATION ----
  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    const g = svg.append("g").attr("class", "map-content")

    let projection: any
    if (viewMode === "static2d") {
      projection = d3.geoEquirectangular().scale(120).translate([width / 2, height / 2]).precision(0.1)
    } else {
      const t = progress[0] / 100
      const alpha = Math.pow(t, 0.5)
      const scale = d3.scaleLinear().domain([0, 1]).range([200, 120])
      projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
        .scale(scale(alpha)).translate([width / 2, height / 2])
        .rotate([rotation[0], rotation[1]]).precision(0.1)
      projection.alpha(alpha)
    }
    const path = d3.geoPath(projection)

    // Graticule
    try {
      const graticule = d3.geoGraticule()
      const gp = path(graticule())
      if (gp) g.append("path").datum(graticule()).attr("d", gp).attr("fill", "none")
        .attr("stroke", "#1e3a8a").attr("stroke-width", 0.5).attr("opacity", 0.4)
    } catch {}

    // Countries
    const countryPaths = g.selectAll(".country").data(worldData).enter().append("path").attr("class", "country")
      .attr("d", (d: any) => {
        try { const p = path(d); return (!p || p.includes("NaN") || p.includes("Infinity")) ? "" : p } catch { return "" }
      })
      .attr("fill", (d: any) => getCountryFill(d.id))
      .attr("stroke", (d: any) => getCountryStroke(d.id))
      .attr("stroke-width", (d: any) => getStrokeWidth(d.id))
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .style("visibility", function () {
        const p = d3.select(this).attr("d"); return p && p.length > 0 && !p.includes("NaN") ? "visible" : "hidden"
      })

    // Country hover & click events
    countryPaths
      .on("mouseenter", function (event: any, d: any) {
        const id = d.id?.toString() || ""
        d3.select(this).transition().duration(150)
          .attr("fill", getCountryHoverFill(id)).attr("stroke-width", 1.5).attr("opacity", 1)
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 35, name: getCountryName(id, d.properties?.name), side: getCountrySide(id) })
      })
      .on("mousemove", function (event: any) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top - 35 } : null)
      })
      .on("mouseleave", function (_event: any, d: any) {
        const id = d.id?.toString() || ""
        d3.select(this).transition().duration(150)
          .attr("fill", getCountryFill(id)).attr("stroke-width", getStrokeWidth(id)).attr("opacity", 0.9)
        setTooltip(null)
      })
      .on("click", function (_event: any, d: any) {
        // In placing mode, clicks are for dropping points, not selecting countries.
        if (isPlacingRef.current) return
        const id = d.id?.toString() || ""
        onCountryClick?.(nid(id), getCountryName(id, d.properties?.name), getCountrySide(id))
      })

    // Sphere outline
    try {
      const sp = path({ type: "Sphere" })
      if (sp) g.append("path").datum({ type: "Sphere" }).attr("d", sp)
        .attr("fill", "none").attr("stroke", "#1e3a8a").attr("stroke-width", 1.5).attr("opacity", 0.8)
    } catch {}

    // ---- NEWS MARKERS ----
    const projRotation = viewMode === "static2d" ? [0, 0] : rotation
    const t = progress[0] / 100
    newsMarkers.forEach((marker) => {
      // Visibility check for globe mode
      if (viewMode !== "static2d" && t < 0.7) {
        const toRad = Math.PI / 180
        const dist = d3.geoDistance(
          [marker.coordinates[0] * toRad, marker.coordinates[1] * toRad],
          [-projRotation[0] * toRad, -projRotation[1] * toRad]
        )
        if (dist > Math.PI / 2) return
      }
      const projected = projection(marker.coordinates)
      if (!projected || isNaN(projected[0]) || isNaN(projected[1])) return
      const [cx, cy] = projected
      const color = marker.side === "nato" ? "#3b82f6" : "#ef4444"
      const isActive = marker.id === activeNewsId

      const mg = g.append("g").attr("transform", `translate(${cx},${cy})`).style("cursor", "pointer")
        .on("click", () => { if (isPlacingRef.current) return; onNewsMarkerClick?.(marker.id) })

      // Base dot
      mg.append("circle").attr("r", 3).attr("fill", color).attr("opacity", isActive ? 1 : 0.8)
      // Ring
      mg.append("circle").attr("r", 6).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1).attr("opacity", isActive ? 1 : 0.5)

      if (isActive) {
        // Pulse animation
        function pulse() {
          const p = mg.append("circle").attr("r", 3).attr("fill", "none")
            .attr("stroke", color).attr("stroke-width", 2).attr("opacity", 0.9)
          p.transition().duration(1500).ease(d3.easeQuadOut).attr("r", 20).attr("opacity", 0)
            .on("end", function () { d3.select(this).remove(); pulse() })
        }
        pulse()
        // Blink center
        function blink() {
          mg.select("circle:first-child").transition().duration(400).attr("opacity", 0.2)
            .transition().duration(400).attr("opacity", 1).on("end", blink)
        }
        blink()
      }
    })

    // ---- ZONE MARKERS ----
    zones.forEach((zone) => {
      const isActive = zone.id === activeZoneId
      // El usuario solicitó que el punto amarillo de cada zona SOLO se muestre al hacer clic en el panel
      if (!isActive) return

      // Visibility check for globe mode
      if (viewMode !== "static2d" && t < 0.7) {
        const toRad = Math.PI / 180
        const dist = d3.geoDistance(
          [zone.coordinates[0] * toRad, zone.coordinates[1] * toRad],
          [-projRotation[0] * toRad, -projRotation[1] * toRad]
        )
        if (dist > Math.PI / 2) return
      }
      const projected = projection(zone.coordinates)
      if (!projected || isNaN(projected[0]) || isNaN(projected[1])) return
      const [cx, cy] = projected
      const color = "#fbbf24" // Yellow/Amber for zones

      const zg = g.append("g").attr("transform", `translate(${cx},${cy})`).style("cursor", "pointer")
        .on("click", () => { if (isPlacingRef.current) return; onZoneMarkerClick?.(zone.id) })
        .on("mouseenter", function (event: any) {
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 35, name: zone.name, side: "zone" })
        })
        .on("mousemove", function (event: any) {
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top - 35 } : null)
        })
        .on("mouseleave", function () {
          setTooltip(null)
        })

      // Base shape (Diamond)
      zg.append("path")
        .attr("d", "M 0 -4 L 4 0 L 0 4 L -4 0 Z")
        .attr("fill", color).attr("opacity", isActive ? 1 : 0.8)
      
      // Ring
      zg.append("path")
        .attr("d", "M 0 -7 L 7 0 L 0 7 L -7 0 Z")
        .attr("fill", "none").attr("stroke", color).attr("stroke-width", 1).attr("opacity", isActive ? 1 : 0.5)

      if (isActive) {
        // Pulse animation
        function pulse() {
          const p = zg.append("circle").attr("r", 5).attr("fill", "none")
            .attr("stroke", color).attr("stroke-width", 2).attr("opacity", 0.9)
          p.transition().duration(1500).ease(d3.easeQuadOut).attr("r", 25).attr("opacity", 0)
            .on("end", function () { d3.select(this).remove(); pulse() })
        }
        pulse()
        // Blink center
        function blink() {
          zg.select("path:first-child").transition().duration(400).attr("opacity", 0.2)
            .transition().duration(400).attr("opacity", 1).on("end", blink)
        }
        blink()
      }
    })

    // D3 Zoom (static2d only). IMPORTANT: while placing a point we must NOT
    // attach d3-zoom, because d3-zoom calls stopImmediatePropagation on pointer
    // events, which prevents React's onMouseUp (our placement handler) from ever
    // firing. Disabling pan/zoom during placement lets a plain click drop a point
    // reliably; zoom/pan is restored the moment placing mode ends.
    if (viewMode === "static2d" && !isPlacingPoint) {
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          zoomTransformRef.current = event.transform
          svg.select("g.map-content").attr("transform", event.transform.toString())
        })
      svg.call(zoomBehavior)
      svg.call(zoomBehavior.transform, zoomTransformRef.current)
    } else {
      svg.on(".zoom", null)
    }
    // Converter: screen (client) pixel -> geographic [lon, lat] using current projection.
    invertRef.current = (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return null
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      const mapX = (clientX - rect.left) * scaleX
      const mapY = (clientY - rect.top) * scaleY
      // Undo the current zoom/pan transform (applied to g.map-content in 2D mode).
      // With no zoom this is d3.zoomIdentity, so invert() is a no-op.
      const [tx, ty] = zoomTransformRef.current.invert([mapX, mapY])
      const inverted = projection.invert?.([tx, ty])
      if (inverted && !isNaN(inverted[0]) && !isNaN(inverted[1])) {
        return inverted as [number, number]
      }
      return null
    }

    // NOTE: point placement is handled in handleMouseUp (a React pointer-up
    // handler), NOT via a d3 "click" listener. d3-zoom suppresses the native
    // click event whenever the pointer moves even a pixel, which made placement
    // unreliable. Handling mouseup ourselves works in every view mode.
  }, [worldData, progress, rotation, viewMode, newsMarkers, activeNewsId, onCountryClick, onNewsMarkerClick, zones, activeZoneId, onZoneMarkerClick, onMapClick, isPlacingPoint])

  // Animate globe ↔ map
  const handleAnimate = () => {
    if (isAnimating) return
    setIsAnimating(true)
    const start = progress[0], end = start === 0 ? 100 : 0, dur = 2000, t0 = Date.now()
    const animate = () => {
      const elapsed = Date.now() - t0, t = Math.min(elapsed / dur, 1)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setProgress([start + (end - start) * eased])
      if (t < 1) requestAnimationFrame(animate); else setIsAnimating(false)
    }
    animate()
  }

  const handleReset = () => {
    setRotation([0, 0])
    zoomTransformRef.current = d3.zoomIdentity
    if (viewMode === "static2d" && svgRef.current) {
      const svg = d3.select(svgRef.current)
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 8])
        .on("zoom", (event) => { zoomTransformRef.current = event.transform; svg.select("g.map-content").attr("transform", event.transform.toString()) })
      svg.call(zoomBehavior.transform, d3.zoomIdentity)
    }
  }

  const handleToggle2D = () => {
    if (isAnimating) return
    if (viewMode === "static2d") {
      zoomTransformRef.current = d3.zoomIdentity
      setViewMode("interactive")
      setProgress([0])
      setRotation([0, 0])
    } else {
      setViewMode("static2d")
    }
  }

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full font-mono">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`}
        className={`w-full h-full border border-[#1e3a8a]/50 rounded-sm bg-transparent ${isPlacingPoint ? "cursor-crosshair" : viewMode === "static2d" ? "cursor-move" : "cursor-grab active:cursor-grabbing"}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={() => { handleMouseUp(); setTooltip(null) }}
        style={{ filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))" }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-20 px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider font-bold border whitespace-nowrap"
          style={{
            left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)",
            backgroundColor: "#0a192fdd", backdropFilter: "blur(4px)",
            borderColor: tooltip.side === "nato" ? "#3b82f6" : tooltip.side === "csto" ? "#ef4444" : tooltip.side === "zone" ? "#fbbf24" : "#1e3a8a",
            color: tooltip.side === "nato" ? "#60a5fa" : tooltip.side === "csto" ? "#f87171" : tooltip.side === "zone" ? "#fbbf24" : "#4da6ff",
          }}
        >{tooltip.name}</div>
      )}

      {/* Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 flex-wrap justify-end">
        {viewMode === "interactive" && (
          <Button onClick={handleAnimate} disabled={isAnimating}
            className="cursor-pointer min-w-[120px] rounded-none bg-[#0a192f] border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/20 hover:text-[#00ff88] uppercase text-xs tracking-widest font-bold">
            {isAnimating ? "PROCESSING..." : progress[0] === 0 ? "DEPLOY MAP" : "REVERT GLOBE"}
          </Button>
        )}
        <Button onClick={handleToggle2D}
          className="cursor-pointer min-w-[100px] rounded-none bg-[#0a192f] border border-[#4da6ff] text-[#4da6ff] hover:bg-[#4da6ff]/20 hover:text-[#4da6ff] uppercase text-xs tracking-widest font-bold">
          {viewMode === "static2d" ? "GLOBE VIEW" : "2D MAP"}
        </Button>
        <Button onClick={handleReset} variant="outline"
          className="cursor-pointer min-w-[80px] rounded-none bg-[#0a192f] border border-[#ffaa00] text-[#ffaa00] hover:bg-[#ffaa00]/20 hover:text-[#ffaa00] uppercase text-xs tracking-widest font-bold">
          RESET
        </Button>
      </div>
    </div>
  )
}
