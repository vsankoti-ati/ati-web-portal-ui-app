'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    const [showToast, setShowToast] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                // Show success toast
                setShowToast(true);
                setError('');
                
                // Redirect to login after 5 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
            } else {
                setError('Signup failed');
            }
        } catch (err) {
            setError('Signup failed');
        }
    };

    return (
        <div className="main">
            {/* Success Toast Notification */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    animation: 'slideIn 0.3s ease-out',
                    fontWeight: '600',
                    fontSize: '1rem',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>✓</span>
                    <span>User signed up successfully! Redirecting to login...</span>
                </div>
            )}

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

            {/* Keyframe animation for toast */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
