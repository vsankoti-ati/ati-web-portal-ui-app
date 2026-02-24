'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './leave-reports.module.css';

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
    
    // Employee filter states
    const [allEmployees, setAllEmployees] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    
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

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/user/employee/${selectedEmployeeId}`, {
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
            rows.push(['Total Applications', report.summary.totalApplications.toString()]);
            rows.push(['Approved', report.summary.approvedApplications.toString()]);
            rows.push(['Pending', report.summary.pendingApplications.toString()]);
            rows.push(['Rejected', report.summary.rejectedApplications.toString()]);
            rows.push(['Days Requested', report.summary.totalDaysRequested.toString()]);
            rows.push(['Days Approved', report.summary.totalDaysApproved.toString()]);
            rows.push([]);

            // Add leave balance if included
            if (includeBalance && report.leaveBalance && report.leaveBalance.length > 0) {
                rows.push(['Leave Balance']);
                rows.push(['Leave Type', 'Year', 'Total Days', 'Used Days', 'Remaining Days']);
                report.leaveBalance.forEach(balance => {
                    rows.push([
                        balance.leaveType,
                        balance.year.toString(),
                        balance.totalDays.toString(),
                        balance.usedDays.toString(),
                        balance.remainingDays.toString()
                    ]);
                });
                rows.push([]);
            }

            // Add leave applications if included
            if (includeApplications && report.leaveApplications && report.leaveApplications.length > 0) {
                rows.push(['Leave Applications']);
                rows.push(['Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied Date', 'Reason', 'Approver', 'Approved Date', 'Comments']);
                report.leaveApplications.forEach(app => {
                    rows.push([
                        app.leaveType,
                        app.startDate,
                        app.endDate,
                        app.daysRequested.toString(),
                        app.status,
                        app.appliedDate,
                        app.reason || '',
                        app.approverName || '',
                        app.approvedDate || '',
                        app.approverComments || ''
                    ]);
                });
                rows.push([]);
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
            <div className={`${styles.container} reportScrollable`}>
                <header className={styles.header}>
                    <h1>Leave Reports</h1>
                    <p>Generate comprehensive leave reports for all employees</p>
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
                                                                                    <td>{new Date(app.startDate).toISOString().split('T')[0]}</td>
                                                                                    <td>{new Date(app.endDate).toISOString().split('T')[0]}</td>
                                                                                    <td>{app.daysRequested}</td>
                                                                                    <td>
                                                                                        <span className={`${styles.badge} ${styles[app.status.toLowerCase()]}`}>
                                                                                            {app.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>{new Date(app.appliedDate).toISOString().split('T')[0]}</td>
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
