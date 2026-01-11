import { cn } from "@/lib/utils/helpers"
import { CoachAvatar } from "./CoachAvatar"
import ReactMarkdown from 'react-markdown' // Would need to install this if we want rich text, for now standard text

export function MessageBubble({
    role,
    content
}: {
    role: 'user' | 'assistant'
    content: string
}) {
    const isUser = role === 'user'

    return (
        <div className={cn(
            "flex w-full gap-2 px-2 py-4",
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            {!isUser && <CoachAvatar className="mt-1" />}

            <div className={cn(
                "max-w-[85%] rounded-lg p-3 text-sm shadow-sm whitespace-pre-wrap",
                isUser
                    ? "bg-mu-red-primary text-white ml-auto rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border border-border"
            )}>
                {/* We can improve parsing of the 3-part response later with specific UI blocks */}
                {content}
            </div>
        </div>
    )
}
