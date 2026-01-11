import { cn } from "@/lib/utils/helpers"

export function CoachAvatar({ className }: { className?: string }) {
    return (
        <div className={cn(
            "h-8 w-8 rounded-full bg-mu-red-primary flex items-center justify-center text-white border-2 border-mu-gold-secondary shadow-sm",
            className
        )}>
            <span className="font-bold text-xs" role="img" aria-label="lion">🦁</span>
        </div>
    )
}
