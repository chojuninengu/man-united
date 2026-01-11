'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthActions } from '@/hooks/useAuthActions'
import { useMissions } from '@/context/MissionContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Menu, X, LogOut } from 'lucide-react'

export function ModeToggle() {
    const { activeMission, setActiveMission } = useMissions()
    const supabase = createClient()
    const [localMode, setLocalMode] = useState<'home' | 'away'>('home')

    // Use active mission mode or fallback to local
    const currentMode = activeMission?.mode || localMode

    const handleToggle = async (newMode: 'home' | 'away') => {
        setLocalMode(newMode)
        if (activeMission) {
            // Optimistic update
            setActiveMission({ ...activeMission, mode: newMode })
            // Persist
            // @ts-ignore
            await supabase.from('missions').update({ mode: newMode }).eq('id', activeMission.id)
        }
    }

    return (
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-full">
            <button
                onClick={() => handleToggle('home')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${currentMode === 'home'
                    ? 'bg-mu-red-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                🏠 HOME
            </button>
            <button
                onClick={() => handleToggle('away')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${currentMode === 'away'
                    ? 'bg-mu-gold-primary text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                🏟️ AWAY
            </button>
        </div>
    )
}

export function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
    const { signOut } = useAuthActions()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={toggleSidebar}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 font-bold text-lg text-mu-red-primary tracking-tight">
                    <span>MAN-UNITED</span>
                </div>

                <div className="flex-1" />

                <ModeToggle />

                <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    )
}
