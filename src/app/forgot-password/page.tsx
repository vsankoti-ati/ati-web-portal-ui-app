'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSuccess(true);
                setEmail('');
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to send reset email. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.main}>
            {isLoading && <LoadingSpinner fullScreen message="Sending reset link..." />}
            
            {success && (
                <div className={styles.toast}>
                    <span>✓</span>
                    <span>Password reset link sent! Check your email.</span>
                </div>
            )}

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
                
                <h1 className={styles.title}>Forgot Password</h1>
                
                <p className={styles.description}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                    <div className={styles.errorBox}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className={styles.successBox}>
                        If an account exists with that email, you will receive a password reset link shortly.
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className={styles.backLink}>
                    <a onClick={() => router.push('/login')}>
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
