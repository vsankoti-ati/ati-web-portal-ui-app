'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './balance.module.css';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function LeaveBalancePage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        id: '',
        year: new Date().getFullYear().toString(),
        leave_type: 'Earned',
        remaining_days: '',
    });

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
                // Only Admin and HR can access this page
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/leave');
                    return;
                }

                // Fetch all employees
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((employeesData) => {
                        setEmployees(Array.isArray(employeesData) ? employeesData : []);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.error('Error fetching employees:', error);
                        setLoading(false);
                    });
            })
            .catch((err) => {
                if (err.message !== 'Unauthorized') {
                    console.error(err);
                }
                router.push('/login');
            });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employee_id: formData.id,
                    year: parseInt(formData.year),
                    leave_type: formData.leave_type,
                    remaining_days: parseFloat(formData.remaining_days),
                }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Leave balance updated successfully!' });
                setFormData({
                    id: formData.id,
                    year: new Date().getFullYear().toString(),
                    leave_type: 'Earned',
                    remaining_days: '',
                });
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.message || 'Failed to update leave balance' });
            }
        } catch (error) {
            console.error('Error updating leave balance:', error);
            setMessage({ type: 'error', text: 'An error occurred while updating leave balance' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading employees..." />;
    }

    return (
        <DashboardLayout>
            {submitting && <LoadingSpinner fullScreen message="Updating leave balance..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Manage Leave Balance</h1>
                    <button
                        className={styles.backBtn}
                        onClick={() => router.push('/leave')}
                    >
                        ← Back to Leave
                    </button>
                </div>

                <div className={styles.formCard}>
                    <h2>Update Employee Leave Balance</h2>
                    <p className={styles.description}>
                        Select an employee and update their leave balance for the specified year and leave type.
                    </p>

                    {message.text && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="employee">Employee *</label>
                            <select
                                id="employee"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                required
                                className={styles.select}
                            >
                                <option value="">-- Select Employee --</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.first_name} {employee.last_name} 
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="year">Year *</label>
                                <input
                                    id="year"
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    required
                                    min="2020"
                                    max="2100"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="leave_type">Leave Type *</label>
                                <select
                                    id="leave_type"
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    required
                                    className={styles.select}
                                >
                                    <option value="Earned">Earned Leave</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="UnPaid">Unpaid Leave</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="remaining_days">Remaining Days *</label>
                            <input
                                id="remaining_days"
                                type="number"
                                value={formData.remaining_days}
                                onChange={(e) => setFormData({ ...formData, remaining_days: e.target.value, year: formData.year || new Date().getFullYear().toString() })}
                                required
                                min="0"
                                max="365"
                                step="0.5"
                                className={styles.input}
                                placeholder="Enter number of remaining days (e.g., 1.5, 2.5)"
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : 'Update Leave Balance'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
