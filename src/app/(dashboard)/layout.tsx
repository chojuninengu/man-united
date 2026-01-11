'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/helpers'
import { Plus, Search, MessageSquare, Target } from 'lucide-react'

// Mock data for initial layout
const MOCK_MISSIONS = [
    { id: '1', name: 'Samantha', stage: 'sighting', lastMsg: 'Seen at 10:30 PM' },
    { id: '2', name: 'Jessica', stage: 'blanket', lastMsg: 'Texting back now...' },
    { id: '3', name: 'Amaka', stage: 'physical', lastMsg: 'Date planned for Friday' },
]

function MissionSidebar({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex h-14 items-center border-b border-border px-4">
                <span className="font-bold">Active Missions</span>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
                    {/* Close icon only on mobile if needed, but standard sidebar behavior usually handles backdrop */}
                </Button>
            </div>

            <div className="p-4 space-y-4">
                <Button className="w-full justify-start gap-2" variant="outline">
                    <Plus className="h-4 w-4" /> New Mission
                </Button>

                <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground px-2 pb-2">
                        RECENT TARGETS
                    </div>
                    {MOCK_MISSIONS.map((mission) => (
                        <Button
                            key={mission.id}
                            variant="ghost"
                            className="w-full justify-start px-2 py-6"
                        >
                            <div className="flex items-center gap-3 w-full text-left">
                                <div className="h-2 w-2 rounded-full bg-blue-500" /> {/* Dynamic color based on stage */}
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold truncate">{mission.name}</span>
                                        {mission.stage === 'physical' && <span className="text-xs">🔥</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {mission.lastMsg}
                                    </p>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Backdrop for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <MissionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
