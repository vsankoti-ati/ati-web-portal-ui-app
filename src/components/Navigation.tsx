'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './Navigation.module.css';

interface NavigationProps {
    user?: any;
}

export default function Navigation({ user }: NavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/employees', label: 'Employees', icon: '👥', roles: ['Admin', 'HR'] },
        { path: '/leave', label: 'Leave', icon: '🏖️' },
        { path: '/timesheets', label: 'Timesheets', icon: '⏰' },
        { path: '/projects', label: 'Projects', icon: '📊' },
        { path: '/jobs', label: 'Job Openings', icon: '💼' },
        { path: '/holidays', label: 'Holidays', icon: '📅' },
        { path: '/documents', label: 'Documents', icon: '📄' },
    ];

    const filteredNavItems = navItems.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <nav className={`${styles.nav} ${!isOpen ? styles.closed : ''}`}>
            <div className={styles.header}>
                {isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image 
                            src="/thumb-ati.png" 
                            alt="ATI Logo" 
                            width={40} 
                            height={40}
                            style={{ objectFit: 'contain' }}
                        />
                        <h2>ATI Portal</h2>
                    </div>
                ) : (
                    <Image 
                        src="/thumb-ati.png" 
                        alt="ATI Logo" 
                        width={40} 
                        height={40}
                        style={{ objectFit: 'contain' }}
                    />
                )}
                <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>

            {isOpen && (
                <>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
                        <div className={styles.userDetails}>
                            <p className={styles.username}>{user?.username}</p>
                            <p className={styles.role}>{user?.role}</p>
                        </div>
                    </div>

                    <ul className={styles.navList}>
                        {filteredNavItems.map((item) => (
                            <li key={item.path}>
                                <a
                                    href={item.path}
                                    className={pathname === item.path ? styles.active : ''}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push(item.path);
                                    }}
                                >
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </>
            )}
        </nav>
    );
}
