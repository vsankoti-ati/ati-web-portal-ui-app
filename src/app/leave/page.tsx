'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
}

interface LeavePageProps {
    userId?: string;
}

export default function LeavePage({ userId }: LeavePageProps) {
    const router = useRouter();
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [employeeId, setEmployeeId] = useState(userId || '');
    const [formData, setFormData] = useState({
        leave_type: 'Earned',
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

        

        // Get user profile to check role and employee ID
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
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
                    console.error(err);
                    setLoading(false);
                });

        // Applications will be fetched after we get the profile (so we know employeeId)
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const request = { ...formData, employee_id: employeeId };

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
                setApplications([...applications, newApp]);
                setShowApplyForm(false);
                setFormData({ leave_type: 'Earned', start_date: '', end_date: '', reason: '' });
            }
        } catch (error) {
            console.error('Error applying for leave:', error);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
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
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <div>Type</div>
                            <div>From</div>
                            <div>To</div>
                            <div>Status</div>
                            <div>Applied</div>
                        </div>
                        {applications.map((app) => (
                            <div key={app.id} className={styles.tableRow}>
                                <div>{app.leave_type}</div>
                                <div>{new Date(app.start_date).toLocaleDateString()}</div>
                                <div>{new Date(app.end_date).toLocaleDateString()}</div>
                                <div>
                                    <span className={`${styles.status} ${styles[app.status]}`}>
                                        {app.status}
                                    </span>
                                </div>
                                <div>{new Date(app.applied_date).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
