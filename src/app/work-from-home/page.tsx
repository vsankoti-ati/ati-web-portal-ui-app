'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './work-from-home.module.css';

interface WFHRequest {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at: string;
    approver_comments?: string;
}

export default function WorkFromHomePage() {
    const router = useRouter();
    const [requests, setRequests] = useState<WFHRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get user profile to get user ID
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
                setUserId(data.id);

                // Fetch user's WFH requests
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/requests?userId=${data.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        setRequests(Array.isArray(data) ? data : []);
                    })
                    .catch((error) => {
                        console.error('Error fetching WFH requests:', error);
                        setRequests([]);
                    })
                    .finally(() => setLoading(false));
            })
            .catch((err) => {
                if (err.message !== 'Unauthorized') {
                    console.error(err);
                    setLoading(false);
                }
            });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        const requestData = {
            user_id: userId,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason,
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
            });

            if (res.ok) {
                const newRequest = await res.json();
                setRequests([newRequest, ...requests]);
                setShowRequestForm(false);
                setFormData({ start_date: '', end_date: '', reason: '' });
            } else {
                console.error('Failed to submit WFH request');
            }
        } catch (error) {
            console.error('Error submitting WFH request:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = (requestId: string) => {
        setCancelRequestId(requestId);
        setCancelReason('');
        setShowCancelPopup(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelRequestId || !cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setIsCancelling(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wfh/${cancelRequestId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });

            if (res.ok) {
                // Remove the cancelled request from the list
                setRequests(requests.filter(req => req.id !== cancelRequestId));
                setShowCancelPopup(false);
                setCancelRequestId(null);
                setCancelReason('');
            } else {
                const errorData = await res.json();
                alert(`Failed to cancel request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error cancelling WFH request:', error);
            alert('An error occurred while cancelling the request');
        } finally {
            setIsCancelling(false);
        }
    };

    const canCancelRequest = (request: WFHRequest) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(request.start_date);
        startDate.setHours(0, 0, 0, 0);
        const status = request.status.toLowerCase();
        
        // Allow cancellation only for pending/submitted status and future dates
        return (status === 'pending' || status === 'submitted') && startDate >= today;
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return styles.statusApproved;
            case 'rejected':
                return styles.statusRejected;
            case 'cancelled':
                return styles.statusCancelled;
            case 'pending':
            default:
                return styles.statusPending;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner fullScreen message="Loading..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {isSubmitting && <LoadingSpinner fullScreen message="Submitting request..." />}
            {isCancelling && <LoadingSpinner fullScreen message="Cancelling request..." />}
            {showCancelPopup && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Cancel Work From Home Request</h2>
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
                                    setCancelRequestId(null);
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
                    <h1>Work From Home</h1>
                    <div className={styles.headerActions}>
                        <button className={styles.requestBtn} onClick={() => setShowRequestForm(!showRequestForm)}>
                            {showRequestForm ? 'Cancel' : '+ New Request'}
                        </button>
                        {(userRole === 'Admin' || userRole === 'HR') && (
                            <button className={`${styles.requestBtn} ${styles.approvalsBtn}`} onClick={() => router.push('/work-from-home/approvals')}>
                                View Approvals
                            </button>
                        )}
                    </div>
                </div>

                {showRequestForm && (
                    <div className={styles.formCard}>
                        <h2>New Work From Home Request</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        min={formData.start_date}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Reason *</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    rows={4}
                                    placeholder="Please provide a reason for your work from home request..."
                                    required
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowRequestForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className={styles.requestsList}>
                    <h2>My Requests</h2>
                    {requests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No work from home requests found.</p>
                            <p>Click "New Request" to submit your first request.</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Approver Comments</th>
                                        <th>Requested On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => (
                                        <tr key={request.id}>
                                            <td>{new Date(request.start_date).toLocaleDateString()}</td>
                                            <td>{new Date(request.end_date).toLocaleDateString()}</td>
                                            <td>{request.reason}</td>
                                            <td>
                                                <span className={`${styles.status} ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td>{request.approver_comments || '-'}</td>
                                            <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {canCancelRequest(request) && (
                                                    <button
                                                        onClick={() => handleCancelClick(request.id)}
                                                        className={styles.cancelBtnTable}
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
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
