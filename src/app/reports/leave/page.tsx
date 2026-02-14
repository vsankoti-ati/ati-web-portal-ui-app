'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './leave-reports.module.css';

interface LeaveBalance {
    leaveType: string;
    year: number;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

interface LeaveApplication {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    reason: string;
    status: string;
    appliedDate: string;
    approverName?: string;
    approvedDate?: string;
    approverComments?: string;
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
    leaveBalance: LeaveBalance[];
    leaveApplications: LeaveApplication[];
    summary: {
        totalApplications: number;
        approvedApplications: number;
        pendingApplications: number;
        rejectedApplications: number;
        totalDaysRequested: number;
        totalDaysApproved: number;
        byLeaveType: Record<string, any>;
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

export default function LeaveReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [includeBalance, setIncludeBalance] = useState(true);
    const [includeApplications, setIncludeApplications] = useState(true);
    const [error, setError] = useState('');

    const leaveTypes = ['Earned', 'Holiday', 'UnPaid'];
    const statuses = ['Approved', 'Pending', 'Rejected'];

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
                }
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                }
            })
            .finally(() => setLoading(false));
    }, [router]);

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
                userIds: [], // Empty array means all users
                includeBalance,
                includeApplications,
            };

            if (startDate) requestBody.startDate = startDate;
            if (endDate) requestBody.endDate = endDate;
            if (selectedLeaveTypes.length > 0) requestBody.leaveTypes = selectedLeaveTypes;
            if (selectedStatuses.length > 0) requestBody.status = selectedStatuses;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/reports/generate`, {
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

        // Create CSV header
        const headers = ['Employee ID', 'Name', 'Email', 'Total Applications', 'Approved', 'Pending', 'Rejected', 'Days Requested', 'Days Approved'];
        const rows = [headers];

        // Add data rows
        reportData.reports.forEach(report => {
            const row = [
                report.user.employeeId,
                `${report.user.firstName} ${report.user.lastName}`,
                report.user.email,
                report.summary.totalApplications.toString(),
                report.summary.approvedApplications.toString(),
                report.summary.pendingApplications.toString(),
                report.summary.rejectedApplications.toString(),
                report.summary.totalDaysRequested.toString(),
                report.summary.totalDaysApproved.toString()
            ];
            rows.push(row);
        });

        // Convert to CSV string
        const csvContent = rows.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leave-report-${new Date().toISOString().split('T')[0]}.csv`);
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

    const handleLeaveTypeChange = (type: string) => {
        setSelectedLeaveTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
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
            <div className={styles.container} style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <header className={styles.header}>
                    <h1>Leave Reports</h1>
                    <p>Generate comprehensive leave reports for all employees</p>
                </header>

                <div className={styles.reportForm}>
                    <h2>Report Configuration</h2>
                    
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
                        <label>Leave Types (Optional)</label>
                        <div className={styles.checkboxGroup}>
                            {leaveTypes.map(type => (
                                <label key={type} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedLeaveTypes.includes(type)}
                                        onChange={() => handleLeaveTypeChange(type)}
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
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
                                    <span>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={includeBalance}
                                onChange={(e) => setIncludeBalance(e.target.checked)}
                            />
                            <span>Include Leave Balance</span>
                        </label>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={includeApplications}
                                onChange={(e) => setIncludeApplications(e.target.checked)}
                            />
                            <span>Include Leave Applications</span>
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
                    <div className={styles.reportResults} style={{ overflowX: 'auto', maxWidth: '1500px', boxSizing: 'border-box' }}>
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
                                <h3>Total Applications</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.totalApplications, 0)}
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3>Total Days Requested</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.totalDaysRequested, 0)}
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3>Total Days Approved</h3>
                                <div className={styles.cardValue}>
                                    {reportData.reports.reduce((sum, r) => sum + r.summary.totalDaysApproved, 0)}
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
                                        <th>Applications</th>
                                        <th>Approved</th>
                                        <th>Pending</th>
                                        <th>Rejected</th>
                                        <th>Days Requested</th>
                                        <th>Days Approved</th>
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
                                                <td>{report.summary.totalApplications}</td>
                                                <td>{report.summary.approvedApplications}</td>
                                                <td>{report.summary.pendingApplications}</td>
                                                <td>{report.summary.rejectedApplications}</td>
                                                <td>{report.summary.totalDaysRequested}</td>
                                                <td>{report.summary.totalDaysApproved}</td>
                                            </tr>
                                            {expandedRows.has(report.user.userId) && (
                                                <tr className={styles.expandedRow}>
                                                    <td colSpan={10}>
                                                        <div className={styles.detailsContainer}>
                                                            {includeBalance && report.leaveBalance.length > 0 && (
                                                                <div className={styles.section}>
                                                                    <h4>Leave Balance</h4>
                                                                    <table className={styles.detailTable}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Leave Type</th>
                                                                                <th>Year</th>
                                                                                <th>Total Days</th>
                                                                                <th>Used Days</th>
                                                                                <th>Remaining Days</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.leaveBalance.map((balance, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td>{balance.leaveType}</td>
                                                                                    <td>{balance.year}</td>
                                                                                    <td>{balance.totalDays}</td>
                                                                                    <td>{balance.usedDays}</td>
                                                                                    <td>{balance.remainingDays}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                            
                                                            {includeApplications && report.leaveApplications.length > 0 && (
                                                                <div className={styles.section}>
                                                                    <h4>Leave Applications</h4>
                                                                    <table className={styles.detailTable}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Leave Type</th>
                                                                                <th>Start Date</th>
                                                                                <th>End Date</th>
                                                                                <th>Days</th>
                                                                                <th>Status</th>
                                                                                <th>Applied Date</th>
                                                                                <th>Reason</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.leaveApplications.map((app) => (
                                                                                <tr key={app.id}>
                                                                                    <td>{app.leaveType}</td>
                                                                                    <td>{new Date(app.startDate).toLocaleDateString()}</td>
                                                                                    <td>{new Date(app.endDate).toLocaleDateString()}</td>
                                                                                    <td>{app.daysRequested}</td>
                                                                                    <td>
                                                                                        <span className={`${styles.badge} ${styles[app.status.toLowerCase()]}`}>
                                                                                            {app.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                                                                                    <td>{app.reason}</td>
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
