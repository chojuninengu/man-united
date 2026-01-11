import { Card } from '@/components/ui/Card'

export default function ChatPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold">Welcome to Headquarters, Recruit.</h2>
            <p className="text-muted-foreground max-w-md">
                Select an active mission from the sidebar or start a new operation to receive tactical guidance from the Head Coach.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8 w-full max-w-4xl">
                {/* Quick stats or tips could go here */}
                <Card className="p-4 bg-muted/50 border-0">
                    <h3 className="font-bold text-mu-red-secondary">SIGHTING</h3>
                    <p className="text-xs mt-1">Focus on attraction and curiosity. Do not reveal your full hand.</p>
                </Card>
                <Card className="p-4 bg-muted/50 border-0">
                    <h3 className="font-bold text-mu-gold-primary">BLANKET</h3>
                    <p className="text-xs mt-1">Build comfort and trust. Establish the "us" frame.</p>
                </Card>
                <Card className="p-4 bg-muted/50 border-0">
                    <h3 className="font-bold text-red-600">PHYSICAL</h3>
                    <p className="text-xs mt-1">Escalate with plausibility. Use the ALK protocol.</p>
                </Card>
            </div>
        </div>
    )
}
