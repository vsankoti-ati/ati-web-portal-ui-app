'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './timesheets.module.css';

interface Timesheet {
    id: string;
    user_id: string;
    week_start_date: string;
    week_end_date: string;
    status: string;
    submission_date: string | null;
    submitter?: string;
    approver_comments?: string;
}

export default function TimesheetsPage() {
    const router = useRouter();
    const [myTimesheets, setMyTimesheets] = useState<Timesheet[]>([]);
    const [allTimesheets, setAllTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [adminFilter, setAdminFilter] = useState<'submitted' | 'approved' | 'rejected'>('submitted');
    const [myCurrentPage, setMyCurrentPage] = useState(1);
    const [adminCurrentPage, setAdminCurrentPage] = useState(1);
    const pageSize = 5;
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelTimesheetId, setCancelTimesheetId] = useState<string | null>(null);
    const [submitterComments, setSubmitterComments] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Get user profile to check role
                const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (profileRes.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }
                if (!profileRes.ok) {
                    throw new Error(`HTTP error! status: ${profileRes.status}`);
                }
                const profileData = await profileRes.json();
                console.log('User profile data:', profileData);
                setUserRole(profileData.role);
                setUserId(profileData.id);
                console.log(`userId:${profileData.id}`);

                // Fetch user's own timesheets
                try {
                    const timesheetsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets?userId=${profileData.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const timesheetsData = await timesheetsRes.json();
                    if (Array.isArray(timesheetsData)) {
                        setMyTimesheets(timesheetsData);
                    } else {
                        console.error('Timesheets response is not an array:', timesheetsData);
                        setMyTimesheets([]);
                    }
                } catch (error) {
                    console.error('Error fetching timesheets:', error);
                    setMyTimesheets([]);
                }

                // Fetch all timesheets for admin
                try {
                    let nullUserId=null;
                    const allTimesheetsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets?userId=`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const allTimesheetsData = await allTimesheetsRes.json();
                    if (Array.isArray(allTimesheetsData)) {
                        setAllTimesheets(allTimesheetsData);
                    } else {
                        console.error('All timesheets response is not an array:', allTimesheetsData);
                        setAllTimesheets([]);
                    }
                } catch (error) {
                    console.error('Error fetching all timesheets:', error);
                    setAllTimesheets([]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Filter to show only logged-in user's timesheets in My Timesheets section
    const filteredMyTimesheets = myTimesheets.filter(
        (ts) => ts.user_id === userId
    );

    // Filter admin timesheets by status
    const filteredAdminTimesheets = allTimesheets.filter(
        (ts) => ts.status.toLowerCase() === adminFilter
    );

    // Reset admin page when filter changes
    useEffect(() => {
        setAdminCurrentPage(1);
    }, [adminFilter]);

    // My timesheets pagination
    const myTotalPages = Math.ceil(filteredMyTimesheets.length / pageSize);
    const myStartIndex = (myCurrentPage - 1) * pageSize;
    const myEndIndex = myStartIndex + pageSize;
    const paginatedMyTimesheets = filteredMyTimesheets.slice(myStartIndex, myEndIndex);

    // Admin timesheets pagination
    const adminTotalPages = Math.ceil(filteredAdminTimesheets.length / pageSize);
    const adminStartIndex = (adminCurrentPage - 1) * pageSize;
    const adminEndIndex = adminStartIndex + pageSize;
    const paginatedAdminTimesheets = filteredAdminTimesheets.slice(adminStartIndex, adminEndIndex);

    const handleCancelClick = (timesheetId: string) => {
        setCancelTimesheetId(timesheetId);
        setSubmitterComments('');
        setShowCancelPopup(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelTimesheetId || !submitterComments.trim()) {
            alert('Please provide comments for cancellation');
            return;
        }

        setIsCancelling(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/${cancelTimesheetId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ submitter_comments: submitterComments }),
            });

            if (res.ok) {
                console.log('Timesheet cancelled successfully, updating status');
                const responseData = await res.json();
                
                // Update the status of the cancelled timesheet in both lists
                const updatedMyTimesheets = myTimesheets.map(ts => 
                    ts.id === cancelTimesheetId 
                        ? { ...ts, status: responseData.status || 'Cancelled', approver_comments: submitterComments }
                        : ts
                );
                const updatedAllTimesheets = allTimesheets.map(ts => 
                    ts.id === cancelTimesheetId 
                        ? { ...ts, status: responseData.status || 'Cancelled', approver_comments: submitterComments }
                        : ts
                );
                console.log('Updated timesheets');
                setMyTimesheets(updatedMyTimesheets);
                setAllTimesheets(updatedAllTimesheets);
                
                setShowCancelPopup(false);
                setCancelTimesheetId(null);
                setSubmitterComments('');
            } else {
                const errorData = await res.json();
                alert(`Failed to cancel timesheet: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error cancelling timesheet:', error);
            alert('An error occurred while cancelling the timesheet');
        } finally {
            setIsCancelling(false);
        }
    };

    const canCancelTimesheet = (ts: Timesheet) => {
        const status = ts.status.toLowerCase();
        // Allow cancellation only for draft or submitted status
        return status === 'draft' || status === 'submitted';
    };

    const renderTimesheetTable = (timesheets: Timesheet[], currentPage: number, totalPages: number, setPage: (page: number) => void, totalItems: number, startIndex: number, endIndex: number) => {
        if (timesheets.length === 0) {
            return (
                <div className={styles.empty}>
                    <p>No timesheets found</p>
                </div>
            );
        }

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.timesheetTable}>
                    <thead>
                        <tr>
                            <th>Week Period</th>
                            <th>Submitter</th>
                            <th>Status</th>
                            <th>Submission Date</th>
                            <th>Approver Comments</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {timesheets.map((ts) => (
                            <tr key={ts.id}>
                                <td className={styles.periodCell}>
                                    {new Date(ts.week_start_date).toISOString().split('T')[0]} - {new Date(ts.week_end_date).toISOString().split('T')[0]}
                                </td>
                                <td>{ts.submitter || 'N/A'}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[ts.status]}`}>
                                        {ts.status}
                                    </span>
                                </td>
                                <td>
                                    {ts.submission_date ? new Date(ts.submission_date).toISOString().split('T')[0] : 'Not submitted'}
                                </td>
                                <td>{ts.approver_comments || '-'}</td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => router.push(`/timesheets/${ts.id}`)}
                                        >
                                            View Details
                                        </button>
                                        {canCancelTimesheet(ts) && (
                                            <button
                                                onClick={() => handleCancelClick(ts.id)}
                                                className={styles.cancelBtn}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={styles.pageBtn}
                        >
                            Previous
                        </button>
                        <div className={styles.pageNumbers}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setPage(page)}
                                    className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={styles.pageBtn}
                        >
                            Next
                        </button>
                        <span className={styles.pageInfo}>
                            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading timesheets..." />;
    }

    return (
        <DashboardLayout>
            {isCancelling && <LoadingSpinner fullScreen message="Cancelling timesheet..." />}
            {showCancelPopup && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Cancel Timesheet</h2>
                        <p>Please provide comments for cancellation:</p>
                        <div className={styles.formGroup}>
                            <textarea
                                value={submitterComments}
                                onChange={(e) => setSubmitterComments(e.target.value)}
                                rows={4}
                                placeholder="Enter cancellation comments..."
                                className={styles.cancelTextarea}
                                required
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setShowCancelPopup(false);
                                    setCancelTimesheetId(null);
                                    setSubmitterComments('');
                                }}
                                className={styles.cancelModalBtn}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className={styles.confirmCancelBtn}
                                disabled={!submitterComments.trim()}
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={styles.container}>
                {/* My Timesheets Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h1>My Timesheets</h1>
                        <button className={styles.newBtn} onClick={() => router.push('/timesheets/new')}>
                            + New Timesheet
                        </button>
                    </div>
                    {renderTimesheetTable(paginatedMyTimesheets, myCurrentPage, myTotalPages, setMyCurrentPage, filteredMyTimesheets.length, myStartIndex, myEndIndex)}
                </div>

                {/* Admin Section */}
                {userRole === 'Admin' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Admin - Team Timesheets</h2>
                            <div className={styles.filterButtons}>
                                <button
                                    className={`${styles.filterBtn} ${adminFilter === 'submitted' ? styles.active : ''}`}
                                    onClick={() => setAdminFilter('submitted')}
                                >
                                    Submitted
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${adminFilter === 'approved' ? styles.active : ''}`}
                                    onClick={() => setAdminFilter('approved')}
                                >
                                    Approved
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${adminFilter === 'rejected' ? styles.active : ''}`}
                                    onClick={() => setAdminFilter('rejected')}
                                >
                                    Rejected
                                </button>
                            </div>
                        </div>
                        {renderTimesheetTable(paginatedAdminTimesheets, adminCurrentPage, adminTotalPages, setAdminCurrentPage, filteredAdminTimesheets.length, adminStartIndex, adminEndIndex)}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
