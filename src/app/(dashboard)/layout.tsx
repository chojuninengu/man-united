'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/helpers'
import { Plus } from 'lucide-react'
import { MissionProvider, useMissions } from '@/context/MissionContext'
import { useRouter } from 'next/navigation'
import { NewMissionModal } from './NewMissionModal'

function MissionSidebar({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const { missions, activeMission, setActiveMission } = useMissions()
    const router = useRouter()
    const [showNewMission, setShowNewMission] = useState(false)

    const handleSelect = (mission: any) => {
        setActiveMission(mission)
        router.push(`/chat?mission=${mission.id}`)
        if (window.innerWidth < 768) {
            onClose()
        }
    }

    return (
        <>
            <NewMissionModal isOpen={showNewMission} onClose={() => setShowNewMission(false)} />

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-14 items-center border-b border-border px-4 bg-muted/20">
                    <span className="font-bold text-mu-red-primary tracking-wide">OPERATIONS</span>
                    <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={onClose}>
                        {/* Close icon if needed */}
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    <Button
                        className="w-full justify-start gap-2 font-bold"
                        variant="mu"
                        onClick={() => setShowNewMission(true)}
                    >
                        <Plus className="h-4 w-4" /> New Mission
                    </Button>

                    <div className="space-y-1">
                        <div className="text-xs font-bold text-muted-foreground px-2 pb-2 tracking-wider">
                            ACTIVE TARGETS
                        </div>

                        {missions.length === 0 && (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center italic">
                                No active missions.
                                <br />Start a new operation.
                            </div>
                        )}

                        {missions.map((mission) => (
                            <Button
                                key={mission.id}
                                variant={activeMission?.id === mission.id ? "secondary" : "ghost"}
                                className="w-full justify-start px-2 py-6"
                                onClick={() => handleSelect(mission)}
                            >
                                <div className="flex items-center gap-3 w-full text-left">
                                    <div className={`h-2 w-2 rounded-full ${mission.stage === 'physical' ? 'bg-red-600' :
                                        mission.stage === 'blanket' ? 'bg-mu-gold-primary' : 'bg-blue-500'
                                        }`} />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold truncate">{mission.target_name}</span>
                                            {mission.stage === 'physical' && <span className="text-xs">🔥</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate uppercase">
                                            {mission.stage}
                                        </p>
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
                {/* Backdrop for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <MissionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 relative">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MissionProvider>
            <DashboardContent>{children}</DashboardContent>
        </MissionProvider>
    )
}
