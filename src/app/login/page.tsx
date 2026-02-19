'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './login.module.css';

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
                
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    router.push('/');
                } else {
                    setIsLoading(false);
                }
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
        <div className={styles.main}>
            {isLoading && <LoadingSpinner fullScreen message="Logging in..." />}
            <div className={styles.container}>
                <div className={styles.logoWrapper}>
                    <Image 
                        src="/thumb-ati.png" 
                        alt="ATI Company Logo" 
                        width={150} 
                        height={60}
                        style={{ objectFit: 'contain' }}
                    />
                </div>
                
                <h1 className={styles.title}>Welcome Back</h1>
                
                {error && (
                    <div className={styles.errorBox}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.forgotPasswordWrapper}>
                        <button 
                            type="button"
                            onClick={() => router.push('/forgot-password')}
                            className={styles.forgotPasswordBtn}
                        >
                            Forgot Password?
                        </button>
                    </div>
                    
                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className={styles.signupSection}>
                    <div className={styles.signupText}>
                        Don't have an account?
                    </div>
                    <button 
                        onClick={() => router.push('/signup')}
                        className={styles.signupLink}
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
}
