'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './new-holidays.module.css';

interface HolidayRow {
    id: string;
    date: string;
    occasion: string;
    client: string;
}

export default function NewHolidaysPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [client, setClient] = useState('');
    const [holidays, setHolidays] = useState<HolidayRow[]>([
        { id: '1', date: '', occasion: '', client: '' },
    ]);

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
            .then((res) => res.json())
            .then((data) => {
                setUserRole(data.role);
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    router.push('/holidays');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    const addRow = () => {
        const newId = (holidays.length + 1).toString();
        setHolidays([...holidays, { id: newId, date: '', occasion: '', client: '' }]);
    };

    const removeRow = (id: string) => {
        if (holidays.length > 1) {
            setHolidays(holidays.filter((h) => h.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof HolidayRow, value: string) => {
        setHolidays(
            holidays?.map((h) => (h.id === id ? { ...h, [field]: value } : h))
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        
        // Filter out empty rows
        const validHolidays = holidays.filter(
            (h) => h.date && h.occasion && (h.client || client)
        );

        if (validHolidays.length === 0) {
            alert('Please add at least one holiday with date and occasion');
            setIsSubmitting(false);
            return;
        }

        if (!client && validHolidays.some((h) => !h.client)) {
            alert('Please specify a client');
            setIsSubmitting(false);
            return;
        }

        try {
            const holidaysToSubmit = validHolidays.map((h) => ({
                year,
                client: h.client || client,
                date: h.date,
                occasion: h.occasion,
            }));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/holidays`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ holidays: holidaysToSubmit }),
            });

            if (res.ok) {
                alert(`Successfully added ${validHolidays.length} holiday(s)`);
                router.push('/holidays');
            } else {
                alert('Failed to add holidays');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error adding holidays:', error);
            alert('Error adding holidays');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading..." />;
    }

    if (userRole !== 'Admin' && userRole !== 'HR') {
        return null;
    }

    return (
        <DashboardLayout>
            {isSubmitting && <LoadingSpinner fullScreen message="Saving holidays..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button
                        className={styles.backBtn}
                        onClick={() => router.push('/holidays')}
                    >
                        ← Back to Holidays
                    </button>
                    <h1>Add Holidays for {year}</h1>
                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '💾 Saving...' : '💾 Submit All'}
                    </button>
                </div>

                <div className={styles.formCard}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className={styles.input}
                                aria-label="Year"
                            >
                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Default Client (optional)</label>
                            <input
                                type="text"
                                value={client}
                                onChange={(e) => setClient(e.target.value)}
                                placeholder="Leave blank to specify per row"
                                className={styles.input}
                                aria-label="Default Client"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <button className={styles.addRowBtn} onClick={addRow}>
                            + Add Row
                        </button>
                    </div>

                    <div className={styles.excelTable}>
                        <div className={styles.tableHeaderRow}>
                            <div className={styles.colIndex}>#</div>
                            <div className={styles.colDate}>Date</div>
                            <div className={styles.colOccasion}>Occasion</div>
                            <div className={styles.colClient}>Client</div>
                            <div className={styles.colActions}>Actions</div>
                        </div>

                        {holidays?.map((holiday, index) => (
                            <div key={holiday.id} className={styles.tableRow}>
                                <div className={styles.colIndex}>{index + 1}</div>
                                <div className={styles.colDate}>
                                    <input
                                        type="date"
                                        value={holiday.date}
                                        onChange={(e) =>
                                            updateRow(holiday.id, 'date', e.target.value)
                                        }
                                        className={styles.cellInput}
                                        aria-label={`Date for row ${index + 1}`}
                                    />
                                </div>
                                <div className={styles.colOccasion}>
                                    <input
                                        type="text"
                                        value={holiday.occasion}
                                        onChange={(e) =>
                                            updateRow(holiday.id, 'occasion', e.target.value)
                                        }
                                        placeholder="e.g., Independence Day"
                                        className={styles.cellInput}
                                        aria-label={`Occasion for row ${index + 1}`}
                                    />
                                </div>
                                <div className={styles.colClient}>
                                    <input
                                        type="text"
                                        value={holiday.client}
                                        onChange={(e) =>
                                            updateRow(holiday.id, 'client', e.target.value)
                                        }
                                        placeholder={client || 'Client name'}
                                        className={styles.cellInput}
                                        aria-label={`Client for row ${index + 1}`}
                                    />
                                </div>
                                <div className={styles.colActions}>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => removeRow(holiday.id)}
                                        disabled={holidays.length === 1}
                                        aria-label={`Delete row ${index + 1}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.tableFooter}>
                        <p className={styles.rowCount}>
                            Total rows: {holidays.length}
                        </p>
                        <button className={styles.addRowBtn} onClick={addRow}>
                            + Add Row
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
