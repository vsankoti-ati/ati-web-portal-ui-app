'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './timesheet-reports.module.css';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email_id: string;
    phone_number: string;
    is_active: boolean;
    geo_location: string;
    admin_comments: string;
}

interface TimeEntry {
    projectId: string;
    projectName: string;
    entryDate: string;
    hours: number;
    description: string;
}

interface Timesheet {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    status: string;
    submissionDate?: string;
    approvalDate?: string;
    totalHours: number;
    timeEntries: TimeEntry[];
}

interface ProjectSummary {
    projectId: string;
    projectName: string;
    totalHours: number;
    timesheetCount: number;
}

interface MonthSummary {
    month: string;
    totalHours: number;
    timesheetCount: number;
}

interface UserReport {
    user: {
        userId: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        employeeId: string;
    };
    reportPeriod: {
        startDate: string;
        endDate: string;
    };
    timesheets: Timesheet[];
    summary: {
        totalTimesheets: number;
        approvedTimesheets: number;
        submittedTimesheets: number;
        draftTimesheets: number;
        totalHours: number;
        approvedHours: number;
        averageHoursPerWeek: number;
        byProject: ProjectSummary[];
        byMonth: MonthSummary[];
    };
}

interface ReportData {
    reports: UserReport[];
    generatedAt: string;
    generatedBy: {
        userId: string;
        username: string;
        role: string;
    };
    totalUsers: number;
}

