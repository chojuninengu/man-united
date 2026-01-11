'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Mission = Database['public']['Tables']['missions']['Row']

interface MissionContextType {
    activeMission: Mission | null
    setActiveMission: (mission: Mission | null) => void
    missions: Mission[]
    refreshMissions: () => Promise<void>
    loading: boolean
}

const MissionContext = createContext<MissionContextType>({
    activeMission: null,
    setActiveMission: () => { },
    missions: [],
    refreshMissions: async () => { },
    loading: false
})

export function MissionProvider({ children }: { children: React.ReactNode }) {
    const [activeMission, setActiveMission] = useState<Mission | null>(null)
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const refreshMissions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('missions')
            .select('*')
            .order('updated_at', { ascending: false })

        if (data) setMissions(data)
        setLoading(false)
    }

    // Load missions on mount
    useEffect(() => {
        refreshMissions()
    }, [])

    return (
        <MissionContext.Provider value={{
            activeMission,
            setActiveMission,
            missions,
            refreshMissions,
            loading
        }}>
            {children}
        </MissionContext.Provider>
    )
}

export const useMissions = () => useContext(MissionContext)
