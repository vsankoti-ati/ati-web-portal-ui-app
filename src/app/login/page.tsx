'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {

    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                router.push('/');
            } else {
                setError('Invalid credentials');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="main">
            {isLoading && <LoadingSpinner fullScreen message="Logging in..." />}
            <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <Image 
                        src="/thumb-ati.png" 
                        alt="ATI Company Logo" 
                        width={150} 
                        height={60}
                        style={{ objectFit: 'contain' }}
                    />
                </div>
                <h1>Login</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }} disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div style={{ marginTop: '1rem' }}>
                    <button onClick={() => router.push('/signup')}>Sign Up</button>
                </div>
            </div>
        </div>
    );
}
