'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './signup.module.css';

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
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
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
                setIsLoading(false);
                
                // Redirect to login after 5 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
            } else {
                setError('Signup failed');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Signup failed');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.main}>
            {isLoading && <LoadingSpinner fullScreen message="Creating account..." />}
            
            {showToast && (
                <div className={styles.toast}>
                    <span>✓</span>
                    <span>User signed up successfully! Redirecting to login...</span>
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
                
                <h1 className={styles.title}>Create Account</h1>
                <p className={styles.subtitle}>Join us today and get started</p>
                
                {error && (
                    <div className={styles.errorBox}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSignup} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
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
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="first_name" className={styles.label}>
                                First Name
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="First name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="last_name" className={styles.label}>
                                Last Name
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                placeholder="Last name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className={styles.loginSection}>
                    <div className={styles.loginText}>
                        Already have an account?
                    </div>
                    <button 
                        onClick={() => router.push('/login')}
                        className={styles.loginLink}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
