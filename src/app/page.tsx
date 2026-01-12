import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-mu-red-primary/10 via-background to-background z-0" />

      <div className="z-10 text-center max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-mu-red-primary drop-shadow-sm">
            MAN-UNITED
          </h1>
          <p className="text-xl md:text-2xl font-light text-muted-foreground tracking-wide">
            REPUBLIC OF MEN
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-mu-gold-primary to-transparent opacity-50" />

        <div className="space-y-4">
          <p className="text-lg text-foreground/80 leading-relaxed">
            Elite social strategy mentorship powered by AI. <br />
            Master the dynamics. Control the frame.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-bold text-lg h-12 gap-2" variant="mu">
                ENTER HEADQUARTERS <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="pt-12 text-xs text-muted-foreground font-mono">
          EST. 2025 • OLD TRAFFORD PROTOCOLS
        </div>
      </div>
    </div>
  )
}
