'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './all-balances.module.css';

interface BalanceData {
    leaveType: string;
    year: number;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

interface EmployeeBalance {
    userId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    balances: BalanceData[];
}

interface FlattenedBalance {
    firstName: string;
    lastName: string;
    earnedLeave: {
        totalDays: number;
        usedDays: number;
        remainingDays: number;
    } | null;
    holidayLeave: {
        totalDays: number;
        usedDays: number;
        remainingDays: number;
    } | null;
    lastUpdated: string;
}

export default function AllBalancesPage() {
    const router = useRouter();
    const [balances, setBalances] = useState<FlattenedBalance[]>([]);
    const [filteredBalances, setFilteredBalances] = useState<FlattenedBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const pageSize = 5;

    // Generate year options (current year and previous 2 years)
    const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Check user role first
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
                // Only Admin and HR can access this page
                if (data.role !== 'Admin' && data.role !== 'HR') {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // Fetch all employee balances
                fetchBalances(token, selectedYear);
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error('Error fetching profile:', error);
                    setLoading(false);
                }
            });
    }, [router, selectedYear]);

    const fetchBalances = (token: string, year: number) => {
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leave/balances/all?year=${year}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch balances');
                }
                return res.json();
            })
            .then((data: EmployeeBalance[]) => {
                // Flatten and group the data structure by employee
                const employeeMap = new Map<string, FlattenedBalance>();
                
                data.forEach((employee) => {
                    const key = `${employee.firstName}-${employee.lastName}`;
                    
                    if (!employeeMap.has(key)) {
                        employeeMap.set(key, {
                            firstName: employee.firstName,
                            lastName: employee.lastName,
                            earnedLeave: null,
                            holidayLeave: null,
                            lastUpdated: new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            }),
                        });
                    }
                    
                    const empData = employeeMap.get(key)!;
                    
                    employee.balances.forEach((balance) => {
                        if (balance.leaveType.toLowerCase() === 'earned') {
                            empData.earnedLeave = {
                                totalDays: balance.totalDays,
                                usedDays: balance.usedDays,
                                remainingDays: balance.remainingDays,
                            };
                        } else if (balance.leaveType.toLowerCase() === 'holiday') {
                            empData.holidayLeave = {
                                totalDays: balance.totalDays,
                                usedDays: balance.usedDays,
                                remainingDays: balance.remainingDays,
                            };
                        }
                    });
                });
                
                const flattened = Array.from(employeeMap.values());
                setBalances(flattened);
                setFilteredBalances(flattened);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching balances:', error);
                setBalances([]);
                setFilteredBalances([]);
                setLoading(false);
            });
    };

    // Filter balances based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredBalances(balances);
            setCurrentPage(1);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = balances.filter((balance) =>
            balance.firstName.toLowerCase().includes(term) ||
            balance.lastName.toLowerCase().includes(term)
        );
        setFilteredBalances(filtered);
        setCurrentPage(1);
    }, [searchTerm, balances]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredBalances.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBalances = filteredBalances.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(parseInt(e.target.value));
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading employee balances..." />;
    }

    if (accessDenied) {
        return (
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.accessDenied}>
                        <h2>Access Denied</h2>
                        <p>You don't have permission to view this page. This page is only accessible to Admin and HR roles.</p>
                        <button className={styles.backBtn} onClick={() => router.push('/leave')}>
                            ← Back to Leave
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
                    <h1>All Employee Leave Balances</h1>
                    <button className={styles.backBtn} onClick={() => router.push('/leave')}>
                        ← Back to Leave
                    </button>
                </div>

                <div className={styles.filterSection}>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search by first name or last name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.yearFilter}>
                        <label htmlFor="yearSelect">Year: </label>
                        <select
                            id="yearSelect"
                            value={selectedYear}
                            onChange={handleYearChange}
                            className={styles.yearSelect}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.statsSection}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Total Employees</div>
                        <div className={styles.statValue}>{filteredBalances.length}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Year</div>
                        <div className={styles.statValue}>{selectedYear}</div>
                    </div>
                </div>

                {filteredBalances.length === 0 ? (
                    <div className={styles.noData}>
                        <p>{searchTerm ? 'No balances found matching your search.' : 'No balance data available.'}</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.balanceTable}>
                                <thead>
                                    <tr>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th colSpan={3}>Earned Leave</th>
                                        <th colSpan={3}>Holiday Leave</th>
                                        <th>Last Updated</th>
                                    </tr>
                                    <tr>
                                        <th></th>
                                        <th></th>
                                        <th>Total</th>
                                        <th>Used</th>
                                        <th>Balance</th>
                                        <th>Total</th>
                                        <th>Used</th>
                                        <th>Balance</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBalances.map((balance, index) => (
                                        <tr key={`${balance.firstName}-${balance.lastName}-${index}`}>
                                            <td>{balance.firstName}</td>
                                            <td>{balance.lastName}</td>
                                            {balance.earnedLeave ? (
                                                <>
                                                    <td>{balance.earnedLeave.totalDays}</td>
                                                    <td>{balance.earnedLeave.usedDays}</td>
                                                    <td>
                                                        <span className={styles.balanceBadge}>
                                                            {balance.earnedLeave.remainingDays} days
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>-</td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                </>
                                            )}
                                            {balance.holidayLeave ? (
                                                <>
                                                    <td>{balance.holidayLeave.totalDays}</td>
                                                    <td>{balance.holidayLeave.usedDays}</td>
                                                    <td>
                                                        <span className={styles.balanceBadge}>
                                                            {balance.holidayLeave.remainingDays} days
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>-</td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                </>
                                            )}
                                            <td>{balance.lastUpdated}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={styles.paginationBtn}
                                >
                                    Previous
                                </button>
                                <div className={styles.pageInfo}>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={styles.paginationBtn}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
