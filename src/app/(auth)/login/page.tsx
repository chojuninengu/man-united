'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { useAuthActions } from '@/hooks/useAuthActions'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { signInWithPassword, loading, error } = useAuthActions()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await signInWithPassword(email, password)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-mu-red-primary">
                        MAN-UNITED
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to access your Head Coach
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <GoogleButton />
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted-foreground/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <Input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-muted border-border text-foreground"
                            />
                        </div>
                        <div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-muted border-border text-foreground"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <Button
                            type="submit"
                            variant="mu"
                            className="w-full font-bold"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link href="/register" className="font-semibold text-mu-gold-primary hover:text-mu-gold-secondary">
                            Join the Squad
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
