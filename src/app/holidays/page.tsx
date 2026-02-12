'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
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
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [userRole, setUserRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/holidays?year=${selectedYear}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setHolidays(data);
                } else {
                    console.error('Holidays response is not an array:', data);
                    setHolidays([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching holidays:', error);
                setHolidays([]);
            })
            .finally(() => setLoading(false));
    }, [router, selectedYear]);

    // Get unique clients from holidays
    const clients = Array.from(new Set(holidays.map((h) => h.client))).sort();

    // Filter holidays by selected client — only populate when a client is chosen
    const filteredHolidays = selectedClient
        ? holidays.filter((h) => h.client === selectedClient)
        : [];

    // Pagination calculations
    const totalPages = Math.ceil(filteredHolidays.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedHolidays = filteredHolidays.slice(startIndex, endIndex);

    // Reset to page 1 when year or client changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedYear, selectedClient]);

    const groupedHolidays = filteredHolidays.reduce((acc, holiday) => {
        const month = new Date(holiday.date).toLocaleString('default', { month: 'long' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<string, Holiday[]>);

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading holidays..." />;
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
                            <option value="">Select Client</option>
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
                             <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                           
                        </select>
                    </div>
                </div>

                {selectedClient === '' ? (
                    <div className={styles.empty}>Please select a client to view holidays for {selectedYear}</div>
                ) : filteredHolidays.length === 0 ? (
                    <div className={styles.empty}>No holidays found for {selectedClient} in {selectedYear}</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.holidayTable}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Occasion</th>
                                    <th>Client</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedHolidays.map((holiday) => (
                                    <tr key={holiday.id}>
                                        <td>
                                            <div className={styles.dateCell}>
                                                <span className={styles.dateNumber}>
                                                    {new Date(holiday.date).getDate()}
                                                </span>
                                                <span className={styles.monthName}>
                                                    {new Date(holiday.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={styles.weekdayCell}>
                                            {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </td>
                                        <td className={styles.occasionCell}>{holiday.occasion}</td>
                                        <td>{holiday.client}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationButtons}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className={styles.paginationInfo}>
                                    Page {currentPage} of {totalPages}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
