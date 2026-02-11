'use client';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
    message?: string;
}

export default function LoadingSpinner({ 
    size = 'medium', 
    fullScreen = false,
    message = 'Loading...'
}: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <div className={styles.fullScreenOverlay}>
                <div className={styles.spinnerContainer}>
                    <div className={`${styles.spinner} ${styles[size]}`}></div>
                    {message && <p className={styles.message}>{message}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.spinnerContainer}>
            <div className={`${styles.spinner} ${styles[size]}`}></div>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
