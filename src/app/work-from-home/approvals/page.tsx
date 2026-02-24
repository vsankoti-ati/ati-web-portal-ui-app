'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './wfh-approvals.module.css';

interface WFHRequest {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at: string;
    approver_comments?: string;
    user?: {
        first_name: string;
        last_name: string;
        username: string;
    };
}

export default function WFHApprovalsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<WFHRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState('');
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentModalAction, setCommentModalAction] = useState<'approve' | 'reject'>('approve');
    const [approverComment, setApproverComment] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
    const [processedCurrentPage, setProcessedCurrentPage] = useState(1);
    const [pageSize] = useState(3);

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
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/work-from-home');
                    return;
                }

                // Fetch all pending WFH requests
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/requests?userId=`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        console.log('Fetched WFH requests:', data);
                        setRequests(Array.isArray(data) ? data : []);
                    })
                    .catch((error) => {
                        console.error('Error fetching WFH requests:', error);
                        setRequests([]);
                    })
                    .finally(() => setLoading(false));
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                    setLoading(false);
                }
            });
    }, [router]);

    const openCommentModal = (requestId: string, action: 'approve' | 'reject') => {
        setSelectedRequestId(requestId);
        setCommentModalAction(action);
        setApproverComment('');
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
        setApproverComment('');
        setSelectedRequestId(null);
    };

    const handleApprove = async (requestId: string, comment: string) => {
        setProcessingId(requestId);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/${requestId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: comment || '' }),
            });

            if (res.ok) {
                const updated = await res.json();
                setRequests(requests.map((req) => (req.id === requestId ? updated : req)));
                closeCommentModal();
            } else {
                const errorData = await res.text();
                console.error(`Failed to approve WFH request:${errorData}`);
            }
        } catch (error) {
            console.error('Error approving WFH request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string, comment: string) => {
        if (!comment.trim()) {
            alert('Comment is required when rejecting a request.');
            return;
        }

        setProcessingId(requestId);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/${requestId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: comment }),
            });

            if (res.ok) {
                const updated = await res.json();
                setRequests(requests.map((req) => (req.id === requestId ? updated : req)));
                closeCommentModal();
            } else {
                console.error('Failed to reject WFH request');
            }
        } catch (error) {
            console.error('Error rejecting WFH request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleConfirmAction = () => {
        if (!selectedRequestId) return;
        
        if (commentModalAction === 'approve') {
            handleApprove(selectedRequestId, approverComment);
        } else {
            handleReject(selectedRequestId, approverComment);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return styles.statusApproved;
            case 'rejected':
                return styles.statusRejected;
            case 'pending':
            default:
                return styles.statusPending;
        }
    };

    const pendingRequests = requests.filter(req => req.status.toLowerCase() === 'pending');
    const processedRequests = requests.filter(req => req.status.toLowerCase() !== 'pending');

    // Pagination calculations for pending requests
    const pendingTotalPages = Math.ceil(pendingRequests.length / pageSize);
    const pendingStartIndex = (pendingCurrentPage - 1) * pageSize;
    const pendingEndIndex = pendingStartIndex + pageSize;
    const paginatedPendingRequests = pendingRequests.slice(pendingStartIndex, pendingEndIndex);

    // Pagination calculations for processed requests
    const processedTotalPages = Math.ceil(processedRequests.length / pageSize);
    const processedStartIndex = (processedCurrentPage - 1) * pageSize;
    const processedEndIndex = processedStartIndex + pageSize;
    const paginatedProcessedRequests = processedRequests.slice(processedStartIndex, processedEndIndex);

    const handlePendingPageChange = (page: number) => {
        setPendingCurrentPage(page);
    };

    const handleProcessedPageChange = (page: number) => {
        setProcessedCurrentPage(page);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner fullScreen message="Loading requests..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {processingId && <LoadingSpinner fullScreen message="Processing..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/work-from-home')}>
                        ← Back to Work From Home
                    </button>
                    <h1>Work From Home Approvals</h1>
                </div>

                <div className={styles.section}>
                    <h2>Pending Requests</h2>
                    {pendingRequests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No pending work from home requests.</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Reason</th>
                                            <th>Requested On</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedPendingRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td>
                                                {request.user 
                                                    ? `${request.user.first_name} ${request.user.last_name}` 
                                                    : request.user_id}
                                            </td>
                                            <td>{new Date(request.start_date).toISOString().split('T')[0]}</td>
                                            <td>{new Date(request.end_date).toISOString().split('T')[0]}</td>
                                            <td className={styles.reasonCell}>{request.reason}</td>
                                            <td>{new Date(request.created_at).toISOString().split('T')[0]}</td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                        onClick={() => openCommentModal(request.id, 'approve')}
                                                        disabled={processingId === request.id}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                        onClick={() => openCommentModal(request.id, 'reject')}
                                                        disabled={processingId === request.id}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {pendingTotalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => handlePendingPageChange(pendingCurrentPage - 1)}
                                        disabled={pendingCurrentPage === 1}
                                        className={styles.pageBtn}
                                    >
                                        Previous
                                    </button>
                                    <div className={styles.pageNumbers}>
                                        {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePendingPageChange(page)}
                                                className={`${styles.pageBtn} ${pendingCurrentPage === page ? styles.activePage : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handlePendingPageChange(pendingCurrentPage + 1)}
                                        disabled={pendingCurrentPage === pendingTotalPages}
                                        className={styles.pageBtn}
                                    >
                                        Next
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Showing {pendingStartIndex + 1}-{Math.min(pendingEndIndex, pendingRequests.length)} of {pendingRequests.length}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {processedRequests.length > 0 && (
                    <div className={styles.section}>
                        <h2>Processed Requests</h2>
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Approver Comments</th>
                                            <th>Requested On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedProcessedRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td>
                                                {request.user 
                                                    ? `${request.user.first_name} ${request.user.last_name}` 
                                                    : request.user_id}
                                            </td>
                                            <td>{new Date(request.start_date).toISOString().split('T')[0]}</td>
                                            <td>{new Date(request.end_date).toISOString().split('T')[0]}</td>
                                            <td className={styles.reasonCell}>{request.reason}</td>
                                            <td>
                                                <span className={`${styles.status} ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td>{request.approver_comments || '-'}</td>
                                            <td>{new Date(request.created_at).toISOString().split('T')[0]}</td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {processedTotalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => handleProcessedPageChange(processedCurrentPage - 1)}
                                        disabled={processedCurrentPage === 1}
                                        className={styles.pageBtn}
                                    >
                                        Previous
                                    </button>
                                    <div className={styles.pageNumbers}>
                                        {Array.from({ length: processedTotalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handleProcessedPageChange(page)}
                                                className={`${styles.pageBtn} ${processedCurrentPage === page ? styles.activePage : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleProcessedPageChange(processedCurrentPage + 1)}
                                        disabled={processedCurrentPage === processedTotalPages}
                                        className={styles.pageBtn}
                                    >
                                        Next
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Showing {processedStartIndex + 1}-{Math.min(processedEndIndex, processedRequests.length)} of {processedRequests.length}
                                    </span>
                                </div>
                            )}
                        </>
                    </div>
                )}

                {/* Comment Modal */}
                {showCommentModal && (
                    <div className={styles.modalOverlay} onClick={closeCommentModal}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{commentModalAction === 'approve' ? 'Approve WFH Request' : 'Reject WFH Request'}</h2>
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
                                        Comment is required when rejecting a request.
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
