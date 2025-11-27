'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './job-detail.module.css';

interface JobOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    experience_required: string;
    description: string;
    requirements: string;
    posted_date: string;
    status: string;
}

export default function JobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [job, setJob] = useState<JobOpening | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReferralForm, setShowReferralForm] = useState(false);
    const [formData, setFormData] = useState({
        candidate_name: '',
        candidate_email: '',
        candidate_phone: '',
        resume_link: '',
        comments: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch job details
        fetch(`http://localhost:3001/jobs/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setJob(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router, params.id]);

    const handleSubmitReferral = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:3001/jobs/refer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    job_opening_id: params.id,
                }),
            });

            if (res.ok) {
                alert('Referral submitted successfully!');
                setShowReferralForm(false);
                setFormData({
                    candidate_name: '',
                    candidate_email: '',
                    candidate_phone: '',
                    resume_link: '',
                    comments: '',
                });
            }
        } catch (error) {
            console.error('Error submitting referral:', error);
            alert('Failed to submit referral');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!job) {
        return <div className={styles.error}>Job opening not found</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/jobs')}>
                        ← Back to Jobs
                    </button>
                    <button className={styles.referBtn} onClick={() => setShowReferralForm(!showReferralForm)}>
                        {showReferralForm ? 'Cancel' : '👥 Refer a Candidate'}
                    </button>
                </div>

                {showReferralForm && (
                    <div className={styles.referralForm}>
                        <h2>Refer a Candidate</h2>
                        <form onSubmit={handleSubmitReferral}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Candidate Name *</label>
                                    <input
                                        type="text"
                                        value={formData.candidate_name}
                                        onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.candidate_email}
                                        onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.candidate_phone}
                                        onChange={(e) => setFormData({ ...formData, candidate_phone: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Resume Link</label>
                                    <input
                                        type="url"
                                        value={formData.resume_link}
                                        onChange={(e) => setFormData({ ...formData, resume_link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Comments</label>
                                <textarea
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    rows={3}
                                    placeholder="Why is this candidate a good fit?"
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn}>Submit Referral</button>
                        </form>
                    </div>
                )}

                <div className={styles.jobCard}>
                    <div className={styles.jobHeader}>
                        <div>
                            <h1>{job.title}</h1>
                            <div className={styles.jobMeta}>
                                <span className={styles.metaItem}>📍 {job.location}</span>
                                <span className={styles.metaItem}>🏢 {job.department}</span>
                                <span className={styles.metaItem}>💼 {job.employment_type}</span>
                                <span className={styles.metaItem}>⏱️ {job.experience_required}</span>
                            </div>
                        </div>
                        <span className={`${styles.status} ${styles[job.status.toLowerCase()]}`}>
                            {job.status}
                        </span>
                    </div>

                    <div className={styles.jobContent}>
                        <section className={styles.section}>
                            <h2>Job Description</h2>
                            <p>{job.description}</p>
                        </section>

                        <section className={styles.section}>
                            <h2>Requirements</h2>
                            <p>{job.requirements}</p>
                        </section>

                        <div className={styles.footer}>
                            <p className={styles.postedDate}>
                                Posted on {new Date(job.posted_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
