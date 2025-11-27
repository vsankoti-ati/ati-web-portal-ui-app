'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './project-detail.module.css';

interface Project {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string | null;
    status: string;
    created_at: string;
}

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [formData, setFormData] = useState<Partial<Project>>({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get user role
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUserRole(data.role))
            .catch(console.error);

        // Fetch project details
        fetch(`http://localhost:3001/projects/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setProject(data);
                setFormData(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router, params.id]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/projects/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updated = await res.json();
                setProject(updated);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!project) {
        return <div className={styles.error}>Project not found</div>;
    }

    const canEdit = userRole === 'Admin' || userRole === 'HR';

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/projects')}>
                        ← Back to Projects
                    </button>
                    {canEdit && (
                        <div className={styles.actions}>
                            {!isEditing ? (
                                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                                    Edit Project
                                </button>
                            ) : (
                                <>
                                    <button className={styles.cancelBtn} onClick={() => {
                                        setIsEditing(false);
                                        setFormData(project);
                                    }}>
                                        Cancel
                                    </button>
                                    <button className={styles.saveBtn} onClick={handleSave}>
                                        Save Changes
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.projectCard}>
                    <div className={styles.projectHeader}>
                        <div className={styles.projectInfo}>
                            {!isEditing ? (
                                <>
                                    <h1>{project.name}</h1>
                                    <span className={`${styles.status} ${styles[project.status.toLowerCase()]}`}>
                                        {project.status}
                                    </span>
                                </>
                            ) : (
                                <div className={styles.nameEdit}>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Project Name"
                                    />
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.details}>
                        <h2>Project Details</h2>

                        <div className={styles.detailItem}>
                            <label>Description</label>
                            {!isEditing ? (
                                <p>{project.description}</p>
                            ) : (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            )}
                        </div>

                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <label>Start Date</label>
                                {!isEditing ? (
                                    <p>{new Date(project.start_date).toLocaleDateString()}</p>
                                ) : (
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                )}
                            </div>

                            <div className={styles.detailItem}>
                                <label>End Date</label>
                                {!isEditing ? (
                                    <p>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</p>
                                ) : (
                                    <input
                                        type="date"
                                        value={formData.end_date || ''}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                )}
                            </div>

                            <div className={styles.detailItem}>
                                <label>Created On</label>
                                <p>{new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
