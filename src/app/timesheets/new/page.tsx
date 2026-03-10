'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './new-timesheet.module.css';

interface Project {
    id: string;
    name: string;
}

interface TimeEntry {
    project_id: string;
    sunday: number;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
}

export default function NewTimesheetPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entries, setEntries] = useState<TimeEntry[]>([{
        project_id: '',
        sunday: 0,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0
    }]);
    const [weekStart, setWeekStart] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Set default week start to current Sunday in local time
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        // Format as YYYY-MM-DD using local time
        const year = sunday.getFullYear();
        const month = String(sunday.getMonth() + 1).padStart(2, '0');
        const day = String(sunday.getDate()).padStart(2, '0');
        setWeekStart(`${year}-${month}-${day}`);

        // Fetch projects
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/projects/all`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setProjects(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    const addRow = () => {
        setEntries([...entries, {
            project_id: '',
            sunday: 0,
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0
        }]);
    };

    const removeRow = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: keyof TimeEntry, value: string | number) => {
        const updated = [...entries];
        updated[index] = { ...updated[index], [field]: value };
        setEntries(updated);
    };

    const calculateWeekDates = () => {
        if (!weekStart) return [];
        
        // Parse date as local time by adding time component
        const startDate = new Date(weekStart + 'T00:00:00');
        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            weekDates.push(currentDate);
        }
        
        return weekDates;
    };

    const formatDateToMMDD = (date: Date): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    };

    const calculateTotal = (entry: TimeEntry) => {
        return entry.sunday + entry.monday + entry.tuesday + entry.wednesday +
            entry.thursday + entry.friday + entry.saturday;
    };

    const calculateDayTotal = (day: keyof Omit<TimeEntry, 'project_id'>) => {
        return entries.reduce((sum, entry) => sum + (entry[day] || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        const weekDates = calculateWeekDates();

        try {
            // Calculate week end date using local time
            const startDate = new Date(weekStart + 'T00:00:00');
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            
            // Format end date as YYYY-MM-DD using local time
            const endDateStr = endDate.getFullYear() + '-' + 
                String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(endDate.getDate()).padStart(2, '0');

            // Create timesheet
            const timesheetRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    week_start_date: weekStart,
                    week_end_date: endDateStr,
                }),
            });

            if (timesheetRes.ok) {
                const timesheet = await timesheetRes.json();

                // Add time entries
                for (const entry of entries) {
                    if (entry.project_id) {
                        // Map UI columns to correct weekday offsets (Mon=0, ..., Fri=4)
                        const days = [
                            { key: 'monday', offset: 1 },
                            { key: 'tuesday', offset: 2 },
                            { key: 'wednesday', offset: 3 },
                            { key: 'thursday', offset: 4 },
                            { key: 'friday', offset: 5 }
                        ];
                        for (const { key, offset } of days) {
                            const hours = entry[key as keyof Omit<TimeEntry, 'project_id'>];
                            if (hours > 0) {
                                // Use local time for consistency
                                const base = new Date(weekStart + 'T00:00:00');
                                base.setDate(base.getDate() + offset);
                                const localDateStr = base.getFullYear() + '-' + String(base.getMonth() + 1).padStart(2, '0') + '-' + String(base.getDate()).padStart(2, '0');
                                await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/entries`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                        timesheet_id: timesheet.id,
                                        project_id: entry.project_id,
                                        entry_date: localDateStr,
                                        start_time: '09:00:00',
                                        end_time: `${9 + hours}:00:00`,
                                        hours: hours,
                                        description: '',
                                    }),
                                });
                            }
                        }
                    }
                }

                router.push('/timesheets');
            } else {
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error creating timesheet:', error);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading projects..." />;
    }

    return (
        <DashboardLayout>
            {isSubmitting && <LoadingSpinner fullScreen message="Creating timesheet..." />}
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/timesheets')}>
                        ← Back to Timesheets
                    </button>
                    <h1>New Timesheet</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.weekSelector}>
                        <label>Week Starting (Sunday):</label>
                        <input
                            type="date"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.timesheetTable}>
                            <thead>
                                <tr>
                                    <th className={styles.projectCol}>Project</th>
                                    {calculateWeekDates().map((date, index) => (
                                        <th key={index}>{formatDateToMMDD(date)}</th>
                                    ))}
                                    <th>Total</th>
                                    <th className={styles.actionCol}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                value={entry.project_id}
                                                onChange={(e) => updateEntry(index, 'project_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Project</option>
                                                {projects?.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.sunday || ''}
                                                onChange={(e) => updateEntry(index, 'sunday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.monday || ''}
                                                onChange={(e) => updateEntry(index, 'monday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.tuesday || ''}
                                                onChange={(e) => updateEntry(index, 'tuesday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.wednesday || ''}
                                                onChange={(e) => updateEntry(index, 'wednesday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.thursday || ''}
                                                onChange={(e) => updateEntry(index, 'thursday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.friday || ''}
                                                onChange={(e) => updateEntry(index, 'friday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={entry.saturday || ''}
                                                onChange={(e) => updateEntry(index, 'saturday', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className={styles.totalCell}>{calculateTotal(entry)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={() => removeRow(index)}
                                                disabled={entries.length === 1}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className={styles.totalRow}>
                                    <td><strong>Daily Total</strong></td>
                                    <td><strong>{calculateDayTotal('sunday')}</strong></td>
                                    <td><strong>{calculateDayTotal('monday')}</strong></td>
                                    <td><strong>{calculateDayTotal('tuesday')}</strong></td>
                                    <td><strong>{calculateDayTotal('wednesday')}</strong></td>
                                    <td><strong>{calculateDayTotal('thursday')}</strong></td>
                                    <td><strong>{calculateDayTotal('friday')}</strong></td>
                                    <td><strong>{calculateDayTotal('saturday')}</strong></td>
                                    <td className={styles.grandTotal}>
                                        <strong>
                                            {entries.reduce((sum, entry) => sum + calculateTotal(entry), 0)}
                                        </strong>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <button type="button" className={styles.addRowBtn} onClick={addRow}>
                        + Add Project Row
                    </button>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => router.push('/timesheets')}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            Save as Draft
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
