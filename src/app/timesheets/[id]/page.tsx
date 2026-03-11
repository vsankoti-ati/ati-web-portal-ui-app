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
    submission_date: Date;
    approval_date: Date;
    approved_by: string;
    entries: TimeEntry[];
}

interface TimeEntry {
    id: string;
    timesheet_id: string;
    project_id: string;
    project: Project;
    entry_date: Date;
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
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentModalAction, setCommentModalAction] = useState<'approve' | 'reject'>('approve');
    const [approverComment, setApproverComment] = useState('');

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
            .then((res) => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                    throw new Error('Unauthorized');
                }
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => setUserRole(data.role))
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                }
            });

        // Fetch timesheet details
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('Raw API response:', data);
                // Ensure entry_date values are converted to Date objects
                if (data.entries) {
                    console.log('Converting entry dates to Date objects...');
                    data.entries = data.entries.map((entry: any) => {
                        const convertedEntry = {
                            ...entry,
                            entry_date: new Date(entry.entry_date)
                        };
                        console.log(`Entry ${entry.id}: ${entry.entry_date} -> ${convertedEntry.entry_date}`);
                        return convertedEntry;
                    });
                }
                console.log('Final processed timesheet data:', data);
                setTimesheet(data);
            })
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
                // Ensure entry_date values are converted to Date objects
                if (updated.entries) {
                    updated.entries = updated.entries.map((entry: any) => ({
                        ...entry,
                        entry_date: new Date(entry.entry_date)
                    }));
                }
                setTimesheet(updated);
            }
        } catch (error) {
            console.error('Error submitting timesheet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const openCommentModal = (action: 'approve' | 'reject') => {
        setCommentModalAction(action);
        setApproverComment('');
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
        setApproverComment('');
    };

    const handleApprove = async (comment?: string) => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}/approve`, {
                method: 'PATCH',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ approver_comments: comment || '' })
            });

            if (res.ok) {
                const updated = await res.json();
                // Ensure entry_date values are converted to Date objects
                if (updated.entries) {
                    updated.entries = updated.entries.map((entry: any) => ({
                        ...entry,
                        entry_date: new Date(entry.entry_date)
                    }));
                }
                setTimesheet(updated);
                closeCommentModal();
            }
        } catch (error) {
            console.error('Error approving timesheet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (comment: string) => {
        if (!comment.trim()) {
            alert('Comment is required when rejecting a timesheet.');
            return;
        }

        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${params.id}/reject`, {
                method: 'PATCH',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ approver_comments: comment })
            });

            if (res.ok) {
                const updated = await res.json();
                // Ensure entry_date values are converted to Date objects
                if (updated.entries) {
                    updated.entries = updated.entries.map((entry: any) => ({
                        ...entry,
                        entry_date: new Date(entry.entry_date)
                    }));
                }
                setTimesheet(updated);
                closeCommentModal();
            }
        } catch (error) {
            console.error('Error rejecting timesheet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmAction = () => {
        if (commentModalAction === 'approve') {
            handleApprove(approverComment);
        } else {
            handleReject(approverComment);
        }
    };

    const getWeekDays = () => {
        if (!timesheet) return [];
        
        const startDate = new Date(timesheet.week_start_date);
        
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = startDate.getUTCDay();
        
        // Calculate the Sunday of this week
        const sunday = new Date(startDate);
        sunday.setUTCDate(startDate.getUTCDate() - dayOfWeek);
        
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(sunday);
            currentDate.setUTCDate(sunday.getUTCDate() + i);
            days.push(currentDate);
        }
        
        return days;
    };

    const formatDateToMMDD = (date: Date): string => {
        if (!date) {
            console.log('formatDateToMMDD received null/undefined date');
            return '';
        }
        
        // Ensure we have a valid Date object
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.log('formatDateToMMDD received invalid date:', date);
            return '';
        }
        
        // Extract month and day from ISO string
        const month = date.toISOString().substring(5, 7);
        const day = date.toISOString().substring(8, 10);
        const result = `${month}/${day}`;
        
        console.log(`formatDateToMMDD: ${date} -> ${result}`);
        return result;
    }

    const getEntriesForDate = (date: Date) => {
        if (!timesheet || !timesheet.entries) {
            console.log('No timesheet or entries available');
            return [];
        }
        
        console.log(`Looking for entries for UI date: ${date} (Month: ${date.getUTCMonth()}, Day: ${date.getDate()})`);
        
        // Debug: log all entry dates
        console.log('All entries with dates:', timesheet.entries.map(entry => ({
            id: entry.id,
            entry_date: entry.entry_date,
            month: entry.entry_date ? entry.entry_date.getUTCMonth() : 'null',
            day: entry.entry_date ? entry.entry_date.getDate() : 'null',
            hours: entry.hours
        })));
        
        const matchingEntries = timesheet.entries.filter(entry => {
            if (!entry.entry_date) {
                console.log(`Entry ${entry.id} has no entry_date`);
                return false;
            }
            
            // Compare dates using getUTCMonth() and getDate()
            const matches = entry.entry_date.getUTCMonth() === date.getUTCMonth() && 
                           entry.entry_date.getUTCDate() === date.getUTCDate();
            
            console.log(`Entry ${entry.id}: Month ${entry.entry_date.getUTCMonth()} vs ${date.getUTCMonth()}, Day ${entry.entry_date.getDate()} vs ${date.getDate()} - Matches: ${matches}`);
            
            return matches;
        });
        
        console.log(`Found ${matchingEntries.length} entries for date ${date}`);
        return matchingEntries;
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

    return (
        <DashboardLayout>
            {isProcessing && <LoadingSpinner fullScreen message="Processing..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/timesheets')}>
                        ← Back to Timesheets
                    </button>
                    <div className={styles.actions}>
                        {timesheet.status.toLowerCase() === 'draft' && (
                            <button className={styles.submitBtn} onClick={handleSubmit} disabled={isProcessing}>
                                {isProcessing ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        )}
                        {timesheet.status.toLowerCase() === 'submitted' && userRole === 'Admin' && (
                            <>
                                <button className={styles.rejectBtn} onClick={() => openCommentModal('reject')} disabled={isProcessing}>
                                    {isProcessing ? 'Rejecting...' : 'Reject Timesheet'}
                                </button>
                                <button className={styles.approveBtn} onClick={() => openCommentModal('approve')} disabled={isProcessing}>
                                    {isProcessing ? 'Approving...' : 'Approve Timesheet'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.timesheetCard}>
                    <div className={styles.timesheetHeader}>
                        <div>
                            <h1>Timesheet Details</h1>
                            <p className={styles.period}>
                                {new Date(timesheet.week_start_date).toISOString().split('T')[0]} - {new Date(timesheet.week_end_date).toISOString().split('T')[0]}
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
                                            <div className={styles.dayDate}>{formatDateToMMDD(day)}</div>
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

                {/* Comment Modal */}
                {showCommentModal && (
                    <div className={styles.modalOverlay} onClick={closeCommentModal}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{commentModalAction === 'approve' ? 'Approve Timesheet' : 'Reject Timesheet'}</h2>
                                <button className={styles.closeBtn} onClick={closeCommentModal}>
                                    ×
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <label>
                                    Comment {commentModalAction === 'reject' && <span className={styles.requiredAsterisk}>*</span>}
                                </label>
                                <textarea
                                    className={styles.modalTextarea}
                                    value={approverComment}
                                    onChange={(e) => setApproverComment(e.target.value)}
                                    placeholder={commentModalAction === 'approve' ? 'Add an optional comment...' : 'Please provide a reason for rejection...'}
                                    rows={5}
                                />
                                {commentModalAction === 'reject' && (
                                    <p className={styles.helpText}>
                                        Comment is required when rejecting a timesheet.
                                    </p>
                                )}
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.modalCancelBtn} onClick={closeCommentModal}>
                                    Cancel
                                </button>
                                <button 
                                    className={commentModalAction === 'approve' ? styles.modalApproveBtn : styles.modalRejectBtn}
                                    onClick={handleConfirmAction}
                                    disabled={commentModalAction === 'reject' && !approverComment.trim()}
                                >
                                    {commentModalAction === 'approve' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
