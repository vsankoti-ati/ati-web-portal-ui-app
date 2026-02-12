'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmployeeLocation } from '../employee-location.enum';
import styles from './new-employee.module.css';

export default function NewEmployeePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        role: '',
        email_id: '',
        phone_number: '',
        date_of_birth: '',
        date_of_joining: '',
        is_active: true,
        geo_location: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/employees');
            } else {
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            {isSubmitting && <LoadingSpinner fullScreen message="Creating employee..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/employees')}>
                        ← Back to Employees
                    </button>
                    <h1>Add New Employee</h1>
                </div>

                <div className={styles.formCard}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.section}>
                            <h2>Personal Information</h2>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Date of Birth *</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h2>Contact Information</h2>
                            <div className={styles.formGroup}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email_id}
                                    onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h2>Employment Details</h2>
                            <div className={styles.formGroup}>
                                <label>Role *</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g., Software Engineer, HR Manager"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date of Joining *</label>
                                <input
                                    type="date"
                                    value={formData.date_of_joining}
                                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Location *</label>
                                <select
                                    className={styles.selectInput}
                                    title="Employee Location"
                                    value={formData.geo_location}
                                    onChange={(e) => setFormData({ ...formData, geo_location: e.target.value })}
                                    required
                                >
                                    <option value="">Select Location</option>
                                    <option value={EmployeeLocation.INDIA}>{EmployeeLocation.INDIA}</option>
                                    <option value={EmployeeLocation.USA}>{EmployeeLocation.USA}</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span>Active Employee</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => router.push('/employees')} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
