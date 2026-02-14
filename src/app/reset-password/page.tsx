'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './reset-password.module.css';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);

    useEffect(() => {
        // Get token from URL query parameter
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
            setValidatingToken(false);
        } else {
            setError('Invalid or missing reset token.');
            setValidatingToken(false);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Validate password strength (optional)
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token, 
                    new_password: newPassword 
                }),
            });

            if (res.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to reset password. The link may have expired.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    if (validatingToken) {
        return <LoadingSpinner fullScreen message="Validating reset link..." />;
    }

    return (
        <div className={styles.main}>
            {isLoading && <LoadingSpinner fullScreen message="Resetting password..." />}
            
            {success && (
                <div className={styles.toast}>
                    <span>✓</span>
                    <span>Password reset successful! Redirecting to login...</span>
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
                
                <h1 className={styles.title}>Reset Password</h1>
                
                <p className={styles.description}>
                    Enter your new password below.
                </p>

                {error && (
                    <div className={styles.errorBox}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div className={styles.successBox}>
                        <p className={styles.successMessage}>Password successfully reset!</p>
                        <p className={styles.successSubMessage}>You will be redirected to login shortly...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="newPassword" className={styles.label}>
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className={styles.input}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className={styles.submitBtn}
                            disabled={isLoading || !token}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className={styles.backLink}>
                    <a onClick={() => router.push('/login')}>
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
