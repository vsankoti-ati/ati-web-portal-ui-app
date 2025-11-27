'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './employee-detail.module.css';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email_id: string;
    phone_number: string;
    date_of_birth: string;
    date_of_joining: string;
    is_active: boolean;
}

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        console.log(`Fetching employee ${params.id} with token`);
        fetch(`http://localhost:3001/employees/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
            .then((res) => {
                console.log(`Response status: ${res.status}`);
                if (!res.ok) {
                    if (res.status === 401) {
                        throw new Error('UNAUTHORIZED');
                    }
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log('Employee data received:', data);
                setEmployee(data);
                setFormData(data);
            })
            .catch((error) => {
                console.error('Error fetching employee:', error);

                // Handle network errors (API not running)
                if (error.message === 'Failed to fetch') {
                    console.error('Cannot connect to API server. Is it running on port 3001?');
                    alert('Cannot connect to server. Please ensure the API is running.');
                }
                // Handle unauthorized errors
                else if (error.message === 'UNAUTHORIZED' || error.message.includes('401')) {
                    console.error('Token is invalid or expired');
                    localStorage.removeItem('token');
                    router.push('/login');
                }
                // Handle other errors
                else {
                    console.error('Unexpected error:', error.message);
                }
            })
            .finally(() => setLoading(false));
    }, [router, params.id]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/employees/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const updated = await res.json();
            setEmployee(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Failed to update employee. Please try again.');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!employee) {
        return <div className={styles.error}>Employee not found</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/')}>
                        ← Back to Home
                    </button>
                    <div className={styles.actions}>
                        {!isEditing ? (
                            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button className={styles.cancelBtn} onClick={() => {
                                    setIsEditing(false);
                                    setFormData(employee);
                                }}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleSave}>
                                    Save Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        <div className={styles.avatar}>
                            {employee.first_name?.[0] || ''}{employee.last_name?.[0] || ''}
                        </div>
                        <div className={styles.profileInfo}>
                            {!isEditing ? (
                                <>
                                    <h1>{employee.first_name} {employee.last_name}</h1>
                                    <p className={styles.role}>{employee.role}</p>
                                </>
                            ) : (
                                <div className={styles.nameEdit}>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="First Name"
                                    />
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="Last Name"
                                    />
                                </div>
                            )}
                            <span className={`${styles.status} ${employee.is_active ? styles.active : styles.inactive}`}>
                                {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.details}>
                        <h2>Contact Information</h2>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <label>Email</label>
                                {!isEditing ? (
                                    <p>{employee.email_id}</p>
                                ) : (
                                    <input
                                        type="email"
                                        value={formData.email_id}
                                        onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
                                    />
                                )}
                            </div>
                            <div className={styles.detailItem}>
                                <label>Phone</label>
                                {!isEditing ? (
                                    <p>{employee.phone_number}</p>
                                ) : (
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>

                        <h2>Employment Details</h2>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <label>Role</label>
                                {!isEditing ? (
                                    <p>{employee.role}</p>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    />
                                )}
                            </div>
                            <div className={styles.detailItem}>
                                <label>Date of Joining</label>
                                {!isEditing ? (
                                    <p>{employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : 'N/A'}</p>
                                ) : (
                                    <input
                                        type="date"
                                        value={formData.date_of_joining}
                                        onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                                    />
                                )}
                            </div>
                            <div className={styles.detailItem}>
                                <label>Date of Birth</label>
                                {!isEditing ? (
                                    <p>{employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                ) : (
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
