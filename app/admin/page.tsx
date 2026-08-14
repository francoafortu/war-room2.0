"use client"

import { useState, useCallback } from 'react'
import { GlobeToMapTransform } from '@/components/globe-to-map-transform'
import { NatoPanel, CstoPanel, DefconDisplay } from '@/components/war-room-panel'
import { useWarRoomState } from '@/hooks/use-war-room-state'
import type { NewsItem } from '@/lib/types'

export default function AdminPage() {
  const {
    defconValue, statusVars, breakingNews, zones,
    isConnected, lastUpdated,
    updateDefcon, updateStatusVar, addNewsItem, removeNewsItem, updateZone, saveAndBroadcast
  } = useWarRoomState()

  const [selectedCountry, setSelectedCountry] = useState<{ id: string; name: string; side: "nato" | "csto" | "neutral" } | null>(null)
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null)
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [isSelectingCoords, setIsSelectingCoords] = useState(false)
  const [pendingNewsSide, setPendingNewsSide] = useState<"nato" | "csto">("nato")
  const [isSaving, setIsSaving] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const handleCountryClick = (id: string, name: string, side: "nato" | "csto" | "neutral") => {
    setSelectedCountry({ id, name, side })
  }
  const handleNewsClick = (newsId: string) => {
    setActiveNewsId(prev => prev === newsId ? null : newsId)
  }
  const handleZoneClick = (zoneId: string) => {
    setActiveZoneId(prev => prev === zoneId ? null : zoneId)
  }

  // Map click handler for coordinate selection
  const handleMapClick = useCallback((coords: [number, number]) => {
    if (!isSelectingCoords) return
    // Store coords for the last added news item
    setIsSelectingCoords(false)
  }, [isSelectingCoords])

  const handleStartCoordSelection = (side: "nato" | "csto") => {
    setIsSelectingCoords(true)
    setPendingNewsSide(side)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await saveAndBroadcast('Manual update from admin console')
    setIsSaving(false)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#050914] font-mono selection:bg-[#00ff88]/30">

      {/* Admin Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#00ff88]/30 bg-[#0a192f]/90 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[#00ff88] text-[10px] uppercase tracking-widest font-bold">🛡️ ADMIN CONSOLE</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] shadow-[0_0_6px_#22c55e]' : 'bg-[#ef4444] shadow-[0_0_6px_#ef4444]'}`} />
          <span className="text-[8px] uppercase tracking-wider text-[#4da6ff]">
            {isConnected ? 'REAL-TIME CONNECTED' : 'LOCAL MODE'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* DEFCON Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-widest text-[#fbbf24] font-bold">DEFCON</span>
            <input
              type="range"
              min={1}
              max={100}
              value={defconValue}
              onChange={(e) => updateDefcon(parseInt(e.target.value))}
              className="w-32 h-1 accent-[#00ff88] cursor-pointer"
            />
            <span className="text-[10px] font-bold text-[#00ff88] tabular-nums w-8">{defconValue}</span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-1 border text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all ${
              saveFlash
                ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/20'
                : 'border-[#00ff88] text-[#00ff88] bg-[#0a192f] hover:bg-[#00ff88]/20'
            } disabled:opacity-50`}
          >
            {isSaving ? '⭮ TRANSMITTING...' : saveFlash ? '✓ TRANSMITTED' : '⭮ SAVE & BROADCAST'}
          </button>
        </div>

        {lastUpdated && (
          <span className="text-[7px] uppercase tracking-wider text-[#1e3a8a]">
            LAST UPDATE: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 p-1.5 gap-1.5">
        {/* NATO Panel */}
        <NatoPanel
          selectedCountry={selectedCountry}
          news={breakingNews.filter(n => n.side === "nato")}
          activeNewsId={activeNewsId}
          onNewsItemClick={handleNewsClick}
          zones={zones}
          activeZoneId={activeZoneId}
          onZoneItemClick={handleZoneClick}
          editMode={true}
          statusVars={statusVars}
          onStatusVarChange={updateStatusVar}
          onAddNews={addNewsItem}
          onRemoveNews={removeNewsItem}
          onZoneControlChange={updateZone}
          isSelectingCoords={isSelectingCoords && pendingNewsSide === "nato"}
          onStartCoordSelection={() => handleStartCoordSelection("nato")}
        />

        {/* Center — Map Area */}
        <div className="flex-1 flex flex-col min-w-0 rounded-sm overflow-clip border border-[#1e3a8a] bg-[#0a0f1c] shadow-[0_0_15px_rgba(30,58,138,0.3)]">
          {/* Header */}
          <div className="flex flex-col gap-1 px-4 py-2 border-b border-[#1e3a8a] shrink-0">
            <div className="flex justify-between items-start">
              <h3 className="text-[#00ff88] tracking-widest uppercase text-base sm:text-xl font-semibold drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]">
                War Room — Master Control
              </h3>
              <DefconDisplay value={defconValue} />
            </div>
            <div className="flex justify-between items-center flex-wrap gap-1">
              <p className="text-[#4da6ff] text-[10px] sm:text-xs uppercase tracking-wider">
                Administrative Console — Full Authority
              </p>
              <p className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold ${isSelectingCoords ? 'text-[#fbbf24] animate-pulse' : 'text-[#ffaa00]'}`}>
                {isSelectingCoords ? '📍 CLICK MAP TO SET COORDINATES' : 'STATUS: ADMIN MODE'}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className={`flex p-2 w-full flex-1 min-h-0 justify-center items-center relative overflow-hidden ${isSelectingCoords ? 'ring-2 ring-[#fbbf24] ring-inset' : ''}`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            <GlobeToMapTransform
              onCountryClick={handleCountryClick}
              newsMarkers={breakingNews}
              activeNewsId={activeNewsId}
              onNewsMarkerClick={handleNewsClick}
              zones={zones}
              activeZoneId={activeZoneId}
              onZoneMarkerClick={handleZoneClick}
              onMapClick={isSelectingCoords ? handleMapClick : undefined}
            />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,136,0.03)_10%,transparent_100%)] opacity-50"></div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-1 px-4 py-2 border-t border-[#1e3a8a] shrink-0">
            <p className="text-[#1e3a8a] text-[8px] sm:text-[10px] uppercase tracking-widest">
              COORDINATE SYSTEMS: ACTIVE | ENCRYPTION: 256-BIT | MODE: ADMIN WRITE
            </p>
          </div>
        </div>

        {/* CSTO Panel */}
        <CstoPanel
          selectedCountry={selectedCountry}
          news={breakingNews.filter(n => n.side === "csto")}
          activeNewsId={activeNewsId}
          onNewsItemClick={handleNewsClick}
          zones={zones}
          activeZoneId={activeZoneId}
          onZoneItemClick={handleZoneClick}
          editMode={true}
          statusVars={statusVars}
          onStatusVarChange={updateStatusVar}
          onAddNews={addNewsItem}
          onRemoveNews={removeNewsItem}
          onZoneControlChange={updateZone}
          isSelectingCoords={isSelectingCoords && pendingNewsSide === "csto"}
          onStartCoordSelection={() => handleStartCoordSelection("csto")}
        />
      </div>
    </div>
  )
}
