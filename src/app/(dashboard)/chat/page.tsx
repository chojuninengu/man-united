import { Suspense } from 'react'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Mission Data...</div>}>
            <ChatWindow />
        </Suspense>
    )
}
