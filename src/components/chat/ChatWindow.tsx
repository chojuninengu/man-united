'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, AlertTriangle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { useChat } from '@/hooks/useChat'
import { useMissions } from '@/context/MissionContext'
import { useSearchParams } from 'next/navigation'
import { MuguWarning } from './MuguWarning'

export function ChatWindow() {
    const searchParams = useSearchParams()
    const missionId = searchParams.get('mission')
    const { activeMission } = useMissions()
    const { messages, sendMessage, loading } = useChat({ missionId })
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    // Mugu state
    const [muguState, setMuguState] = useState<{
        show: boolean
        correction?: string
        explanation?: string
    }>({ show: false })
    const [checkingMugu, setCheckingMugu] = useState(false)

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const checkMugu = async (text: string) => {
        setCheckingMugu(true)
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

            const res = await fetch('/api/mugu-check', {
                method: 'POST',
                body: JSON.stringify({ inputText: text }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)

            if (!res.ok) throw new Error('Mugu check failed')

            const data = await res.json()
            if (data.isMugu) {
                setMuguState({
                    show: true,
                    correction: data.correction,
                    explanation: data.explanation
                })
                return true
            }
        } catch (e) {
            console.error('Mugu Check timed out or failed:', e)
            // If check fails, we let it pass to avoid blocking user
        } finally {
            setCheckingMugu(false)
        }
        return false
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading || checkingMugu) return

        // Only check if length > 10 chars to avoid checking "Hi" etc.
        if (activeMission?.mode === 'home' && input.length > 10) {
            const isRisky = await checkMugu(input)
            if (isRisky) return
        }

        await sendMessage(input, activeMission?.mode || 'home')
        setInput('')
    }

    const handleAcceptMugu = (fixedText: string) => {
        setMuguState({ show: false })
        setInput(fixedText)
        // Optional: automatically send or let user review? Let's let user review.
    }


    return (
        <div className="flex flex-col h-full bg-background relative">
            <MuguWarning
                isVisible={muguState.show}
                correction={muguState.correction}
                explanation={muguState.explanation}
                onDismiss={() => {
                    setMuguState({ show: false })
                    sendMessage(input, activeMission?.mode || 'home')
                    setInput('')
                }}
                onAccept={handleAcceptMugu}
            />

            {/* Header Info */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur">
                {activeMission ? (
                    <div>
                        <div className="font-bold text-sm">{activeMission.target_name}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{activeMission.stage} STAGE</div>
                    </div>
                ) : (
                    <div>
                        <div className="font-bold text-sm text-mu-red-primary tracking-wide">HEADQUARTERS</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">GENERAL STRATEGY</div>
                    </div>
                )}
                <div className="text-xs font-mono bg-black/20 px-2 py-1 rounded">
                    MODE: {(activeMission?.mode || 'HOME').toUpperCase()}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !missionId && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-bold text-mu-red-primary tracking-tight">
                                    COMMAND CENTER
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Ask the Head Coach anything about elite social strategy.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                <div className="p-4 rounded-lg border border-border bg-card/50 text-left">
                                    <div className="text-mu-gold-primary font-bold text-xs mb-1">TACTICAL INQUIRY</div>
                                    <p className="text-xs text-muted-foreground italic">
                                        "How do I handle a girl who ghosts me after a great first date?"
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg border border-border bg-card/50 text-left">
                                    <div className="text-mu-gold-primary font-bold text-xs mb-1">CONCEPT CLARIFICATION</div>
                                    <p className="text-xs text-muted-foreground italic">
                                        "Explain the Offside Trap in a real-world social setting."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {messages.length === 0 && missionId && (
                    <div className="text-center text-muted-foreground text-sm my-10 space-y-2">
                        <p>Mission Initialized.</p>
                        <p className="text-xs opacity-70">Report the situation to the Head Coach.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <MessageBubble key={i} role={msg.role} content={msg.content} />
                ))}

                {(loading || checkingMugu) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2 animate-pulse">
                        <span className="text-mu-red-primary">●</span>
                        {checkingMugu ? "Scanning for weakness..." : "Head Coach is analyzing..."}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 p-4 border-t border-border bg-background/95 backdrop-blur z-10">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type her message or describe the situation..."
                        className="flex-1"
                        disabled={loading || checkingMugu}
                    />
                    <Button type="submit" size="icon" disabled={loading || checkingMugu || !input.trim()} variant="mu">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="text-[10px] text-center mt-2 text-muted-foreground">
                    Mugu-Shield™ Active. AI monitors for needy behavior.
                </div>
            </div>
        </div>
    )
}
