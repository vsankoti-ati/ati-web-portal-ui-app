'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './timesheets.module.css';

interface Timesheet {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    submission_date: string | null;
}

export default function TimesheetsPage() {
    const router = useRouter();
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost:3001/timesheets', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setTimesheets(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Timesheet Management</h1>
                    <button className={styles.newBtn} onClick={() => router.push('/timesheets/new')}>
                        + New Timesheet
                    </button>
                </div>

                <div className={styles.grid}>
                    {timesheets.map((ts) => (
                        <div
                            key={ts.id}
                            className={styles.card}
                            onClick={() => router.push(`/timesheets/${ts.id}`)}
                        >
                            <div className={styles.cardHeader}>
                                <h3>Week of {new Date(ts.start_date).toLocaleDateString()}</h3>
                                <span className={`${styles.status} ${styles[ts.status]}`}>
                                    {ts.status}
                                </span>
                            </div>
                            <div className={styles.cardBody}>
                                <p><strong>Period:</strong> {new Date(ts.start_date).toLocaleDateString()} - {new Date(ts.end_date).toLocaleDateString()}</p>
                                {ts.submission_date && (
                                    <p><strong>Submitted:</strong> {new Date(ts.submission_date).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {timesheets.length === 0 && (
                    <div className={styles.empty}>
                        <p>No timesheets found</p>
                        <button className={styles.emptyBtn} onClick={() => router.push('/timesheets/new')}>
                            Create Your First Timesheet
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
