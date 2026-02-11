'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './timesheet-detail.module.css';

interface Timesheet {
    id: string;
    employee_id: string;
    week_start_date: string;
    week_end_date: string;
    status: string;
    entries: TimeEntry[];
}

interface TimeEntry {
    id: string;
    project_id: string;
    project: Project;
    entry_date: string;
    hours: number;
    description: string;
}

interface Project {
    id: string;
    name: string;
}

export default function TimesheetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get user profile to check role
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        // Fetch timesheet details
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setTimesheet(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router, params.id]);

    const handleSubmit = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}/submit`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setTimesheet(updated);
            }
        } catch (error) {
            console.error('Error submitting timesheet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}/approve`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setTimesheet(updated);
            }
        } catch (error) {
            console.error('Error approving timesheet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getWeekDays = () => {
        if (!timesheet) return [];
        
        const startDate = new Date(timesheet.week_start_date);
        
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = startDate.getDay();
        
        // Calculate the Sunday of this week
        const sunday = new Date(startDate);
        sunday.setDate(startDate.getDate() - dayOfWeek);
        
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(sunday);
            currentDate.setDate(sunday.getDate() + i);
            days.push(currentDate);
        }
        
        return days;
    };

    const getEntriesForDate = (date: Date) => {
        if (!timesheet || !timesheet.entries) return [];
        
        const dateStr = date.toISOString().split('T')[0];
        return timesheet.entries.filter(entry => entry.entry_date === dateStr);
    };

    const getTotalHoursForDate = (date: Date) => {
        const entries = getEntriesForDate(date);
        return entries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
    };

    const calculateTotalHours = () => {
        if (!timesheet || !timesheet.entries) return 0;
        return timesheet.entries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading timesheet details..." />;
    }

    if (!timesheet) {
        return <div className={styles.error}>Timesheet not found</div>;
    }

    const weekDays = getWeekDays();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <DashboardLayout>
            {isProcessing && <LoadingSpinner fullScreen message="Processing..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/timesheets')}>
                        ← Back to Timesheets
                    </button>
                    <div className={styles.actions}>
                        {timesheet.status === 'draft' && (
                            <button className={styles.submitBtn} onClick={handleSubmit} disabled={isProcessing}>
                                {isProcessing ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        )}
                        {timesheet.status === 'submitted' && userRole === 'Admin' && (
                            <button className={styles.approveBtn} onClick={handleApprove} disabled={isProcessing}>
                                {isProcessing ? 'Approving...' : 'Approve Timesheet'}
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.timesheetCard}>
                    <div className={styles.timesheetHeader}>
                        <div>
                            <h1>Timesheet Details</h1>
                            <p className={styles.period}>
                                {new Date(timesheet.week_start_date).toLocaleDateString()} - {new Date(timesheet.week_end_date).toLocaleDateString()}
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
                        <h2>Weekly Time Entries</h2>
                        <div className={styles.weekGrid}>
                            {weekDays.map((day, index) => {
                                const entries = getEntriesForDate(day);
                                const dayTotal = getTotalHoursForDate(day);
                                
                                return (
                                    <div key={index} className={styles.dayColumn}>
                                        <div className={styles.dayHeader}>
                                            <div className={styles.dayName}>{dayNames[day.getDay()]}</div>
                                            <div className={styles.dayDate}>{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                            {dayTotal > 0 && (
                                                <div className={styles.dayTotal}>{dayTotal} hrs</div>
                                            )}
                                        </div>
                                        <div className={styles.dayEntries}>
                                            {entries.length === 0 ? (
                                                <div className={styles.noEntries}>No entries</div>
                                            ) : (
                                                entries.map((entry) => (
                                                    <div key={entry.id} className={styles.entryCard}>
                                                        <div className={styles.entryInfo}>
                                                            <p className={styles.projectName}>{entry.project.name}</p>
                                                            {entry.description && (
                                                                <p className={styles.notes}>{entry.description}</p>
                                                            )}
                                                        </div>
                                                        <div className={styles.hours}>{entry.hours} hrs</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
