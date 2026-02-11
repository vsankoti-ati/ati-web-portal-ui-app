'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './employees.module.css';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email_id: string;
    phone_number: string;
    is_active: boolean;
}

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Check user role first
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setUserRole(data.role);
                // Only Admin and HR can access this page
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // Fetch employees only if authorized
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => setEmployees(data))
                    .catch(console.error)
                    .finally(() => setLoading(false));
            })
            .catch(console.error);
    }, [router]);

    const filteredEmployees = employees.filter((emp) =>
        emp && emp.first_name && emp.last_name && emp.email_id &&
        `${emp.first_name} ${emp.last_name} ${emp.email_id}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading employees..." />;
    }

    if (accessDenied) {
        return (
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.accessDenied}>
                        <h2>Access Denied</h2>
                        <p>You do not have permission to view this page.</p>
                        <button className={styles.backBtn} onClick={() => router.push('/')}>
                            Go to Home
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Employee Management</h1>
                    <button className={styles.addBtn} onClick={() => router.push('/employees/new')}>
                        + Add Employee
                    </button>
                </div>

                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredEmployees.length === 0 ? (
                    <div className={styles.empty}>No employees found</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.employeeTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className={styles.nameCell}>
                                                <div className={styles.avatar}>
                                                    {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                                                </div>
                                                <span className={styles.employeeName}>
                                                    {emp.first_name || ''} {emp.last_name || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{emp.role || 'N/A'}</td>
                                        <td>{emp.email_id || 'N/A'}</td>
                                        <td>{emp.phone_number || 'N/A'}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${emp.is_active ? styles.active : styles.inactive}`}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => router.push(`/employees/${emp.id}`)}
                                            >
                                                View Details
                                            </button>
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
