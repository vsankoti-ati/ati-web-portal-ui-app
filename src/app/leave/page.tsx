'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './leave.module.css';

interface LeaveBalance {
    leave_type: string;
    leave_balance: number;
}

interface LeaveApplication {
    id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    status: string;
    comment: string;
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
        from_date: '',
        to_date: '',
        comment: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        

        // Get user profile to check role and employee ID
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                    setUserRole(data.role);
                    const empId = userId || data.employee_id;
                    setEmployeeId(empId);

                    // Fetch leave balance using employee ID from props or profile
                    if (empId) {
                        fetch(`http://localhost:3001/leave/balance/${empId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                            .then((res) => res.json())
                            .then((data) => setBalances(Array.isArray(data) ? data : []))
                            .catch(console.error);
                    }

                    // Fetch leave applications. Admin/HR see all, others see only their own
                    const appsUrl = (data.role === 'Admin' || data.role === 'HR')
                        ? 'http://localhost:3001/leave/applications'
                        : `http://localhost:3001/leave/applications?employeeId=${empId}`;

                    fetch(appsUrl, { headers: { Authorization: `Bearer ${token}` } })
                        .then((res) => res.json())
                        .then((apps) => setApplications(Array.isArray(apps) ? apps : []))
                        .catch(console.error)
                        .finally(() => setLoading(false));
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
            const res = await fetch('http://localhost:3001/leave/apply', {
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
                setFormData({ leave_type: 'Earned', from_date: '', to_date: '', comment: '' });
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
                            <button
                                className={`${styles.applyBtn} ${styles.approvalBtn}`}
                                onClick={() => router.push('/leave/approvals')}
                            >
                                📋 Approvals
                            </button>
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
                                    <option value="UnPaid">Unpaid Leave</option>
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>From Date</label>
                                    <input
                                        type="date"
                                        value={formData.from_date}
                                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                                        required
                                        aria-label="From Date"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>To Date</label>
                                    <input
                                        type="date"
                                        value={formData.to_date}
                                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                                        required
                                        aria-label="To Date"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Comment</label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    rows={3}
                                    aria-label="Comment"
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Submit Application</button>
                        </form>
                    </div>
                )}

                <div className={styles.balanceSection}>
                    <h2>Leave Balance</h2>
                    <div className={styles.balanceGrid}>
                        {balances.map((balance) => (
                            <div key={balance.leave_type} className={styles.balanceCard}>
                                <h3>{balance.leave_type}</h3>
                                <p className={styles.balanceAmount}>{balance.leave_balance}</p>
                                <p className={styles.balanceLabel}>days available</p>
                            </div>
                        ))}
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
                                <div>{new Date(app.from_date).toLocaleDateString()}</div>
                                <div>{new Date(app.to_date).toLocaleDateString()}</div>
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
