"use client"

import React, { useState, useEffect } from "react"
import type { StatusVar, NewsItem, ZoneData } from "@/lib/types"
import { resolveCountryId, getCountryName } from "@/lib/countries"
import { getRandomPointInCountry } from "@/lib/country-geo"

// ============================================================
// DATA
// ============================================================

const NATO_ALLIES = [
  "Estados Unidos","Reino Unido","Francia","Bélgica","Canadá",
  "Dinamarca","Islandia","Italia","Luxemburgo","Noruega",
  "Países Bajos","Portugal","Finlandia","Suecia","Polonia",
]

const CSTO_ALLIES = [
  "Rusia","Irán","China","Corea del Norte","Bielorrusia",
  "Armenia","Kazajistán","Kirguistán","Tayikistán","Serbia",
  "Siria","Afganistán",
]

// ============================================================
// STATUS COLOR HELPERS
// ============================================================

function getStatusColor(id: string, v: number): string {
  switch (id) {
    case "estabilidad":
      return v >= 60 ? "#22c55e" : v >= 40 ? "#eab308" : v >= 20 ? "#f97316" : "#ef4444"
    case "cobasna":
      return v <= 25 ? "#22c55e" : v <= 50 ? "#eab308" : v <= 75 ? "#f97316" : "#ef4444"
    case "opinion":
      return v <= 25 ? "#ef4444" : v <= 45 ? "#f97316" : v <= 55 ? "#eab308" : v <= 75 ? "#4da6ff" : "#00ff88"
    case "flujo":
      return v >= 70 ? "#22c55e" : v >= 50 ? "#eab308" : v >= 30 ? "#f97316" : "#ef4444"
    default:
      return "#4da6ff"
  }
}

// ============================================================
// DEFCON DISPLAY (exported for header)
// ============================================================

function getDefconInfo(value: number) {
  if (value <= 20) return { level: "DEFCON 5", label: "PAZ", color: "#22c55e" }
  if (value <= 40) return { level: "DEFCON 4", label: "VIGILANCIA", color: "#16a34a" }
  if (value <= 65) return { level: "DEFCON 3", label: "ALERTA", color: "#eab308" }
  if (value <= 85) return { level: "DEFCON 2", label: "MOVILIZACIÓN", color: "#f97316" }
  return { level: "DEFCON 1", label: "GUERRA", color: "#ef4444" }
}

export function DefconDisplay({ value = 52 }: { value?: number }) {
  const info = getDefconInfo(value)
  const isHigh = value > 65
  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 border rounded-sm bg-[#0a192f]/80 ${isHigh ? "animate-pulse" : ""}`}
      style={{ borderColor: `${info.color}60` }}>
      <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: info.color }}>
        {info.level}
      </span>
      <div className="w-24 h-1.5 bg-[#050914] rounded-sm overflow-hidden border border-[#1e3a8a]/20">
        <div className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: info.color, boxShadow: `0 0 6px ${info.color}50` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums whitespace-nowrap" style={{ color: info.color }}>
        {info.label}
      </span>
    </div>
  )
}

// ============================================================
// RE-EXPORT TYPES for backwards compat
// ============================================================

