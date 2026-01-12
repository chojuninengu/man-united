'use client'

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function UserInfoSidebar() {
    const { user, loading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdate = async () => {
        if (!user) return;
        const supabase = createClient();
        const { data, error } = await supabase.auth.updateUser({ email: email });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Successfully updated! Please check your email for confirmation.');
            setIsEditing(false);
        }
    };

    if (loading) {
        return (
            <aside className="w-80 border-l border-border bg-card p-4 hidden lg:block overflow-y-auto">
                <h2 className="font-bold text-lg mb-4 tracking-wide">OPERATIVE DATA</h2>
                <p>Loading...</p>
            </aside>
        );
    }

    return (
        <aside className="w-80 border-l border-border bg-card p-4 hidden lg:block overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg tracking-wide">OPERATIVE DATA</h2>
                {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
            </div>

            {message && <p className="text-sm text-center my-2">{message}</p>}

            <div className="space-y-3 text-sm">
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="font-semibold text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-1"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdate}>Save</Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p><span className="font-semibold text-muted-foreground">Email:</span> {user?.email}</p>
                    </>
                )}
            </div>
        </aside>
    );
}
