'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/login');
            } else {
                setError('Signup failed');
            }
        } catch (err) {
            setError('Signup failed');
        }
    };

    return (
        <div className="main">
            <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h1>Sign Up</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input name="username" placeholder="Username" onChange={handleChange} required style={{ padding: '0.5rem' }} />
                    <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ padding: '0.5rem' }} />
                    <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ padding: '0.5rem' }} />
                    <input name="first_name" placeholder="First Name" onChange={handleChange} required style={{ padding: '0.5rem' }} />
                    <input name="last_name" placeholder="Last Name" onChange={handleChange} required style={{ padding: '0.5rem' }} />
                    <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Sign Up</button>
                </form>
                <div style={{ marginTop: '1rem' }}>
                    <button onClick={() => router.push('/login')}>Back to Login</button>
                </div>
            </div>
        </div>
    );
}
