'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
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
                console.log('User profile loaded:', data);
                setUser(data);
            })
            .catch((error) => {
                console.error('Error fetching profile:', error);
                if (error.message !== 'Unauthorized') {
                    setLoading(false);
                }
            });

        // Fetch announcements
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/announcements`, {
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
        return <LoadingSpinner fullScreen message="Loading dashboard..." />;
    }

    return (
        <DashboardLayout>
            <div className={styles.content}>
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.welcomeText}>
                            <h1>Welcome back{user && `, ${user.first_name || user.email_id}`}! 👋</h1>
                            <p>Your central hub for employee services, leave management, and company updates.</p>
                        </div>
                        {user && (
                            <div className={styles.userCard}>
                                <div className={styles.userAvatar}>
                                    {user.first_name?.[0] || user.email_id?.[0] || 'U'}
                                </div>
                                <div className={styles.userInfo}>
                                    <h3>{user.first_name} {user.last_name}</h3>
                                    <p className={styles.userRole}>{user.role || 'Employee'}</p>
                                    <p className={styles.userEmail}>{user.email_id}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.quickLinks}>
                    <h2>Quick Access</h2>
                    <div className={styles.cardGrid}>
                        <div className={`${styles.card} ${styles.cardProfile}`} onClick={handleEditProfile}>
                            <div className={styles.cardIcon}>👤</div>
                            <div className={styles.cardContent}>
                                <h3>Edit Profile</h3>
                                <p>Update your information</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </div>
                        <div className={`${styles.card} ${styles.cardLeave}`} onClick={() => router.push('/leave')}>
                            <div className={styles.cardIcon}>🏖️</div>
                            <div className={styles.cardContent}>
                                <h3>Leave Management</h3>
                                <p>Apply and track leave</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </div>
                        <div className={`${styles.card} ${styles.cardTimesheet}`} onClick={() => router.push('/timesheets')}>
                            <div className={styles.cardIcon}>⏰</div>
                            <div className={styles.cardContent}>
                                <h3>Timesheets</h3>
                                <p>Submit work hours</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </div>
                        <div className={`${styles.card} ${styles.cardJobs}`} onClick={() => router.push('/jobs')}>
                            <div className={styles.cardIcon}>💼</div>
                            <div className={styles.cardContent}>
                                <h3>Job Referrals</h3>
                                <p>Refer candidates</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </div>
                    </div>
                </section>

                <section className={styles.announcements}>
                    <div className={styles.sectionHeader}>
                        <h2>📢 Latest Announcements</h2>
                        <span className={styles.badge}>{announcements.length} updates</span>
                    </div>
                    {announcements.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📭</div>
                            <p>No announcements at this time.</p>
                        </div>
                    ) : (
                        <div className={styles.announcementList}>
                            {announcements.map((ann) => (
                                <div key={ann.id} className={`${styles.announcement} ${styles[ann.priority.toLowerCase()]}`}>
                                    <div className={styles.priorityIndicator}></div>
                                    <div className={styles.announcementContent}>
                                        <div className={styles.announcementHeader}>
                                            <div>
                                                <h4>{ann.title}</h4>
                                                <small>{new Date(ann.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}</small>
                                            </div>
                                            <div className={styles.tags}>
                                                <span className={styles.category}>{ann.category}</span>
                                                <span className={`${styles.priority} ${styles[ann.priority.toLowerCase() + 'Priority']}`}>
                                                    {ann.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <p>{ann.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
