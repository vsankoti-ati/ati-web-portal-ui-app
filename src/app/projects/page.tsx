'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './projects.module.css';

interface Project {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string | null;
    status: string;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
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
            .then((data) => setUserRole(data.role))
            .catch((error) => {
                if (error.message !== 'Unauthorized') {
                    console.error(error);
                }
            });

        // Fetch projects
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProjects(data);
                } else {
                    console.error('Projects response is not an array:', data);
                    setProjects([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching projects:', error);
                setProjects([]);
            })
            .finally(() => setLoading(false));
    }, [router]);

    // Pagination calculations
    const totalPages = Math.ceil(projects.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading projects..." />;
    }

    const canManageProjects = userRole === 'Admin' || userRole === 'HR';

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Projects</h1>
                    {canManageProjects && (
                        <button className={styles.addBtn} onClick={() => router.push('/projects/new')}>
                            + Add Project
                        </button>
                    )}
                </div>

                {projects.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No projects found</p>
                        {canManageProjects && (
                            <button className={styles.emptyBtn} onClick={() => router.push('/projects/new')}>
                                Create Your First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.projectTable}>
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td className={styles.projectName}>{project.name}</td>
                                        <td className={styles.descriptionCell}>{project.description}</td>
                                        <td>{new Date(project.start_date).toLocaleDateString()}</td>
                                        <td>
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[project.status]}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => router.push(`/projects/${project.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
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
