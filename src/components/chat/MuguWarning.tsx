import { AlertTriangle, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

interface MuguWarningProps {
    isVisible: boolean
    correction?: string
    explanation?: string
    onDismiss: () => void
    onAccept: (text: string) => void
}

export function MuguWarning({
    isVisible,
    correction,
    explanation,
    onDismiss,
    onAccept
}: MuguWarningProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-20 left-4 right-4 z-40"
                >
                    <div className="bg-destructive/90 backdrop-blur-md text-white p-4 rounded-lg shadow-lg border-l-4 border-yellow-400">
                        <div className="flex items-start gap-3">
                            <div className="bg-yellow-400 text-black p-1 rounded-full shrink-0">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-1">Mugu Move Detected</h4>
                                <p className="text-sm opacity-90 mb-2">{explanation}</p>
                                {correction && (
                                    <div className="bg-black/20 p-2 rounded text-sm font-mono mb-2">
                                        Start: "{correction}"
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8" onClick={onDismiss}>
                                        <X className="h-4 w-4 mr-1" /> Ignore
                                    </Button>
                                    {correction && (
                                        <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500 h-8 font-bold" onClick={() => onAccept(correction)}>
                                            <Check className="h-4 w-4 mr-1" /> Use Striker Move
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