export default function TimesheetReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // Employee filter states
    const [allEmployees, setAllEmployees] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    
    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [includeEntries, setIncludeEntries] = useState(true);
    const [groupBy, setGroupBy] = useState<'week' | 'month'>('week');
    const [error, setError] = useState('');

    const statuses = ['approved', 'submitted', 'draft'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
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
                if (data.role !== 'Admin') {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // Fetch employees for dropdown if user is Admin
                setLoadingEmployees(true);
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error('Failed to fetch employees');
                        }
                        return res.json();
                    })
                    .then((employeesData) => {
                        console.log('Fetched employees:', employeesData);
                        setEmployees(Array.isArray(employeesData) ? employeesData : []);
                    })
                    .catch((error) => {
                        console.error('Error fetching employees:', error);
                    })
                    .finally(() => {
                        setLoadingEmployees(false);
                        setLoading(false);
                    });
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                }
                setLoading(false);
            });
    }, [router]);

    // Fetch user details when employee is selected
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !selectedEmployeeId || allEmployees) {
            setSelectedUserId('');
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/employee/${selectedEmployeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch user details');
                }
                return res.json();
            })
            .then((data) => {
                if (data && data.id) {
                    setSelectedUserId(data.id);
                } else {
                    console.error('User data missing id:', data);
                    setSelectedUserId('');
                }
            })
            .catch((error) => {
                console.error('Error fetching user details:', error);
                setSelectedUserId('');
            });
    }, [selectedEmployeeId, allEmployees]);

    const handleGenerateReport = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            const requestBody: any = {
                userIds: allEmployees ? [] : (selectedUserId ? [selectedUserId] : []),
                includeEntries,
                groupBy,
            };

            if (startDate) requestBody.startDate = startDate;
            if (endDate) requestBody.endDate = endDate;
            if (selectedStatuses.length > 0) requestBody.status = selectedStatuses;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/timesheets/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
            } else {
                setError('Failed to generate report');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while generating the report');
        } finally {
            setGenerating(false);
        }
    };

    const downloadCSV = () => {
        if (!reportData) return;

        const rows: string[][] = [];

        reportData.reports.forEach((report, reportIndex) => {
            // Add employee summary header
            if (reportIndex > 0) {
                rows.push([]); // Empty row for separation
            }
            
            rows.push(['Employee Summary']);
            rows.push(['Employee ID', report.user.employeeId]);
            rows.push(['Name', `${report.user.firstName} ${report.user.lastName}`]);
            rows.push(['Email', report.user.email]);
            rows.push(['Report Period', `${report.reportPeriod.startDate} to ${report.reportPeriod.endDate}`]);
            rows.push([]);

            // Add summary section
            rows.push(['Summary']);
            rows.push(['Total Timesheets', report.summary.totalTimesheets.toString()]);
            rows.push(['Approved', report.summary.approvedTimesheets.toString()]);
            rows.push(['Submitted', report.summary.submittedTimesheets.toString()]);
            rows.push(['Draft', report.summary.draftTimesheets.toString()]);
            rows.push(['Total Hours', report.summary.totalHours.toFixed(2)]);
            rows.push(['Approved Hours', report.summary.approvedHours.toFixed(2)]);
            rows.push(['Avg Hours/Week', report.summary.averageHoursPerWeek.toFixed(2)]);
            rows.push([]);

            // Add project breakdown
            if (report.summary.byProject && report.summary.byProject.length > 0) {
                rows.push(['Project Breakdown']);
                rows.push(['Project Name', 'Total Hours', 'Timesheet Count']);
                report.summary.byProject.forEach(project => {
                    rows.push([
                        project.projectName,
                        project.totalHours.toFixed(2),
                        project.timesheetCount.toString()
                    ]);
                });
                rows.push([]);
            }

            // Add timesheets with time entries if included
            if (report.timesheets && report.timesheets.length > 0) {
                rows.push(['Timesheets']);
                report.timesheets.forEach((timesheet, idx) => {
                    rows.push([
                        `Timesheet ${idx + 1}`,
                        `Week: ${timesheet.weekStartDate} to ${timesheet.weekEndDate}`,
                        `Status: ${timesheet.status}`,
                        `Total Hours: ${timesheet.totalHours.toFixed(2)}`
                    ]);
                    
                    // Add time entries if included
                    if (includeEntries && timesheet.timeEntries && timesheet.timeEntries.length > 0) {
                        rows.push(['', 'Date', 'Project', 'Hours', 'Description']);
                        timesheet.timeEntries.forEach(entry => {
                            rows.push([
                                '',
                                entry.entryDate,
                                entry.projectName,
                                entry.hours.toFixed(2),
                                entry.description || ''
                            ]);
                        });
                    }
                    rows.push([]);
                });
            }
        });

        // Convert to CSV string
        const csvContent = rows.map(row => 
            row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleRow = (userId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedRows(newExpanded);
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading..." />;
    }

    if (accessDenied) {
        return (
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.accessDenied}>
                        <h2>Access Denied</h2>
                        <p>You do not have permission to view this page. Only administrators can access reports.</p>
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
            <div className={`${styles.container} reportScrollable`}>
                <header className={styles.header}>
                    <h1>Timesheet Reports</h1>
                    <p>Generate comprehensive timesheet reports for all employees</p>
                </header>

                <div className={styles.reportForm}>
                    <h2>Report Configuration</h2>
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={allEmployees}
                                    onChange={(e) => {
                                        setAllEmployees(e.target.checked);
                                        if (e.target.checked) {
                                            setSelectedEmployeeId('');
                                            setSelectedUserId('');
                                        }
                                    }}
                                />
                                <span>All</span>
                            </label>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="employeeSelect">Employee</label>
                            <select
                                id="employeeSelect"
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                disabled={allEmployees || loadingEmployees}
                                className={styles.input}
                            >
                                <option value="">Select an employee</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} - {emp.email_id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="startDate">Start Date (Optional)</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="endDate">End Date (Optional)</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Status Filter (Optional)</label>
                        <div className={styles.checkboxGroup}>
                            {statuses.map(status => (
                                <label key={status} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => handleStatusChange(status)}
                                    />
                                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Group By</label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    value="week"
                                    checked={groupBy === 'week'}
                                    onChange={(e) => setGroupBy(e.target.value as 'week' | 'month')}
                                />
                                <span>Week</span>
                            </label>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    value="month"
                                    checked={groupBy === 'month'}
                                    onChange={(e) => setGroupBy(e.target.value as 'week' | 'month')}
                                />
                                <span>Month</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={includeEntries}
                                onChange={(e) => setIncludeEntries(e.target.checked)}
                            />
                            <span>Include Time Entries</span>
                        </label>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.generateBtn}
                        onClick={handleGenerateReport}
                        disabled={generating}
                    >
                        {generating ? 'Generating Report...' : 'Generate Report'}
                    </button>
                </div>

                {reportData && (
                    <div className={styles.reportResults}>
                        <div className={styles.reportHeader}>
                            <div>
                                <h2>Report Results</h2>
                                <div className={styles.reportMeta}>
                                    <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                                    <p>Total Users: {reportData.totalUsers}</p>
                                    <p>Generated By: {reportData.generatedBy.username} ({reportData.generatedBy.role})</p>
                                </div>
                            </div>
                            <button className={styles.downloadBtn} onClick={downloadCSV}>
                                📥 Download CSV
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className={styles.summaryCards}>
                            <div className={styles.card}>
                                <h3>Total Employees</h3>
                                <div className={styles.cardValue}>{reportData.totalUsers}</div>
                            </div>
                            <div className={styles.card}>
                                <h3>Total Timesheets</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.totalTimesheets, 0)}
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3>Total Hours</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.totalHours, 0).toFixed(1)}
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3>Approved Hours</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.approvedHours, 0).toFixed(1)}
                                </div>
                            </div>
                        </div>

                        {/* User Reports Table */}
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Employee ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Timesheets</th>
                                        <th>Approved</th>
                                        <th>Submitted</th>
                                        <th>Draft</th>
                                        <th>Total Hours</th>
                                        <th>Avg Hours/Week</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.reports.map((report) => (
                                        <React.Fragment key={report.user.userId}>
                                            <tr className={styles.dataRow}>
                                                <td>
                                                    <button
                                                        className={styles.expandBtn}
                                                        onClick={() => toggleRow(report.user.userId)}
                                                    >
                                                        {expandedRows.has(report.user.userId) ? '▼' : '▶'}
                                                    </button>
                                                </td>
                                                <td>{report.user.employeeId}</td>
                                                <td>{report.user.firstName} {report.user.lastName}</td>
                                                <td>{report.user.email}</td>
                                                <td>{report.summary.totalTimesheets}</td>
                                                <td>{report.summary.approvedTimesheets}</td>
                                                <td>{report.summary.submittedTimesheets}</td>
                                                <td>{report.summary.draftTimesheets}</td>
                                                <td>{report.summary.totalHours.toFixed(1)}</td>
                                                <td>{report.summary.averageHoursPerWeek.toFixed(1)}</td>
                                            </tr>
                                            {expandedRows.has(report.user.userId) && (
                                                <tr className={styles.expandedRow}>
                                                    <td colSpan={10}>
                                                        <div className={styles.detailsContainer}>
                                                            {/* Project Summary */}
                                                            {report.summary.byProject.length > 0 && (
                                                                <div className={styles.section}>
                                                                    <h4>Hours by Project</h4>
                                                                    <table className={styles.detailTable}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Project Name</th>
                                                                                <th>Total Hours</th>
                                                                                <th>Timesheet Count</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.summary.byProject.map((project, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td>{project.projectName}</td>
                                                                                    <td>{project.totalHours.toFixed(1)}</td>
                                                                                    <td>{project.timesheetCount}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Month Summary */}
                                                            {report.summary.byMonth.length > 0 && (
                                                                <div className={styles.section}>
                                                                    <h4>Hours by Month</h4>
                                                                    <table className={styles.detailTable}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Month</th>
                                                                                <th>Total Hours</th>
                                                                                <th>Timesheet Count</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.summary.byMonth.map((month, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td>{month.month}</td>
                                                                                    <td>{month.totalHours.toFixed(1)}</td>
                                                                                    <td>{month.timesheetCount}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}

                                                            {/* Timesheets */}
                                                            {report.timesheets.length > 0 && (
                                                                <div className={styles.section}>
                                                                    <h4>Timesheets</h4>
                                                                    <table className={styles.detailTable}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Week Start</th>
                                                                                <th>Week End</th>
                                                                                <th>Status</th>
                                                                                <th>Total Hours</th>
                                                                                <th>Submission Date</th>
                                                                                <th>Approval Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.timesheets.map((ts) => (
                                                                                <tr key={ts.id}>
                                                                                    <td>{new Date(ts.weekStartDate).toISOString().split('T')[0]}</td>
                                                                                    <td>{new Date(ts.weekEndDate).toISOString().split('T')[0]}</td>
                                                                                    <td>
                                                                                        <span className={`${styles.badge} ${styles[ts.status.toLowerCase()]}`}>
                                                                                            {ts.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>{ts.totalHours.toFixed(1)}</td>
                                                                                    <td>{ts.submissionDate ? new Date(ts.submissionDate).toISOString().split('T')[0] : '-'}</td>
                                                                                    <td>{ts.approvalDate ? new Date(ts.approvalDate).toISOString().split('T')[0] : '-'}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
