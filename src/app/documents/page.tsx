'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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

    // Pagination calculations
    const totalPages = Math.ceil(documents.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedDocuments = documents.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);

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
        return <LoadingSpinner fullScreen message="Loading documents..." />;
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

                {documents.length === 0 ? (
                    <div className={styles.empty}>No documents found</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.documentTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Document Name</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>File Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDocuments.map((doc) => (
                                    <tr key={doc.id}>
                                        <td className={styles.iconCell}>{getIcon(doc.type)}</td>
                                        <td className={styles.docName}>{doc.name}</td>
                                        <td className={styles.descriptionCell}>{doc.description}</td>
                                        <td>
                                            <span className={styles.categoryBadge}>{doc.category}</span>
                                        </td>
                                        <td>{formatFileSize(doc.file_size)}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button className={styles.viewBtn}>View</button>
                                                <button className={styles.downloadBtn}>Download</button>
                                            </div>
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
