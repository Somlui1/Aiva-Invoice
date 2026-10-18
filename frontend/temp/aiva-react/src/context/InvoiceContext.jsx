import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
  const { currentUser } = useAuth();
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await api.getDocuments();
      setDocs(data);
      if (data.length > 0 && !selectedDocId) {
        setSelectedDocId(data[0].doc);
      }
      setLoading(false);
    }
    load();
  }, []);

  const selectedDoc = useMemo(() => {
    return docs.find(d => d.doc === selectedDocId) || docs[0] || null;
  }, [docs, selectedDocId]);

  const visibleDocs = useMemo(() => {
    return docs.filter(d => {
      // Role filter for EU
      if (currentUser?.role === 'EU') {
        if (d.assigned !== 'eu' && statusFilter === 'mine') return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'mine') {
          if (d.assigned !== 'eu') return false;
        } else if (d.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invMatch = d.inv?.toLowerCase().includes(q);
        const vendorMatch = d.vendor?.toLowerCase().includes(q);
        const docMatch = d.doc?.toLowerCase().includes(q);
        const poMatch = d.po?.toLowerCase().includes(q);
        if (!invMatch && !vendorMatch && !docMatch && !poMatch) return false;
      }

      return true;
    });
  }, [docs, statusFilter, searchQuery, currentUser]);

  const stats = useMemo(() => {
    const total = docs.length;
    const review = docs.filter(d => d.status === 'Review').length;
    const hold = docs.filter(d => d.status === 'Hold').length;
    const autoPass = docs.filter(d => d.status === 'Auto-pass').length;
    const manualReview = docs.filter(d => d.status === 'Manual Review').length;
    return { total, review, hold, autoPass, manualReview };
  }, [docs]);

  const selectDoc = (docId) => setSelectedDocId(docId);

  return (
    <InvoiceContext.Provider value={{
      docs,
      visibleDocs,
      selectedDoc,
      selectedDocId,
      selectDoc,
      statusFilter,
      setStatusFilter,
      searchQuery,
      setSearchQuery,
      loading,
      stats
    }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within an InvoiceProvider');
  return ctx;
}
