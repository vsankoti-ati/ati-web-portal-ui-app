'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './home.module.css';

interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    priority: string;
    created_at: string;
}

export default function Home() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch user profile
        fetch('http://localhost:3001/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('User profile loaded:', data);
                setUser(data);
            })
            .catch(console.error);

        // Fetch announcements
        fetch('http://localhost:3001/announcements', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setAnnouncements(data);
                } else {
                    console.error('Announcements response is not an array:', data);
                    setAnnouncements([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching announcements:', error);
                setAnnouncements([]);
            })
            .finally(() => setLoading(false));
    }, [router]);

    const handleEditProfile = () => {
        console.log('Edit Profile clicked, user:', user);
        if (user?.employee_id) {
            console.log('Navigating to:', `/employees/${user.employee_id}`);
            router.push(`/employees/${user.employee_id}`);
        } else {
            alert('Profile not available. Please contact administrator.');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.content}>
                <section className={styles.welcome}>
                    <h1>Welcome to the Intranet Portal</h1>
                    <p>Your central hub for employee services, leave management, and company updates.</p>
                </section>

                <section className={styles.quickLinks}>
                    <h2>Quick Access</h2>
                    <div className={styles.cardGrid}>
                        <div className={styles.card} onClick={handleEditProfile} style={{ cursor: 'pointer' }}>
                            <h3>👤 Edit Profile</h3>
                            <p>Update your information</p>
                        </div>
                        <div className={styles.card} onClick={() => router.push('/leave')}>
                            <h3>🏖️ Leave Management</h3>
                            <p>Apply and track leave</p>
                        </div>
                        <div className={styles.card} onClick={() => router.push('/timesheets')}>
                            <h3>⏰ Timesheets</h3>
                            <p>Submit work hours</p>
                        </div>
                        <div className={styles.card} onClick={() => router.push('/jobs')}>
                            <h3>💼 Job Referrals</h3>
                            <p>Refer candidates</p>
                        </div>
                    </div>
                </section>

                <section className={styles.announcements}>
                    <h2>Latest Announcements</h2>
                    {announcements.length === 0 ? (
                        <p>No announcements at this time.</p>
                    ) : (
                        <div className={styles.announcementList}>
                            {announcements.map((ann) => (
                                <div key={ann.id} className={`${styles.announcement} ${styles[ann.priority.toLowerCase()]}`}>
                                    <div className={styles.announcementHeader}>
                                        <h4>{ann.title}</h4>
                                        <span className={styles.category}>{ann.category}</span>
                                    </div>
                                    <p>{ann.content}</p>
                                    <small>{new Date(ann.created_at).toLocaleDateString()}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
