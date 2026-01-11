export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {children}
        </div>
    )
}
