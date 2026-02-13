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

    const renderTimesheetTable = (timesheets: Timesheet[], currentPage: number, totalPages: number, setPage: (page: number) => void) => {
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
                                <td>{ts.approver_comments || '-'}</td>
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
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationButtons}>
                            <button
                                onClick={() => setPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                        <div className={styles.paginationInfo}>
                            Page {currentPage} of {totalPages}
                        </div>
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
            <div className={styles.container}>
                {/* My Timesheets Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h1>My Timesheets</h1>
                        <button className={styles.newBtn} onClick={() => router.push('/timesheets/new')}>
                            + New Timesheet
                        </button>
                    </div>
                    {renderTimesheetTable(paginatedMyTimesheets, myCurrentPage, myTotalPages, setMyCurrentPage)}
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
                        {renderTimesheetTable(paginatedAdminTimesheets, adminCurrentPage, adminTotalPages, setAdminCurrentPage)}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
