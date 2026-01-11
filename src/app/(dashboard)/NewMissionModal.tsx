import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { useMissions } from '@/context/MissionContext'
import { X } from 'lucide-react'

export function NewMissionModal({
    isOpen,
    onClose,
    userId
}: {
    isOpen: boolean
    onClose: () => void
    userId?: string
}) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const { refreshMissions, setActiveMission } = useMissions()
    const supabase = createClient()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase.from('missions').insert({
                user_id: user.id,
                target_name: name,
                stage: 'sighting',
                mode: 'home'
            }).select().single()

            if (error) throw error

            await refreshMissions()
            setActiveMission(data)
            onClose()
            setName('')
        } catch (e) {
            console.error(e)
            alert('Failed to start mission')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-lg p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>

                <h2 className="text-xl font-bold mb-1 text-mu-red-primary">New Operation</h2>
                <p className="text-sm text-muted-foreground mb-6">Identify the new target.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Target Name (e.g. Jessica)"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" variant="mu" className="w-full font-bold" disabled={loading}>
                        {loading ? 'Initializing...' : 'Confirm Target'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
