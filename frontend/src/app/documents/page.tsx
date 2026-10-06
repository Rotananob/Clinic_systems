'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Modal } from '../../components/ui/Modal';
import {
  FileText,
  Search,
  Plus,
  Upload,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  RefreshCw,
  FileCheck,
  Image,
  FolderOpen,
  Calendar,
  User,
} from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.documents.list(categoryFilter === 'ALL' ? undefined : { category: categoryFilter });
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) => {
      const title = d.title?.toLowerCase() || '';
      const pName = d.patient?.nameEn?.toLowerCase() || '';
      const pCode = d.patient?.patientCode?.toLowerCase() || '';
      const fName = d.fileName?.toLowerCase() || '';
      return title.includes(q) || pName.includes(q) || pCode.includes(q) || fName.includes(q);
    });
  }, [documents, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinical document?')) return;
    setDeletingId(id);
    try {
      await api.documents.remove(id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = ['ALL', 'LAB_REPORT', 'RADIOLOGY', 'REFERRAL', 'CERTIFICATE', 'OTHER'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Documents & Lab Attachments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Secure digital repository for laboratory test results, radiology imaging, referral letters, and certificates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title="Refresh repository"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by document title, patient, or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading clinical documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-2">
          <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs">No documents found matching category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isImage = doc.fileType?.startsWith('image/');
            const sizeKb = Math.round(doc.fileSize / 1024);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-100">
                      {doc.category.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mt-2 line-clamp-1">{doc.title}</h3>

                  <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <Link
                        href={`/patients/${doc.patient?.id}`}
                        className="hover:text-teal-700 font-medium text-slate-800"
                      >
                        {doc.patient?.nameEn}
                      </Link>
                      <span className="font-mono text-slate-400">[{doc.patient?.patientCode}]</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{doc.fileName}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewDoc(doc)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer: Upload Document */}
      <UploadDocumentDrawer
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false);
          fetchDocuments();
        }}
      />

      {/* Modal: View Document */}
      {viewDoc && (
        <Modal
          isOpen={!!viewDoc}
          onClose={() => setViewDoc(null)}
          title={viewDoc.title}
          subtitle={`Patient: ${viewDoc.patient?.nameEn} • ${viewDoc.category}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {viewDoc.fileType?.startsWith('image/') ? (
              <div className="bg-slate-900 p-2 rounded-xl text-center flex items-center justify-center max-h-[60vh] overflow-hidden">
                <img
                  src={viewDoc.fileUrl}
                  alt={viewDoc.title}
                  className="max-h-[58vh] max-w-full object-contain rounded"
                />
              </div>
            ) : viewDoc.fileType === 'application/pdf' ? (
              <div className="h-[60vh] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <iframe src={viewDoc.fileUrl} className="w-full h-full" title={viewDoc.title} />
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{viewDoc.fileName}</h4>
                  <p className="text-xs text-slate-500 mt-1">This file type can be downloaded directly.</p>
                </div>
                <a
                  href={viewDoc.fileUrl}
                  download={viewDoc.fileName}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </a>
              </div>
            )}

            {viewDoc.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <strong className="text-slate-900">Clinical Findings / Notes:</strong>
                <p className="mt-1">{viewDoc.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==========================================
// Upload Document Drawer
// ==========================================
function UploadDocumentDrawer({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientCandidates, setPatientCandidates] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LAB_REPORT');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) {
      setPatientCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.patients.list({ search: patientSearch, limit: 5 });
        setPatientCandidates(res.data || []);
      } catch (err) {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title.trim()) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient.');
      return;
    }
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Read file as base64 data URL
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileUrl = reader.result as string;
        await api.documents.create({
          patientId: selectedPatient.id,
          title: title.trim(),
          category,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileUrl,
          notes: notes.trim() || undefined,
        });
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Failed to upload document');
      } finally {
        setSubmitting(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from browser.');
      setSubmitting(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Clinical Attachment"
      subtitle="Attach lab diagnostic results, ultrasound images, or medical reports to patient record"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Associated Patient <span className="text-rose-500">*</span>
          </label>
          {selectedPatient ? (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900">{selectedPatient.nameEn}</span>{' '}
                <span className="font-mono text-teal-800">[{selectedPatient.patientCode}]</span>
                <div className="text-slate-500 text-[11px] mt-0.5">Phone: {selectedPatient.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-teal-800 font-semibold hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 relative">
              <input
                type="text"
                placeholder="Search patient by name, code, or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
              {patientCandidates.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {patientCandidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientCandidates([]);
                      }}
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.nameEn}</div>
                        <div className="text-[11px] text-slate-500">{p.phone}</div>
                      </div>
                      <span className="font-mono text-xs text-teal-800">{p.patientCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            >
              <option value="LAB_REPORT">Laboratory Report</option>
              <option value="RADIOLOGY">Radiology / X-Ray / Ultrasound</option>
              <option value="REFERRAL">Referral Letter</option>
              <option value="CERTIFICATE">Medical Certificate</option>
              <option value="OTHER">General Clinical Attachment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Blood Count (CBC)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Select File (PDF, PNG, JPG) <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            required
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-700 file:text-white hover:file:bg-teal-800"
          />
          {file && (
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Clinical Findings / Notes</label>
          <textarea
            rows={2}
            placeholder="Clinical impressions or radiologist report comments"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            {submitting ? 'Uploading...' : 'Upload & Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
