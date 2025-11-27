'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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

        fetch('http://localhost:3001/jobs/openings', {
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
            <DashboardLayout>
                <div className={styles.loading}>Loading...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Job Openings & Referrals</h1>
                    <button
                        onClick={() => router.push('/jobs/refer')}
                        className={styles.button}
                    >
                        Refer a Candidate
                    </button>
                </div>

                <div className={styles.grid}>
                    {jobs.length === 0 ? (
                        <div className={styles.empty}>No job openings available at this time.</div>
                    ) : (
                        jobs.map((job) => (
                            <div
                                key={job.id}
                                className={styles.card}
                                onClick={() => router.push(`/jobs/${job.id}`)}
                            >
                                <h2>{job.title}</h2>
                                <div className={styles.details}>
                                    <span className={styles.tag}>{job.department}</span>
                                    <span className={styles.tag}>{job.location}</span>
                                    <span className={styles.tag}>{job.employment_type}</span>
                                </div>
                                <div className={styles.footer}>
                                    <span>Exp: {job.experience_required}</span>
                                    <span>Posted: {new Date(job.posted_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
