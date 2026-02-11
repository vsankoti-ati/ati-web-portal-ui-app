'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './jobs.module.css';

interface JobOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    experience_required: string;
    posted_date: string;
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/openings`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setJobs(data);
                } else {
                    setJobs([]);
                }
            })
            .catch((err) => {
                console.error('Error fetching jobs:', err);
                setJobs([]);
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <LoadingSpinner fullScreen message="Loading job openings..." />
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Job Openings & Referrals</h1>
                    <button
                        onClick={() => router.push('/jobs/refer')}
                        className={styles.referBtn}
                    >
                        Refer a Candidate
                    </button>
                </div>

                {jobs.length === 0 ? (
                    <div className={styles.empty}>No job openings available at this time.</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.jobTable}>
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Department</th>
                                    <th>Location</th>
                                    <th>Employment Type</th>
                                    <th>Experience Required</th>
                                    <th>Posted Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td className={styles.jobTitle}>{job.title}</td>
                                        <td>
                                            <span className={styles.departmentBadge}>{job.department}</span>
                                        </td>
                                        <td>{job.location}</td>
                                        <td>
                                            <span className={styles.typeBadge}>{job.employment_type}</span>
                                        </td>
                                        <td>{job.experience_required}</td>
                                        <td>{new Date(job.posted_date).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => router.push(`/jobs/${job.id}`)}
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
