'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './timesheet-detail.module.css';

interface Timesheet {
    id: string;
    employee_id: string;
    start_date: string;
    end_date: string;
    status: string;
    entries: TimeEntry[];
}

interface TimeEntry {
    id: string;
    project_id: string;
    entry_date: string;
    hours_worked: number;
    notes: string;
}

export default function TimesheetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get user profile to check role
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        // Fetch timesheet details
        fetch(`http://localhost:3001/timesheets/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setTimesheet(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router, params.id]);

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/timesheets/${params.id}/submit`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setTimesheet(updated);
            }
        } catch (error) {
            console.error('Error submitting timesheet:', error);
        }
    };

    const handleApprove = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/timesheets/${params.id}/approve`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setTimesheet(updated);
            }
        } catch (error) {
            console.error('Error approving timesheet:', error);
        }
    };

    const groupEntriesByDate = () => {
        if (!timesheet || !timesheet.entries) return {};

        const grouped: Record<string, TimeEntry[]> = {};
        timesheet.entries.forEach((entry) => {
            if (!grouped[entry.entry_date]) {
                grouped[entry.entry_date] = [];
            }
            grouped[entry.entry_date].push(entry);
        });
        return grouped;
    };

    const calculateTotalHours = () => {
        if (!timesheet || !timesheet.entries) return 0;
        return timesheet.entries.reduce((sum, entry) => sum + entry.hours_worked, 0);
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!timesheet) {
        return <div className={styles.error}>Timesheet not found</div>;
    }

    const groupedEntries = groupEntriesByDate();

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/timesheets')}>
                        ← Back to Timesheets
                    </button>
                    <div className={styles.actions}>
                        {timesheet.status === 'draft' && (
                            <button className={styles.submitBtn} onClick={handleSubmit}>
                                Submit for Approval
                            </button>
                        )}
                        {timesheet.status === 'submitted' && userRole === 'Admin' && (
                            <button className={styles.approveBtn} onClick={handleApprove}>
                                Approve Timesheet
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.timesheetCard}>
                    <div className={styles.timesheetHeader}>
                        <div>
                            <h1>Timesheet Details</h1>
                            <p className={styles.period}>
                                {new Date(timesheet.start_date).toLocaleDateString()} - {new Date(timesheet.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`${styles.status} ${styles[timesheet.status]}`}>
                            {timesheet.status}
                        </span>
                    </div>

                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <label>Total Hours</label>
                            <p className={styles.totalHours}>{calculateTotalHours()}</p>
                        </div>
                        <div className={styles.summaryItem}>
                            <label>Number of Entries</label>
                            <p>{timesheet.entries?.length || 0}</p>
                        </div>
                    </div>

                    <div className={styles.entriesSection}>
                        <h2>Time Entries</h2>
                        {Object.entries(groupedEntries).map(([date, entries]) => (
                            <div key={date} className={styles.dateGroup}>
                                <h3>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                <div className={styles.entryList}>
                                    {entries.map((entry) => (
                                        <div key={entry.id} className={styles.entryCard}>
                                            <div className={styles.entryInfo}>
                                                <p className={styles.projectName}>Project ID: {entry.project_id}</p>
                                                {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
                                            </div>
                                            <div className={styles.hours}>
                                                {entry.hours_worked} hrs
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
