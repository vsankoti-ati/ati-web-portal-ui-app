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
                                {projects.map((project) => (
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
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
