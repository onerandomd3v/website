'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchInquiries,
  updateInquiryStatus,
  deleteInquiry,
  InquiryApiError,
} from '../../src/lib/inquiries-client';
import type { Inquiry, InquiryStatus } from '../../src/types/inquiries';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Inquiry for viewing / updating
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchInquiries({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setInquiries(response.items);
    } catch (err) {
      if (err instanceof InquiryApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load contact inquiries.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  async function handleStatusChange(
    inquiry: Inquiry,
    newStatus: InquiryStatus,
  ) {
    setIsUpdating(true);
    try {
      const updated = await updateInquiryStatus(inquiry.id, newStatus);
      setInquiries((prev) =>
        prev.map((item) => (item.id === inquiry.id ? updated : item)),
      );
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry(updated);
      }
      setSuccessMessage(`Status updated to "${newStatus.replace('_', ' ')}".`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update status.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!inquiryToDelete) return;
    setIsUpdating(true);
    try {
      await deleteInquiry(inquiryToDelete.id);
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryToDelete.id));
      if (selectedInquiry?.id === inquiryToDelete.id) {
        setSelectedInquiry(null);
      }
      setSuccessMessage(`Inquiry from ${inquiryToDelete.name} deleted.`);
      setInquiryToDelete(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete inquiry.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const counts = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === 'new').length;
    const inProgress = inquiries.filter(
      (i) => i.status === 'in_progress',
    ).length;
    const resolved = inquiries.filter((i) => i.status === 'resolved').length;
    const closed = inquiries.filter((i) => i.status === 'closed').length;
    return { total, newCount, inProgress, resolved, closed };
  }, [inquiries]);

  function getStatusBadgeStyle(status: InquiryStatus) {
    switch (status) {
      case 'new':
        return { bg: '#dbeafe', color: '#1e40af', label: 'New' };
      case 'in_progress':
        return { bg: '#fef3c7', color: '#92400e', label: 'In Progress' };
      case 'resolved':
        return { bg: '#ecfdf5', color: '#065f46', label: 'Resolved' };
      case 'closed':
        return { bg: '#f3f4f6', color: '#4b5563', label: 'Closed' };
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
          }}
        >
          Contact Inquiries
        </h1>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
          Review and manage prospective client submissions from the public
          website contact form.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065f46',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(
            [
              { key: 'all' as const, label: 'All', count: counts.total },
              { key: 'new' as const, label: 'New', count: counts.newCount },
              {
                key: 'in_progress' as const,
                label: 'In Progress',
                count: counts.inProgress,
              },
              {
                key: 'resolved' as const,
                label: 'Resolved',
                count: counts.resolved,
              },
              { key: 'closed' as const, label: 'Closed', count: counts.closed },
            ] as const
          ).map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid #4f46e5'
                    : '1px solid #e5e7eb',
                  backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                  color: isSelected ? '#4f46e5' : '#4b5563',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries..."
            aria-label="Search inquiries"
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              width: '240px',
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 0.5rem 0',
            }}
          >
            {searchQuery
              ? 'No matching inquiries'
              : 'No inquiries received yet'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {searchQuery
              ? 'Try modifying your search keywords.'
              : 'New contact form submissions from website visitors will appear here.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#4b5563',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.75rem 1.25rem' }}>Sender</th>
                <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                <th style={{ padding: '0.75rem 1rem' }}>Message Excerpt</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date Received</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const badge = getStatusBadgeStyle(inq.status);
                const formattedDate = inq.createdAt
                  ? new Date(inq.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={inq.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor:
                        inq.status === 'new' ? '#fbfcfe' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {inq.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {inq.email}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: '#4b5563' }}>
                      {inq.company || '—'}
                    </td>

                    <td
                      style={{
                        padding: '1rem',
                        color: '#4b5563',
                        maxWidth: '280px',
                      }}
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                        }}
                      >
                        {inq.message}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '1rem',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                      }}
                    >
                      {formattedDate}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '5px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryToDelete(inq)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '5px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fff5f5',
                            color: '#b91c1c',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 0.25rem 0',
                    color: '#111827',
                  }}
                >
                  {selectedInquiry.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Submitted on{' '}
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem',
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '6px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Email Address
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#111827',
                    marginTop: '0.2rem',
                  }}
                >
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    style={{ color: '#4f46e5' }}
                  >
                    {selectedInquiry.email}
                  </a>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Company
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#111827',
                    marginTop: '0.2rem',
                  }}
                >
                  {selectedInquiry.company || 'Not provided'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                Message
              </div>
              <div
                style={{
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  color: '#1f2937',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedInquiry.message}
              </div>
            </div>

            {/* Status Follow-up Selector */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '1.25rem',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Status:
                </span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedInquiry,
                      e.target.value as InquiryStatus,
                    )
                  }
                  disabled={isUpdating}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: Inquiry with CodedDevs`}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  Reply via Email &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {inquiryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#991b1b',
                margin: '0 0 0.75rem 0',
              }}
            >
              Delete Inquiry
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to delete the message from{' '}
              <strong>{inquiryToDelete.name}</strong>?
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isUpdating}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
