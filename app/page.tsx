"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#050914] font-mono selection:bg-[#00ff88]/30">
      <div className="flex flex-col items-center gap-8 max-w-lg w-full px-6">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-[#00ff88] tracking-[0.3em] uppercase text-2xl sm:text-3xl font-bold drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] mb-2">
            War Room
          </h1>
          <p className="text-[#4da6ff] text-[10px] sm:text-xs uppercase tracking-[0.2em]">
            Global Theater — Multi-Interface Command System
          </p>
          <p className="text-[#1e3a8a] text-[9px] uppercase tracking-widest mt-1 tabular-nums">
            {time} UTC-5
          </p>
        </div>

        {/* Interface Links */}
        <div className="flex flex-col gap-3 w-full">

          {/* NATO */}
          <Link href="/nato" className="group block">
            <div className="border border-[#3b82f6]/40 bg-[#0a192f]/60 hover:bg-[#0c2d6b]/40 hover:border-[#3b82f6] transition-all duration-300 p-4 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#3b82f6] text-sm uppercase tracking-widest font-bold group-hover:text-[#60a5fa] transition-colors">
                    NATO / OTAN Theater
                  </h2>
                  <p className="text-[#4da6ff] text-[8px] uppercase tracking-wider mt-1 opacity-60">
                    Allied Command East — Spectator View
                  </p>
                </div>
                <span className="text-[#3b82f6] text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* CSTO */}
          <Link href="/csto" className="group block">
            <div className="border border-[#ef4444]/40 bg-[#0a192f]/60 hover:bg-[#4a0e0e]/40 hover:border-[#ef4444] transition-all duration-300 p-4 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#ef4444] text-sm uppercase tracking-widest font-bold group-hover:text-[#f87171] transition-colors">
                    CSTO / ВС России Theater
                  </h2>
                  <p className="text-[#4da6ff] text-[8px] uppercase tracking-wider mt-1 opacity-60">
                    Southern Military District — Spectator View
                  </p>
                </div>
                <span className="text-[#ef4444] text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Admin */}
          <Link href="/admin" className="group block">
            <div className="border border-[#00ff88]/40 bg-[#0a192f]/60 hover:bg-[#00ff88]/10 hover:border-[#00ff88] transition-all duration-300 p-4 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#00ff88] text-sm uppercase tracking-widest font-bold group-hover:text-[#4ade80] transition-colors">
                    🛡️ Admin — Master Control
                  </h2>
                  <p className="text-[#4da6ff] text-[8px] uppercase tracking-wider mt-1 opacity-60">
                    Full Authority — Edit Mode Enabled
                  </p>
                </div>
                <span className="text-[#00ff88] text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[#1e3a8a] text-[7px] uppercase tracking-[0.2em]">
            ENCRYPTION: 256-BIT | SUPABASE REAL-TIME SYNC | VERCEL DEPLOYMENT
          </p>
        </div>

      </div>
    </div>
  )
}
