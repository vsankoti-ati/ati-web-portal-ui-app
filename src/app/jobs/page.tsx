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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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

    // Pagination calculations
    const totalPages = Math.ceil(jobs.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

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
                                {paginatedJobs.map((job) => (
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
                                        <td>{new Date(job.posted_date).toISOString().split('T')[0]}</td>
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
