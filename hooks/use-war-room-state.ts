"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  WarRoomState,
  StatusVar,
  NewsItem,
  ZoneData,
  DEFAULT_STATUS_VARS,
  DEFAULT_NEWS,
  DEFAULT_ZONES,
  DEFAULT_DEFCON
} from '@/lib/types'

interface UseWarRoomStateReturn {
  defconValue: number
  statusVars: StatusVar[]
  breakingNews: NewsItem[]
  zones: ZoneData[]
  isLoading: boolean
  isConnected: boolean
  lastUpdated: string | null
  // Mutation functions (only used in admin)
  updateDefcon: (value: number) => Promise<void>
  updateStatusVar: (id: string, value: number) => Promise<void>
  addNewsItem: (item: NewsItem) => Promise<void>
  removeNewsItem: (id: string) => Promise<void>
  updateZone: (id: string, natoControl: number, cstoControl: number) => Promise<void>
  saveAndBroadcast: (summary?: string) => Promise<void>
}

export function useWarRoomState(): UseWarRoomStateReturn {
  const [defconValue, setDefconValue] = useState(DEFAULT_DEFCON)
  const [statusVars, setStatusVars] = useState<StatusVar[]>(DEFAULT_STATUS_VARS)
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>(DEFAULT_NEWS)
  const [zones, setZones] = useState<ZoneData[]>(DEFAULT_ZONES)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const stateIdRef = useRef<string | null>(null)

  // Fetch initial state from Supabase
  const fetchState = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('war_room_state')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.warn('Supabase fetch error (using defaults):', error.message)
        setIsLoading(false)
        return
      }

      if (data) {
        stateIdRef.current = data.id
        setDefconValue(data.defcon_value)
        setStatusVars(data.status_vars as StatusVar[])
        setBreakingNews(data.breaking_news as NewsItem[])
        setZones(data.zones as ZoneData[])
        setLastUpdated(data.updated_at)
      }
    } catch (err) {
      console.warn('Failed to fetch state:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to real-time changes
  useEffect(() => {
    fetchState()

    if (!isSupabaseConfigured() || !supabase) return

    const channel = supabase
      .channel('war_room_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'war_room_state' },
        (payload) => {
          const newData = payload.new as any
          setDefconValue(newData.defcon_value)
          setStatusVars(newData.status_vars as StatusVar[])
          setBreakingNews(newData.breaking_news as NewsItem[])
          setZones(newData.zones as ZoneData[])
          setLastUpdated(newData.updated_at)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchState])

  // ---- Mutation functions ----

  const updateDefcon = useCallback(async (value: number) => {
    setDefconValue(value)
  }, [])

  const updateStatusVar = useCallback(async (id: string, value: number) => {
    setStatusVars(prev => prev.map(sv => sv.id === id ? { ...sv, value } : sv))
  }, [])

  const addNewsItem = useCallback(async (item: NewsItem) => {
    setBreakingNews(prev => [...prev, item])
  }, [])

  const removeNewsItem = useCallback(async (id: string) => {
    setBreakingNews(prev => prev.filter(n => n.id !== id))
  }, [])

  const updateZone = useCallback(async (id: string, natoControl: number, cstoControl: number) => {
    setZones(prev => prev.map(z => {
      if (z.id !== id) return z
      return {
        ...z,
        natoControl,
        cstoControl,
        natoText: `OTAN (${natoControl}%)`,
        cstoText: `OTSC (${cstoControl}%)`
      }
    }))
  }, [])

  const saveAndBroadcast = useCallback(async (summary?: string) => {
    if (!isSupabaseConfigured() || !supabase || !stateIdRef.current) {
      console.warn('Supabase not configured. Changes are local only.')
      return
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('war_room_state')
      .update({
        defcon_value: defconValue,
        status_vars: statusVars,
        breaking_news: breakingNews,
        zones: zones,
        updated_at: now
      })
      .eq('id', stateIdRef.current)

    if (error) {
      console.error('Failed to save state:', error)
      return
    }

    // Log version history
    await supabase.from('war_room_logs').insert({
      changes_summary: summary || 'Manual update from admin console',
      snapshot_data: {
        defcon_value: defconValue,
        status_vars: statusVars,
        breaking_news: breakingNews,
        zones: zones
      }
    })

    setLastUpdated(now)
  }, [defconValue, statusVars, breakingNews, zones])

  return {
    defconValue,
    statusVars,
    breakingNews,
    zones,
    isLoading,
    isConnected,
    lastUpdated,
    updateDefcon,
    updateStatusVar,
    addNewsItem,
    removeNewsItem,
    updateZone,
    saveAndBroadcast
  }
}
