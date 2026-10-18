/**
 * AIVA API Client & Connection Points Layer
 *
 * Isolated Connection Points:
 * - CP-1: Document Queue (GET /api/documents)
 * - CP-2: PDF Document File (GET /api/documents/:id/pdf)
 * - CP-3: BBox & OCR Extraction (GET /api/documents/:id/result)
 * - CP-4: Oracle PO Receipts (GET /api/documents/:id/oracle-receipts)
 * - CP-5: User & Authentication (GET /api/auth/me)
 * - CP-6: Company Scope (GET /api/companies)
 */

import { REAL_125_INVOICES } from '../mock/real125Invoices.js';
import { ORACLE_RECEIPTS_BY_DOC } from '../mock/oracleReceipts.js';
import { COMPANIES_26 } from '../mock/companies26.js';
import { MOCK_USERS } from '../mock/users.js';

const API_BASE = typeof window !== 'undefined' && window.__AIVA_API_BASE__ ? window.__AIVA_API_BASE__ : '';

export const api = {
  /**
   * CP-1: Fetch all invoice documents in queue
   */
  async getDocuments() {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/documents`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch (err) {
        console.warn('[AIVA API] Live fetch failed, using authentic fallback dataset:', err);
      }
    }
    return REAL_125_INVOICES;
  },

  /**
   * Fetch single invoice document by ID
   */
  async getDocument(docId) {
    const docs = await this.getDocuments();
    return docs.find(d => d.doc === docId || d.id === docId) || null;
  },

  /**
   * CP-2: Get PDF URL for rendering
   */
  getPdfUrl(docId) {
    if (API_BASE) {
      return `${API_BASE}/api/documents/${docId}/pdf`;
    }
    // Fallback URL or static mock path
    return `/mock/pdf/${docId}.pdf`;
  },

  /**
   * CP-4: Fetch Oracle PO receipt lines for a document
   */
  async getOracleReceipts(docId) {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/documents/${docId}/oracle-receipts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[AIVA API] Live receipts fetch failed, using fallback:', err);
      }
    }
    return ORACLE_RECEIPTS_BY_DOC[docId] || [];
  },

  /**
   * CP-5: Get current user profile
   */
  async getCurrentUser() {
    return MOCK_USERS[0] || { id: 'u1', name: 'Accounting Officer', role: 'ACC' };
  },

  /**
   * CP-6: Get 26 AAPICO Companies
   */
  async getCompanies() {
    return COMPANIES_26;
  }
};

export default api;
