"use client"

import { useState } from 'react'
import { GlobeToMapTransform } from '@/components/globe-to-map-transform'
import { CstoPanel, DefconDisplay } from '@/components/war-room-panel'
import { useWarRoomState } from '@/hooks/use-war-room-state'

export default function CstoViewPage() {
  const { defconValue, statusVars, breakingNews, zones } = useWarRoomState()
  const [selectedCountry, setSelectedCountry] = useState<{ id: string; name: string; side: "nato" | "csto" | "neutral" } | null>(null)
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null)
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)

  const handleCountryClick = (id: string, name: string, side: "nato" | "csto" | "neutral") => {
    setSelectedCountry({ id, name, side })
  }
  const handleNewsClick = (newsId: string) => {
    setActiveNewsId(prev => prev === newsId ? null : newsId)
  }
  const handleZoneClick = (zoneId: string) => {
    setActiveZoneId(prev => prev === zoneId ? null : zoneId)
  }

  const cstoNews = breakingNews.filter(n => n.side === "csto")

  return (
    <div className="flex h-screen w-full bg-[#050914] font-mono selection:bg-[#00ff88]/30 p-1.5 gap-1.5">
      {/* Center — Map Area */}
      <div className="flex-1 flex flex-col min-w-0 rounded-sm overflow-clip border border-[#1e3a8a] bg-[#0a0f1c] shadow-[0_0_15px_rgba(30,58,138,0.3)]">
        {/* Header */}
        <div className="flex flex-col gap-1 px-4 py-2 border-b border-[#1e3a8a] shrink-0">
          <div className="flex justify-between items-start">
            <h3 className="text-[#00ff88] tracking-widest uppercase text-base sm:text-xl font-semibold drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]">
              War Room — CSTO Theater
            </h3>
            <DefconDisplay value={defconValue} />
          </div>
          <div className="flex justify-between items-center flex-wrap gap-1">
            <p className="text-[#4da6ff] text-[10px] sm:text-xs uppercase tracking-wider">
              Southern Military District — Real-time projection
            </p>
            <p className="text-[#ffaa00] text-[10px] sm:text-xs uppercase tracking-wider font-bold">
              STATUS: SECURE
            </p>
          </div>
        </div>

        {/* Map */}
        <div className="flex p-2 w-full flex-1 min-h-0 justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          <GlobeToMapTransform
            onCountryClick={handleCountryClick}
            newsMarkers={breakingNews}
            activeNewsId={activeNewsId}
            onNewsMarkerClick={handleNewsClick}
            zones={zones}
            activeZoneId={activeZoneId}
            onZoneMarkerClick={handleZoneClick}
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,136,0.03)_10%,transparent_100%)] opacity-50"></div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 px-4 py-2 border-t border-[#1e3a8a] shrink-0">
          <p className="text-[#1e3a8a] text-[8px] sm:text-[10px] uppercase tracking-widest">
            COORDINATE SYSTEMS: ACTIVE | ENCRYPTION: 256-BIT | VIEW: CSTO ONLY
          </p>
        </div>
      </div>

      {/* CSTO Panel */}
      <CstoPanel
        selectedCountry={selectedCountry}
        news={cstoNews}
        activeNewsId={activeNewsId}
        onNewsItemClick={handleNewsClick}
        zones={zones}
        activeZoneId={activeZoneId}
        onZoneItemClick={handleZoneClick}
        statusVars={statusVars}
      />
    </div>
  )
}
