'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './holidays.module.css';

interface Holiday {
    id: string;
    year: number;
    client: string;
    date: string;
    occasion: string;
}

export default function HolidaysPage() {
    const router = useRouter();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [userRole, setUserRole] = useState('');

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
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        fetch(`http://localhost:3001/holidays?year=${selectedYear}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setHolidays(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router, selectedYear]);

    // Get unique clients from holidays
    const clients = Array.from(new Set(holidays.map((h) => h.client))).sort();

    // Filter holidays by selected client
    const filteredHolidays = selectedClient === 'all' 
        ? holidays 
        : holidays.filter((h) => h.client === selectedClient);

    const groupedHolidays = filteredHolidays.reduce((acc, holiday) => {
        const month = new Date(holiday.date).toLocaleString('default', { month: 'long' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<string, Holiday[]>);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Holiday Calendar</h1>
                    <div className={styles.headerActions}>
                        {(userRole === 'Admin' || userRole === 'HR') && (
                            <button
                                className={styles.addBtn}
                                onClick={() => router.push('/holidays/new')}
                            >
                                + Add Holidays
                            </button>
                        )}
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className={styles.clientSelect}
                            aria-label="Select Client"
                        >
                            <option value="all">All Clients</option>
                            {clients.map((client) => (
                                <option key={client} value={client}>
                                    {client}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className={styles.yearSelect}
                            aria-label="Select Year"
                        >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>
                    </div>
                </div>

                <div className={styles.calendar}>
                    {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
                        <div key={month} className={styles.monthSection}>
                            <h2>{month}</h2>
                            <div className={styles.holidayList}>
                                {monthHolidays.map((holiday) => (
                                    <div key={holiday.id} className={styles.holidayCard}>
                                        <div className={styles.dateBox}>
                                            <span className={styles.day}>
                                                {new Date(holiday.date).getDate()}
                                            </span>
                                            <span className={styles.weekday}>
                                                {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                        </div>
                                        <div className={styles.holidayInfo}>
                                            <h3>{holiday.occasion}</h3>
                                            <p>{holiday.client}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredHolidays.length === 0 && (
                    <div className={styles.empty}>
                        No holidays found for {selectedClient === 'all' ? selectedYear : `${selectedClient} in ${selectedYear}`}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
