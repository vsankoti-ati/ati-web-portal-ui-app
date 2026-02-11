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
    user: any;
}

export default function LeaveApprovalsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState('');
    const [user, setUser] = useState({});
    const [filter, setFilter] = useState('pending');
    const [commentingId, setCommentingId] = useState<string | null>(null);
    const [commentAction, setCommentAction] = useState<'approve' | 'reject' | null>(null);
    const [comments, setComments] = useState('');

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
            .then((data) => {
                setUserRole(data.role);
                setUser(data);
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/leave');
                    return;
                }
            })
            .catch(console.error);

        // Fetch all leave applications
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/applications`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setApplications(data))
            .catch(console.error)
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
                body: JSON.stringify({ comments: comment }),
            });

            if (res.ok) {
                const updated = await res.json();
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
                setCommentingId(null);
                setCommentAction(null);
                setComments('');
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
                body: JSON.stringify({ comments: comment }),
            });

            if (res.ok) {
                const updated = await res.json();
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
                setCommentingId(null);
                setCommentAction(null);
                setComments('');
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
        return app.status === filter;
    });

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
                                    <th>Reason</th>
                                    <th>Applied On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td className={styles.employeeName}>
                                            {app.user?.first_name} {app.user?.last_name}
                                        </td>
                                        <td>{app.leave_type}</td>
                                        <td>{new Date(app.start_date).toLocaleDateString()}</td>
                                        <td>{new Date(app.end_date).toLocaleDateString()}</td>
                                        <td className={styles.reasonCell}>
                                            {app.reason || '-'}
                                        </td>
                                        <td>{new Date(app.applied_date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[app.status]}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            {app.status === 'pending' ? (
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
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
