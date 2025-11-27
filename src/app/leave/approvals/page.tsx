'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './leave-approvals.module.css';

interface LeaveApplication {
    id: string;
    employee_id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    status: string;
    comment: string;
    applied_date: string;
}

export default function LeaveApprovalsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get user profile to check role
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setUserRole(data.role);
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/leave');
                    return;
                }
            })
            .catch(console.error);

        // Fetch all leave applications
        fetch('http://localhost:3001/leave/applications', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setApplications(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    const handleApprove = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/leave/${id}/approve`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
            }
        } catch (error) {
            console.error('Error approving leave:', error);
        }
    };

    const handleReject = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/leave/${id}/reject`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const updated = await res.json();
                setApplications(applications.map((app) => (app.id === id ? updated : app)));
            }
        } catch (error) {
            console.error('Error rejecting leave:', error);
        }
    };

    const filteredApplications = applications.filter((app) => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (userRole !== 'Admin' && userRole !== 'HR') {
        return <div className={styles.error}>Access Denied</div>;
    }

    return (
        <DashboardLayout>
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

                <div className={styles.applicationsGrid}>
                    {filteredApplications.map((app) => (
                        <div key={app.id} className={styles.applicationCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>Employee ID: {app.employee_id}</h3>
                                    <p className={styles.leaveType}>{app.leave_type} Leave</p>
                                </div>
                                <span className={`${styles.status} ${styles[app.status]}`}>
                                    {app.status}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.dateRange}>
                                    <div>
                                        <label>From</label>
                                        <p>{new Date(app.from_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label>To</label>
                                        <p>{new Date(app.to_date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {app.comment && (
                                    <div className={styles.comment}>
                                        <label>Comment</label>
                                        <p>{app.comment}</p>
                                    </div>
                                )}

                                <div className={styles.appliedDate}>
                                    <label>Applied On</label>
                                    <p>{new Date(app.applied_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {app.status === 'pending' && (
                                <div className={styles.actions}>
                                    <button
                                        className={styles.approveBtn}
                                        onClick={() => handleApprove(app.id)}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        className={styles.rejectBtn}
                                        onClick={() => handleReject(app.id)}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredApplications.length === 0 && (
                    <div className={styles.empty}>
                        No {filter !== 'all' ? filter : ''} leave applications found
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
