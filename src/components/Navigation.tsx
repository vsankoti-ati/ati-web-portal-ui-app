'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import styles from './Navigation.module.css';

interface NavigationProps {
    user?: any;
}

// Helper function to convert string to Pascal case
const toPascalCase = (str: string | undefined): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function Navigation({ user }: NavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true); // Default to open
    const [reportsOpen, setReportsOpen] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        // Only set initial state once
        if (!initialized.current) {
            const isMobile = window.innerWidth <= 768;
            setIsOpen(!isMobile);
            initialized.current = true;
        }

        // Handle resize to auto-close/open only when crossing the mobile breakpoint
        let wasMobile = window.innerWidth <= 768;
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            // Only change state when crossing the breakpoint
            if (isMobile !== wasMobile) {
                setIsOpen(!isMobile);
                wasMobile = isMobile;
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.clear(); // Clear all localStorage to remove any cached user data
        
        // Navigate to login page
        router.push('/login');
    };

    const navItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/employees', label: 'Employees', icon: '🧑‍💼', roles: ['Admin', 'HR'] },
        { path: '/leave', label: 'Leave', icon: '🏖️' },
        { path: '/work-from-home', label: 'Work From Home', icon: '🏡' },
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
                            <p className={styles.username}>{toPascalCase(user?.username)}</p>
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
                        
                        {/* Reports menu - Admin only */}
                        {user?.role === 'Admin' && (
                            <li className={styles.hasSubmenu}>
                                <a
                                    href="#"
                                    className={pathname.startsWith('/reports') ? styles.active : ''}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setReportsOpen(!reportsOpen);
                                    }}
                                >
                                    <span className={styles.icon}>�</span>
                                    <span>Reports</span>
                                    <span className={styles.arrow}>{reportsOpen ? '▼' : '▶'}</span>
                                </a>
                                {reportsOpen && (
                                    <ul className={styles.submenu}>
                                        <li>
                                            <a
                                                href="/reports/leave"
                                                className={pathname === '/reports/leave' ? styles.active : ''}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.push('/reports/leave');
                                                }}
                                            >
                                                <span className={styles.icon}>🏖️</span>
                                                <span>Leave Reports</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="/reports/timesheets"
                                                className={pathname === '/reports/timesheets' ? styles.active : ''}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.push('/reports/timesheets');
                                                }}
                                            >
                                                <span className={styles.icon}>⏰</span>
                                                <span>Timesheet Reports</span>
                                            </a>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}
                    </ul>

                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </>
            )}
        </nav>
    );
}