export type { NewsItem, ZoneData } from "@/lib/types"

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CollapsibleSection({ title, children, isOpen, onToggle, accentColor }:
  { title: string; children: React.ReactNode; isOpen: boolean; onToggle: (v: boolean) => void; accentColor?: string }) {
  return (
    <div className="border border-[#1e3a8a]/40 mb-2 rounded-sm overflow-hidden">
      <button onClick={() => onToggle(!isOpen)}
        className="w-full flex justify-between items-center px-3 py-1.5 bg-[#0a192f]/80 hover:bg-[#0f2340] uppercase text-[10px] tracking-widest font-bold transition-colors cursor-pointer"
        style={{ color: accentColor || "#4da6ff" }}>
        <span>{title}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-2 bg-[#050914]/50">{children}</div>
      </div>
    </div>
  )
}

function StatusBar({ variable, editMode, onValueChange }: { variable: StatusVar; editMode?: boolean; onValueChange?: (id: string, value: number) => void }) {
  const pct = (variable.value / variable.max) * 100
  const color = getStatusColor(variable.id, variable.value)
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-[#4da6ff] text-[9px] uppercase tracking-wider font-bold leading-tight">{variable.label}</span>
        <span className="text-[10px] font-bold tabular-nums ml-1 whitespace-nowrap" style={{ color }}>{variable.value}/{variable.max}</span>
      </div>
      <div className="w-full h-1.5 bg-[#0a192f] border border-[#1e3a8a]/20 rounded-sm overflow-hidden">
        <div className="h-full rounded-sm transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}50` }} />
      </div>
      {editMode && onValueChange ? (
        <input
          type="range"
          min={0}
          max={variable.max}
          value={variable.value}
          onChange={(e) => onValueChange(variable.id, parseInt(e.target.value))}
          className="w-full h-1 mt-1 accent-[#00ff88] cursor-pointer"
        />
      ) : (
        <p className="text-[#1e3a8a] text-[7px] mt-0.5 leading-tight tracking-wide">{variable.description}</p>
      )}
    </div>
  )
}

// ============================================================
// MAIN PANEL COMPONENT
// ============================================================

interface PanelProps {
  side: "left" | "right"
  title: string
  subtitle: string
  allies: string[]
  accentColor: string
  selectedCountry: { id: string; name: string; side: "nato" | "csto" | "neutral" } | null
  news: NewsItem[]
  activeNewsId: string | null
  onNewsItemClick: (newsId: string) => void
  zones: ZoneData[]
  activeZoneId: string | null
  onZoneItemClick: (zoneId: string) => void
  // Edit mode props
  editMode?: boolean
  statusVars?: StatusVar[]
  onStatusVarChange?: (id: string, value: number) => void
  onAddNews?: (item: NewsItem) => void
  onRemoveNews?: (id: string) => void
  onZoneControlChange?: (id: string, natoControl: number, cstoControl: number) => void
  isSelectingCoords?: boolean
  onStartCoordSelection?: () => void
  onRelocateNews?: (id: string, coords: [number, number]) => void
}

function WarRoomPanel({ side, title, subtitle, allies, accentColor, selectedCountry, news = [], activeNewsId, onNewsItemClick, zones = [], activeZoneId, onZoneItemClick, editMode, statusVars, onStatusVarChange, onAddNews, onRemoveNews, onZoneControlChange, isSelectingCoords, onStartCoordSelection, onRelocateNews }: PanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [aliadosOpen, setAliadosOpen] = useState(true)
  const [statusOpen, setStatusOpen] = useState(true)
  const [newsOpen, setNewsOpen] = useState(true)
  const [zonasOpen, setZonasOpen] = useState(true)

  // New news form state
  const [newHeadline, setNewHeadline] = useState("")
  const [newCountry, setNewCountry] = useState("")
  // True while we resolve a random point inside a country (async geo lookup).
  const [placing, setPlacing] = useState(false)

  const newsAccent = accentColor === "#4da6ff" ? "#ef4444" : "#4da6ff"

  const displayStatusVars = statusVars || [
    { id: "estabilidad", label: "ESTABILIDAD ECON. PMR", description: "Salud financiera de Transnistria. Si baja de 20 → protestas civiles, moral -30%", value: 38, max: 100 },
    { id: "cobasna", label: "RIESGO COBASNA", description: "Probabilidad de detonación del arsenal de 20.000 toneladas", value: 22, max: 100 },
    { id: "opinion", label: "OPINIÓN PÚBLICA INTL.", description: "0 = Pro-OTSC  ←→  100 = Pro-OTAN. Determina legitimidad de intervención", value: 62, max: 100 },
    { id: "flujo", label: "FLUJO ENERGÉTICO", description: "Suministro gas Gazprom. <50 = resta -5 pts/turno a ESTABILIDAD", value: 48, max: 100 },
  ]

  // Auto-open ALIADOS when a matching country is selected
  useEffect(() => {
    if (selectedCountry && allies.includes(selectedCountry.name)) {
      setAliadosOpen(true)
      if (isMinimized) setIsMinimized(false)
    }
  }, [selectedCountry, allies, isMinimized])

  // Auto-open BREAKING NEWS when an active news matches this panel
  useEffect(() => {
    if (activeNewsId && news.some(n => n.id === activeNewsId)) {
      setNewsOpen(true)
      if (isMinimized) setIsMinimized(false)
    }
  }, [activeNewsId, news, isMinimized])

  // Auto-open ZONAS when an active zone is selected
  useEffect(() => {
    if (activeZoneId && zones.some(z => z.id === activeZoneId)) {
      setZonasOpen(true)
      if (isMinimized) setIsMinimized(false)
    }
  }, [activeZoneId, zones, isMinimized])

  const handleAddNews = async () => {
    if (!newHeadline.trim() || !onAddNews || placing) return
    const newsSide: "nato" | "csto" = side === "left" ? "nato" : "csto"
    const countryId = resolveCountryId(newCountry)
    // Resolve a random point inside the chosen country (if it's recognized),
    // so the marker lands somewhere within that country automatically.
    setPlacing(true)
    let coordinates: [number, number] = [0, 0]
    if (countryId) {
      const pt = await getRandomPointInCountry(newCountry)
      if (pt) coordinates = pt
    }
    setPlacing(false)
    const item: NewsItem = {
      id: `news-${Date.now()}`,
      headline: newHeadline.toUpperCase(),
      // Use the canonical country name when recognized, otherwise the raw input.
      country: countryId ? getCountryName(countryId) : (newCountry || "Desconocido"),
      countryId: countryId || "000",
      coordinates,
      side: newsSide,
    }
    onAddNews(item)
    setNewHeadline("")
    setNewCountry("")
  }

  // Re-randomize the active (or most recent) news item's point within its country.
  const handleRelocate = async () => {
    if (!onRelocateNews || placing) return
    const target = news.find((n) => n.id === activeNewsId) || news[news.length - 1]
    if (!target) return
    const countryId = resolveCountryId(target.country)
    if (!countryId) return
    setPlacing(true)
    const pt = await getRandomPointInCountry(target.country)
    setPlacing(false)
    if (pt) onRelocateNews(target.id, pt)
  }

  /* ---------- MINIMIZED ---------- */
  if (isMinimized) {
    return (
      <div className="flex items-center justify-center cursor-pointer border border-[#1e3a8a] bg-[#0a0f1c] hover:bg-[#0f1a2e] transition-all duration-300 w-8 min-w-8 shrink-0 group"
        onClick={() => setIsMinimized(false)} title={`Expandir ${title}`}>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[#4da6ff] group-hover:text-[#00ff88] text-sm transition-colors">
            {side === "left" ? "▶" : "◀"}
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed", color: accentColor }}>
            {title}
          </span>
        </div>
      </div>
    )
  }

  /* ---------- EXPANDED ---------- */
  return (
    <div className="flex flex-col w-72 min-w-[240px] border border-[#1e3a8a] bg-[#0a0f1c] overflow-hidden transition-all duration-300 shrink-0">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-[#1e3a8a] bg-[#0a192f]/80 shrink-0">
        <div className="min-w-0 overflow-hidden">
          <h4 className="text-sm uppercase tracking-widest font-bold truncate" style={{ color: accentColor }}>{title}</h4>
          <p className="text-[#4da6ff] text-[9px] uppercase tracking-wider truncate opacity-70">{subtitle}</p>
        </div>
        <button onClick={() => setIsMinimized(true)}
          className="text-[#4da6ff] hover:text-[#00ff88] text-xs px-1 cursor-pointer shrink-0 ml-2 transition-colors"
          title="Minimizar panel">
          {side === "left" ? "◀" : "▶"}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2 war-room-scrollbar">

        {/* ALIADOS */}
        <CollapsibleSection title="ALIADOS" isOpen={aliadosOpen} onToggle={setAliadosOpen}>
          <ul className="space-y-0.5">
            {allies.map((ally, i) => {
              const isSelected = selectedCountry?.name === ally
              return (
                <li key={i}
                  className={`flex items-center gap-2 px-2 py-1 border-l-2 hover:bg-[#0f1a2e]/80 transition-all cursor-default ${isSelected ? "!bg-[#1e3a8a]/30" : ""}`}
                  style={{ borderLeftColor: isSelected ? "#00ff88" : `${accentColor}30` }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderLeftColor = accentColor }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderLeftColor = `${accentColor}30` }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? "#00ff88" : accentColor, boxShadow: `0 0 4px ${isSelected ? "#00ff88" : accentColor}` }} />
                  <span className={`text-[10px] tracking-wide transition-colors ${isSelected ? "text-[#00ff88] font-bold" : "text-[#b0b8c8] hover:text-white"}`}>
                    {ally}
                  </span>
                </li>
              )
            })}
          </ul>
        </CollapsibleSection>

        {/* STATUS */}
        <CollapsibleSection title="STATUS" isOpen={statusOpen} onToggle={setStatusOpen}>
          {displayStatusVars.map((sv) => (
            <StatusBar key={sv.id} variable={sv} editMode={editMode} onValueChange={onStatusVarChange} />
          ))}
        </CollapsibleSection>

        {/* BREAKING NEWS */}
        <CollapsibleSection title="⚠ BREAKING NEWS" isOpen={newsOpen} onToggle={setNewsOpen} accentColor={newsAccent}>
          {news.length === 0 ? (
            <p className="text-[#1e3a8a] text-[8px] uppercase tracking-widest text-center py-2">SIN REPORTES</p>
          ) : (
            <div className="space-y-1.5">
              {news.map((item) => {
                const isActive = item.id === activeNewsId
                return (
                  <div key={item.id}
                    className={`px-2 py-1.5 border rounded-sm cursor-pointer transition-all hover:bg-[#0f1a2e] ${isActive ? "news-blink" : ""}`}
                    style={{
                      borderColor: isActive ? newsAccent : `${newsAccent}30`,
                      backgroundColor: isActive ? `${newsAccent}10` : "transparent",
                    }}
                    onClick={() => onNewsItemClick(item.id)}>
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold leading-tight tracking-wide flex-1" style={{ color: newsAccent }}>
                        {item.headline}
                      </p>
                      {editMode && onRemoveNews && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveNews(item.id) }}
                          className="text-[#ef4444] hover:text-white text-[10px] ml-1 px-1 cursor-pointer"
                          title="Eliminar noticia"
                        >✕</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: newsAccent, boxShadow: isActive ? `0 0 6px ${newsAccent}` : "none" }} />
                      <span className="text-[8px] uppercase tracking-widest text-[#4da6ff] opacity-70">{item.country}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Add news form in edit mode */}
          {editMode && onAddNews && (
            <div className="mt-2 pt-2 border-t border-[#1e3a8a]/30 space-y-1.5">
              <input
                type="text"
                value={newHeadline}
                onChange={(e) => setNewHeadline(e.target.value)}
                placeholder="TITULAR DE LA NOTICIA"
                className="w-full bg-[#0a192f] border border-[#1e3a8a]/50 text-[#4da6ff] text-[9px] px-2 py-1 uppercase tracking-wider placeholder:text-[#1e3a8a] focus:border-[#00ff88] focus:outline-none"
              />
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="PAÍS (EJ. RUSIA, FRANCIA...)"
                className="w-full bg-[#0a192f] border border-[#1e3a8a]/50 text-[#4da6ff] text-[9px] px-2 py-1 uppercase tracking-wider placeholder:text-[#1e3a8a] focus:border-[#00ff88] focus:outline-none"
              />
              <p className="text-[7px] text-[#4da6ff]/60 uppercase tracking-wider leading-tight">
                El punto se fija automáticamente dentro del país al añadir.
              </p>
              <div className="flex gap-1">
                <button
                  onClick={handleRelocate}
                  disabled={placing || news.length === 0}
                  title="Genera un nuevo punto al azar dentro del país de la noticia seleccionada"
                  className="flex-1 text-[8px] uppercase tracking-widest font-bold py-1 border cursor-pointer transition-colors bg-[#0a192f] border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >🎲 {placing ? "UBICANDO..." : "RE-UBICAR"}</button>
                <button
                  onClick={handleAddNews}
                  disabled={!newHeadline.trim() || placing}
                  className="flex-1 bg-[#0a192f] border border-[#00ff88] text-[#00ff88] text-[8px] uppercase tracking-widest font-bold py-1 hover:bg-[#00ff88]/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >{placing ? "..." : "+ AÑADIR"}</button>
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* ZONAS */}
        <CollapsibleSection title="ZONAS" isOpen={zonasOpen} onToggle={setZonasOpen} accentColor="#fbbf24">
          <div className="space-y-2">
            {zones.map(zone => {
              const isActive = zone.id === activeZoneId
              const controlValue = side === "left" ? zone.natoControl : zone.cstoControl
              const textLabel = side === "left" ? zone.natoText : zone.cstoText
              
              return (
                <div key={zone.id} 
                  className={`px-2 py-1.5 border rounded-sm cursor-pointer transition-all hover:bg-[#0f1a2e] ${isActive ? "news-blink" : ""}`}
                  style={{
                    borderColor: isActive ? "#fbbf24" : "#fbbf2440",
                    backgroundColor: isActive ? "#fbbf2410" : "transparent"
                  }}
                  onClick={() => onZoneItemClick(zone.id)}>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[#fbbf24] text-[9px] font-bold uppercase tracking-wide leading-tight">
                      {zone.name}
                    </p>
                    <span className="text-[8px] font-bold text-[#fbbf24] tabular-nums whitespace-nowrap ml-1">
                      {controlValue}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#0a192f] border border-[#1e3a8a]/20 rounded-sm overflow-hidden mb-0.5">
                    <div className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{ 
                        width: `${controlValue}%`, 
                        backgroundColor: "#fbbf24", 
                        boxShadow: `0 0 4px #fbbf2480` 
                      }} />
                  </div>
                  {editMode && onZoneControlChange ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-[#4da6ff] uppercase">OTAN</span>
                        <input
                          type="range" min={0} max={100}
                          value={zone.natoControl}
                          onChange={(e) => {
                            const nato = parseInt(e.target.value)
                            onZoneControlChange(zone.id, nato, 100 - nato)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 h-1 accent-[#3b82f6] cursor-pointer"
                        />
                        <span className="text-[7px] text-[#ef4444] uppercase">OTSC</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#b0b8c8] text-[7px] uppercase tracking-wider">
                      {textLabel}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}

// ============================================================
// PRE-CONFIGURED EXPORTS
// ============================================================

interface ExternalProps {
  selectedCountry: { id: string; name: string; side: "nato" | "csto" | "neutral" } | null
  news: NewsItem[]
  activeNewsId: string | null
  onNewsItemClick: (newsId: string) => void
  zones: ZoneData[]
  activeZoneId: string | null
  onZoneItemClick: (zoneId: string) => void
  // Edit mode (optional)
  editMode?: boolean
  statusVars?: StatusVar[]
  onStatusVarChange?: (id: string, value: number) => void
  onAddNews?: (item: NewsItem) => void
  onRemoveNews?: (id: string) => void
  onZoneControlChange?: (id: string, natoControl: number, cstoControl: number) => void
  isSelectingCoords?: boolean
  onStartCoordSelection?: () => void
  onRelocateNews?: (id: string, coords: [number, number]) => void
}

export function NatoPanel(props: ExternalProps) {
  return <WarRoomPanel side="left" title="NATO / OTAN" subtitle="Allied Command East"
    allies={NATO_ALLIES} accentColor="#4da6ff" {...props} />
}

export function CstoPanel(props: ExternalProps) {
  return <WarRoomPanel side="right" title="CSTO / ВС России" subtitle="Southern Military District"
    allies={CSTO_ALLIES} accentColor="#ef4444" {...props} />
}
