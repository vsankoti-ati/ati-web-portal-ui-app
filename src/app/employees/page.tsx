'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './employees.module.css';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email_id: string;
    phone_number: string;
    is_active: boolean;
    employee_status?: string;
    geo_location: string;
    admin_comments: string;
}

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    
    // Status Update Modal States
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [adminComments, setAdminComments] = useState('');
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchEmployees = (includeInactive: boolean) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees?includeInActive=${includeInactive}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setEmployees(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

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

                // Fetch employees only if authorized
                fetchEmployees(includeInactive);
            })
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error('Error fetching profile:', error);
                    setLoading(false);
                }
            });
    }, [router, includeInactive]);

    const handleIncludeInactiveChange = (checked: boolean) => {
        setIncludeInactive(checked);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const filteredEmployees = employees.filter((emp) =>
        emp && emp.first_name && emp.last_name && emp.email_id &&
        `${emp.first_name} ${emp.last_name} ${emp.email_id}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredEmployees.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenStatusModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        // Use employee_status if available, otherwise fallback to is_active
        setSelectedStatus(employee.employee_status || (employee.is_active ? 'Active' : 'InActive'));
        setAdminComments('');
        setIsStatusModalOpen(true);
    };

    const handleCloseStatusModal = () => {
        setIsStatusModalOpen(false);
        setSelectedEmployee(null);
        setSelectedStatus('');
        setAdminComments('');
    };

    const handleStatusUpdate = async () => {
        if (!selectedEmployee || !selectedStatus) {
            alert('Please select a status');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setIsSubmittingStatus(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${selectedEmployee.id}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employee_status: selectedStatus,
                        admin_comments: adminComments,
                    }),
                }
            );

            if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to update employee status');
            }

            // Update the local state with the new status
            setEmployees((prevEmployees) =>
                prevEmployees.map((emp) =>
                    emp.id === selectedEmployee.id
                        ? { 
                            ...emp, 
                            is_active: selectedStatus === 'Active', 
                            employee_status: selectedStatus,
                            admin_comments: adminComments 
                          }
                        : emp
                )
            );
            
            handleCloseStatusModal();
        } catch (error) {
            console.error('Error updating employee status:', error);
            alert('Failed to update employee status. Please try again.');
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading employees..." />;
    }

    if (accessDenied) {
        return (
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.accessDenied}>
                        <h2>Access Denied</h2>
                        <p>You do not have permission to view this page.</p>
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
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Employee Management</h1>
                    <button className={styles.addBtn} onClick={() => router.push('/employees/new')}>
                        + Add Employee
                    </button>
                </div>

                <div className={styles.filterSection}>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.checkboxFilter}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={includeInactive}
                                onChange={(e) => handleIncludeInactiveChange(e.target.checked)}
                            />
                            <span>Include Inactive</span>
                        </label>
                    </div>
                </div>

                {filteredEmployees.length === 0 ? (
                    <div className={styles.empty}>No employees found</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.employeeTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEmployees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className={styles.nameCell}>
                                                <div className={styles.avatar}>
                                                    {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                                                </div>
                                                <span className={styles.employeeName}>
                                                    {emp.first_name || ''} {emp.last_name || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{emp.role || 'N/A'}</td>
                                        <td>{emp.email_id || 'N/A'}</td>
                                        <td>{emp.phone_number || 'N/A'}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${
                                                emp.employee_status === 'Active' || (emp.is_active && !emp.employee_status) 
                                                    ? styles.active 
                                                    : emp.employee_status === 'Terminate' 
                                                    ? styles.terminated 
                                                    : styles.inactive
                                            }`}>
                                                {emp.employee_status || (emp.is_active ? 'Active' : 'Inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={() => router.push(`/employees/${emp.id}`)}
                                                >
                                                    View Details
                                                </button>
                                                {userRole === 'Admin' && (
                                                    <button
                                                        className={styles.updateStatusBtn}
                                                        onClick={() => handleOpenStatusModal(emp)}
                                                    >
                                                        Update Status
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={styles.pageBtn}
                                >
                                    Previous
                                </button>
                                <div className={styles.pageNumbers}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={styles.pageBtn}
                                >
                                    Next
                                </button>
                                <span className={styles.pageInfo}>
                                    Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {isStatusModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseStatusModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Update Employee Status</h2>
                            <button className={styles.closeBtn} onClick={handleCloseStatusModal}>
                                ×
                            </button>
                        </div>
                        
                        {selectedEmployee && (
                            <div className={styles.modalBody}>
                                <div className={styles.employeeInfo}>
                                    <strong>Employee:</strong> {selectedEmployee.first_name} {selectedEmployee.last_name}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="status">Status *</label>
                                    <select
                                        id="status"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className={styles.selectInput}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="InActive">InActive</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="adminComments">Admin Comments</label>
                                    <textarea
                                        id="adminComments"
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        className={styles.textareaInput}
                                        rows={4}
                                        placeholder="Enter any comments about this status change..."
                                    />
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={handleCloseStatusModal}
                                        disabled={isSubmittingStatus}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={styles.submitBtn}
                                        onClick={handleStatusUpdate}
                                        disabled={isSubmittingStatus}
                                    >
                                        {isSubmittingStatus ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
