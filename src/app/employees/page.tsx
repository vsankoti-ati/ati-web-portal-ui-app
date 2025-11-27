'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
        fetch('http://localhost:3001/auth/profile', {
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
                fetch('http://localhost:3001/employees', {
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
        return <div className={styles.loading}>Loading...</div>;
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

                <div className={styles.employeeGrid}>
                    {filteredEmployees.map((emp) => (
                        <div
                            key={emp.id}
                            className={styles.employeeCard}
                            onClick={() => router.push(`/employees/${emp.id}`)}
                        >
                            <div className={styles.avatar}>
                                {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                            </div>
                            <div className={styles.info}>
                                <h3>{emp.first_name || ''} {emp.last_name || ''}</h3>
                                <p className={styles.role}>{emp.role || 'N/A'}</p>
                                <p className={styles.email}>{emp.email_id || 'N/A'}</p>
                                <p className={styles.phone}>{emp.phone_number || 'N/A'}</p>
                            </div>
                            <div className={`${styles.status} ${emp.is_active ? styles.active : styles.inactive}`}>
                                {emp.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredEmployees.length === 0 && (
                    <div className={styles.empty}>No employees found</div>
                )}
            </div>
        </DashboardLayout>
    );
}
