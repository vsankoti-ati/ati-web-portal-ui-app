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
