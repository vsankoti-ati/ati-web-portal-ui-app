'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        // Fetch projects
        fetch('http://localhost:3001/projects', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setProjects(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
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

                <div className={styles.projectGrid}>
                    {projects.map((project) => (
                        <div key={project.id} className={styles.projectCard}>
                            <div className={styles.cardHeader}>
                                <h2>{project.name}</h2>
                                <span className={`${styles.status} ${styles[project.status]}`}>
                                    {project.status}
                                </span>
                            </div>
                            <p className={styles.description}>{project.description}</p>
                            <div className={styles.dates}>
                                <div className={styles.dateItem}>
                                    <label>Start Date</label>
                                    <p>{new Date(project.start_date).toLocaleDateString()}</p>
                                </div>
                                {project.end_date && (
                                    <div className={styles.dateItem}>
                                        <label>End Date</label>
                                        <p>{new Date(project.end_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className={styles.empty}>
                        <p>No projects found</p>
                        {canManageProjects && (
                            <button className={styles.emptyBtn} onClick={() => router.push('/projects/new')}>
                                Create Your First Project
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
