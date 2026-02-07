'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './documents.module.css';

interface Document {
    id: string;
    name: string;
    type: string;
    category: string;
    description: string;
    file_size: number;
    created_at: string;
}

export default function DocumentsPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const url = filterType === 'all'
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/documents`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/documents?type=${filterType}`;

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setDocuments(data);
                } else {
                    console.error('Documents response is not an array:', data);
                    setDocuments([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching documents:', error);
                setDocuments([]);
            })
            .finally(() => setLoading(false));
    }, [router, filterType]);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const getIcon = (type: string) => {
        const icons: Record<string, string> = {
            policy: '📋',
            handbook: '📘',
            form: '📝',
            other: '📄',
        };
        return icons[type] || '📄';
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Document Management</h1>
                    <div className={styles.filters}>
                        <button
                            className={filterType === 'all' ? styles.active : ''}
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </button>
                        <button
                            className={filterType === 'policy' ? styles.active : ''}
                            onClick={() => setFilterType('policy')}
                        >
                            Policies
                        </button>
                        <button
                            className={filterType === 'handbook' ? styles.active : ''}
                            onClick={() => setFilterType('handbook')}
                        >
                            Handbooks
                        </button>
                        <button
                            className={filterType === 'form' ? styles.active : ''}
                            onClick={() => setFilterType('form')}
                        >
                            Forms
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {documents.map((doc) => (
                        <div key={doc.id} className={styles.docCard}>
                            <div className={styles.icon}>{getIcon(doc.type)}</div>
                            <div className={styles.docInfo}>
                                <h3>{doc.name}</h3>
                                <p className={styles.description}>{doc.description}</p>
                                <div className={styles.meta}>
                                    <span className={styles.category}>{doc.category}</span>
                                    <span className={styles.size}>{formatFileSize(doc.file_size)}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button className={styles.viewBtn}>View</button>
                                    <button className={styles.downloadBtn}>Download</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {documents.length === 0 && (
                    <div className={styles.empty}>No documents found</div>
                )}
            </div>
        </DashboardLayout>
    );
}
