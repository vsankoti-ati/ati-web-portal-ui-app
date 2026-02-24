'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './leave.module.css';

interface LeaveBalance {
    leave_type: string;
    remaining_days: number;
    used_days: number;
}

interface LeaveApplication {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string;
    applied_date: string;
    approver_comments: string;
}

interface LeavePageProps {
    userId?: string;
}

export default function LeavePage({ userId }: LeavePageProps) {
    const router = useRouter();
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [employeeId, setEmployeeId] = useState(userId || '');
    const [formData, setFormData] = useState({
        leave_type: 'Earned',
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelLeaveId, setCancelLeaveId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        

        // Get user profile to check role and employee ID
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
            .then((data) => {
                    setUserRole(data.role);
                    console.log('User profile data:', data);
                    const empId = data.id || data.employee_id;
                    setEmployeeId(empId);

                    // Fetch leave balance using employee ID from props or profile
                    if (empId) {
                        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/balance/${data.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                            .then((res) => {
                                if (!res.ok) {
                                    throw new Error('Failed to fetch leave balance');
                                }
                                return res.json();
                            })
                            .then((data) => {
                                console.log('Leave balance data:', data);
                                setBalances(Array.isArray(data) ? data : []);
                            })
                            .catch((error) => {
                                console.error('Error fetching leave balance:', error);
                                setBalances([]);
                            });
                    } else {
                        console.warn('No employee ID available for fetching leave balance');
                        setBalances([]);
                    }

                    // Fetch leave applications - always fetch only current user's applications
                    if (empId) {
                        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/applications?userId=${empId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then((res) => res.json())
                            .then((apps) => {
                                console.log('Leave applications data:', apps);
                                setApplications(Array.isArray(apps) ? apps : []);
                                setCurrentPage(1); // Reset to first page when data loads
                            })
                            .catch((error) => {
                                console.error('Error fetching leave applications:', error);
                                setApplications([]);
                            })
                            .finally(() => setLoading(false));
                    } else {
                        console.warn('No employee ID available for fetching applications');
                        setApplications([]);
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    if (err.message !== 'Unauthorized') {
                        console.error(err);
                        setLoading(false);
                    }
                });

        // Applications will be fetched after we get the profile (so we know employeeId)
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsApplying(true);
        const token = localStorage.getItem('token');
        const request = { 
            ...formData, 
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
            employee_id: employeeId 
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });

            if (res.ok) {
                const newApp = await res.json();
                setApplications([newApp, ...applications]);
                setShowApplyForm(false);
                setFormData({ leave_type: 'Earned', start_date: '', end_date: '', reason: '' });
                setCurrentPage(1); // Reset to first page to show new application
            }
        } catch (error) {
            console.error('Error applying for leave:', error);
        } finally {
            setIsApplying(false);
        }
    };

    const handleCancelClick = (leaveId: string) => {
        setCancelLeaveId(leaveId);
        setCancelReason('');
        setShowCancelPopup(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelLeaveId || !cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setIsCancelling(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/${cancelLeaveId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });

            if (res.ok) {
                console.log('Leave cancelled successfully, updating status');
                const responseData = await res.json();
                
                // Update the status of the cancelled leave application
                const updatedApplications = applications.map(app => 
                    app.id === cancelLeaveId 
                        ? { ...app, status: responseData.status || 'Cancelled', approver_comments: cancelReason }
                        : app
                );
                console.log('Updated applications:', updatedApplications.length);
                setApplications(updatedApplications);
                
                setShowCancelPopup(false);
                setCancelLeaveId(null);
                setCancelReason('');
            } else {
                console.error('Failed to cancel leave, status:', res.status);
                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                alert(`Failed to cancel leave: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error cancelling leave:', error);
            alert('An error occurred while cancelling the leave');
        } finally {
            setIsCancelling(false);
        }
    };

    const canCancelLeave = (app: LeaveApplication) => {
       
        
        const status = app.status.toLowerCase();
        
        console.log('Cancel check:', { status, result: (status === 'pending' || status === 'submitted')});
        
        // Allow cancellation only for pending/submitted status and future dates or today
        return (status === 'pending' || status === 'submitted') 
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading leave information..." />;
    }

    // Pagination calculations
    const totalPages = Math.ceil(applications.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedApplications = applications.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <DashboardLayout>
            {isApplying && <LoadingSpinner fullScreen message="Submitting leave application..." />}
            {isCancelling && <LoadingSpinner fullScreen message="Cancelling leave application..." />}
            {showCancelPopup && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Cancel Leave Application</h2>
                        <p>Please provide a reason for cancellation:</p>
                        <div className={styles.formGroup}>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={4}
                                placeholder="Enter cancellation reason..."
                                className={styles.cancelTextarea}
                                required
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setShowCancelPopup(false);
                                    setCancelLeaveId(null);
                                    setCancelReason('');
                                }}
                                className={styles.cancelModalBtn}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className={styles.confirmCancelBtn}
                                disabled={!cancelReason.trim()}
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Leave Management</h1>
                    <div className={styles.headerActions}>
                        {(userRole === 'Admin' || userRole === 'HR') && (
                            <>
                                <button
                                    className={`${styles.applyBtn} ${styles.balanceBtn}`}
                                    onClick={() => router.push('/leave/balance')}
                                >
                                    ⚖️ Manage Balance
                                </button>
                                <button
                                    className={`${styles.applyBtn} ${styles.approvalBtn}`}
                                    onClick={() => router.push('/leave/approvals')}
                                >
                                    📋 Approvals
                                </button>
                            </>
                        )}
                        <button className={styles.applyBtn} onClick={() => setShowApplyForm(!showApplyForm)}>
                            {showApplyForm ? 'Cancel' : '+ Apply for Leave'}
                        </button>
                    </div>
                </div>

                {showApplyForm && (
                    <div className={styles.formCard}>
                        <h2>Apply for Leave</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Leave Type</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    aria-label="Leave Type"
                                >
                                    <option value="Earned">Earned Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>From Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        aria-label="From Date"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>To Date</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                        aria-label="To Date"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>reason</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    rows={3}
                                    aria-label="reason"
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Submit Application</button>
                        </form>
                    </div>
                )}

                <div className={styles.balanceSection}>
                    <h2>Leave Balance</h2>
                    <div className={styles.balanceGrid}>
                        {balances.length > 0 ? (
                            balances.map((balance) => (
                                <div key={balance.leave_type} className={styles.balanceCard}>
                                    <h3>{balance.leave_type}</h3>
                                    <p className={styles.balanceAmount}>{balance.remaining_days ?? 0}</p>
                                    <p className={styles.balanceLabel}>days available</p>
                                </div>
                            ))
                        ) : (
                            <div className={styles.noData}>
                                <p>No leave balance data available</p>
                                <div className={styles.defaultBalances}>
                                    <div className={styles.balanceCard}>
                                        <h3>Earned</h3>
                                        <p className={styles.balanceAmount}>0</p>
                                        <p className={styles.balanceLabel}>days available</p>
                                    </div>
                                    <div className={styles.balanceCard}>
                                        <h3>Holiday</h3>
                                        <p className={styles.balanceAmount}>0</p>
                                        <p className={styles.balanceLabel}>days available</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.applicationsSection}>
                    <h2>Leave Applications</h2>
                    {applications.length > 0 ? (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.leaveTable}>
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Status</th>
                                            <th>Reason</th>
                                            <th>Applied</th>
                                            <th>Approver Comments</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedApplications.map((app) => (
                                            <tr key={app.id}>
                                                <td>{app.leave_type}</td>
                                                <td>{new Date(app.start_date).toISOString().split('T')[0]}</td>
                                                <td>{new Date(app.end_date).toISOString().split('T')[0]}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td>{app.reason || '-'}</td>
                                                <td>{new Date(app.applied_date).toISOString().split('T')[0]}</td>
                                                <td>{app.approver_comments || '-'}</td>
                                                <td>
                                                    {canCancelLeave(app) && (
                                                        <button
                                                            onClick={() => handleCancelClick(app.id)}
                                                            className={styles.cancelBtn}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={styles.pageBtn}
                                    >
                                        Previous
                                    </button>
                                    <div className={styles.pageNumbers}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={styles.pageBtn}
                                    >
                                        Next
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Showing {startIndex + 1}-{Math.min(endIndex, applications.length)} of {applications.length}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.empty}>
                            <p>No leave applications found</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
