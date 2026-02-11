'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './timesheets.module.css';

interface Timesheet {
    id: string;
    week_start_date: string;
    week_end_date: string;
    status: string;
    submission_date: string | null;
    submitter?: string;
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

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTimesheets(data);
                } else {
                    console.error('Timesheets response is not an array:', data);
                    setTimesheets([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching timesheets:', error);
                setTimesheets([]);
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading timesheets..." />;
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

                {timesheets.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No timesheets found</p>
                        <button className={styles.emptyBtn} onClick={() => router.push('/timesheets/new')}>
                            Create Your First Timesheet
                        </button>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.timesheetTable}>
                            <thead>
                                <tr>
                                    <th>Week Period</th>
                                    <th>Submitter</th>
                                    <th>Status</th>
                                    <th>Submission Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timesheets.map((ts) => (
                                    <tr key={ts.id}>
                                        <td className={styles.periodCell}>
                                            {new Date(ts.week_start_date).toLocaleDateString()} - {new Date(ts.week_end_date).toLocaleDateString()}
                                        </td>
                                        <td>{ts.submitter || 'N/A'}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[ts.status]}`}>
                                                {ts.status}
                                            </span>
                                        </td>
                                        <td>
                                            {ts.submission_date ? new Date(ts.submission_date).toLocaleDateString() : 'Not submitted'}
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => router.push(`/timesheets/${ts.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
