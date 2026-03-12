'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './leave-approvals.module.css';

interface LeaveApplication {
    id: string;
    employee_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string;
    applied_date: string;
    days_requested: number;
    user: any;
}

export default function LeaveApprovalsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState('');
    const [user, setUser] = useState<any>(null);
    const [filter, setFilter] = useState('pending');
    const [commentingId, setCommentingId] = useState<string | null>(null);
    const [commentAction, setCommentAction] = useState<'approve' | 'reject' | null>(null);
    const [comments, setComments] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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
            .then((data) => {
                setUserRole(data.role);
                setUser(data);
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/leave');
                    return;
                }
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                }
            });

        // Fetch all leave applications
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/applications`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('Fetched leave applications:', data);
                if (Array.isArray(data)) {
                    console.log('Applications statuses:', data.map(app => ({ id: app.id, status: app.status })));
                }
                setApplications(data);
            })
            .catch((error) => {
                console.error('Error fetching applications:', error);
            })
            .finally(() => setLoading(false));
    }, [router]);

    const handleApprove = async (id: string, comment: string) => {
        setProcessingId(id);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/${id}/approve`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: comment, approved_by: `${user.first_name} ${user.last_name}` }),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log('Leave approved, updated record:', updated);
                console.log('Status received from API:', updated.status);
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
                setCommentingId(null);
                setCommentAction(null);
                setComments('');
            } else {
                console.error('Failed to approve leave, status:', res.status);
                const errorData = await res.text();
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Error approving leave:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string, comment: string) => {
        setProcessingId(id);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/${id}/reject`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: comment, approved_by: `${user.first_name} ${user.last_name}` }),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log('Leave rejected, updated record:', updated);
                console.log('Status received from API:', updated.status);
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
                setCommentingId(null);
                setCommentAction(null);
                setComments('');
            } else {
                console.error('Failed to reject leave, status:', res.status);
                const errorData = await res.text();
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Error rejecting leave:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSubmitComment = () => {
        if (!commentingId || !commentAction) return;
        
        if (commentAction === 'approve') {
            handleApprove(commentingId, comments);
        } else {
            handleReject(commentingId, comments);
        }
    };

    const handleCancelComment = () => {
        setCommentingId(null);
        setCommentAction(null);
        setComments('');
    };

    const filteredApplications = applications.filter((app) => {
        if (filter === 'all') return true;
        
        // Make filtering case-insensitive
        const appStatus = app.status?.toLowerCase();
        const filterStatus = filter.toLowerCase();
        
        console.log(`Filtering: app.status="${app.status}" (normalized: "${appStatus}"), filter="${filter}" (normalized: "${filterStatus}")`, app);
        
        return appStatus === filterStatus;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredApplications.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Debug: Log all application statuses
    useEffect(() => {
        if (applications.length > 0) {
            console.log('All applications with their statuses:', 
                applications.map(app => ({ id: app.id, status: app.status, employee: `${app.user?.first_name} ${app.user?.last_name}` }))
            );
            
            const uniqueStatuses = Array.from(new Set(applications.map(app => app.status)));
            console.log('Unique status values found:', uniqueStatuses);
        }
    }, [applications]);

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading leave applications..." />;
    }

    if (userRole !== 'Admin' && userRole !== 'HR') {
        return <div className={styles.error}>Access Denied</div>;
    }

    return (
        <DashboardLayout>
            {processingId && <LoadingSpinner fullScreen message="Processing request..." />}
            
            {/* Comment Modal */}
            {commentingId && (
                <div className={styles.modalOverlay} onClick={handleCancelComment}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{commentAction === 'approve' ? 'Approve Leave Application' : 'Reject Leave Application'}</h2>
                            <button className={styles.closeBtn} onClick={handleCancelComment}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <label htmlFor="comment-input">Comments (Optional)</label>
                            <textarea
                                id="comment-input"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={`Add comments for ${commentAction === 'approve' ? 'approval' : 'rejection'}...`}
                                rows={5}
                                className={styles.modalTextarea}
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.modalCancelBtn}
                                onClick={handleCancelComment}
                            >
                                Cancel
                            </button>
                            <button
                                className={commentAction === 'approve' ? styles.modalApproveBtn : styles.modalRejectBtn}
                                onClick={handleSubmitComment}
                            >
                                {commentAction === 'approve' ? '✓ Confirm Approval' : '✕ Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Leave Approvals</h1>
                    <div className={styles.filters}>
                        <button
                            className={filter === 'pending' ? styles.active : ''}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={filter === 'approved' ? styles.active : ''}
                            onClick={() => setFilter('approved')}
                        >
                            Approved
                        </button>
                        <button
                            className={filter === 'rejected' ? styles.active : ''}
                            onClick={() => setFilter('rejected')}
                        >
                            Rejected
                        </button>
                        <button
                            className={filter === 'all' ? styles.active : ''}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                    </div>
                </div>

                {filteredApplications.length === 0 ? (
                    <div className={styles.empty}>
                        No {filter !== 'all' ? filter : ''} leave applications found
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.applicationsTable}>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>From Date</th>
                                    <th>To Date</th>
                                    <th>Days Requested</th>
                                    <th>Reason</th>
                                    <th>Applied On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td className={styles.employeeName}>
                                            {app.user?.first_name} {app.user?.last_name}
                                        </td>
                                        <td>{app.leave_type}</td>
                                        <td>{new Date(app.start_date).toISOString().split('T')[0]}</td>
                                        <td>{new Date(app.end_date).toISOString().split('T')[0]}</td>
                                        <td>{app.days_requested ?? '-'}</td>
                                        <td className={styles.reasonCell}>
                                            {app.reason || '-'}
                                        </td>
                                        <td>{new Date(app.applied_date).toISOString().split('T')[0]}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[app.status]}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            {app.status.toLowerCase() === 'pending' ? (
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.tableApproveBtn}
                                                        onClick={() => {
                                                            setCommentingId(app.id);
                                                            setCommentAction('approve');
                                                        }}
                                                        title="Approve"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        className={styles.tableRejectBtn}
                                                        onClick={() => {
                                                            setCommentingId(app.id);
                                                            setCommentAction('reject');
                                                        }}
                                                        title="Reject"
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={styles.noActions}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    Showing {startIndex + 1}-{Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
