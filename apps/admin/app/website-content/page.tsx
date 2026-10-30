'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchContentSections,
  updateSectionDraft,
  reorderSections,
  toggleSectionVisibility,
  publishSection,
  unpublishSection,
  publishAllSections,
  fetchRecords,
  createRecord,
  updateRecordDraft,
  toggleRecordVisibility,
  publishRecord,
  unpublishRecord,
  deleteRecord,
  fetchSiteSettings,
  updateSiteSettingsDraft,
  publishSiteSettings,
  ContentApiError,
} from '../../src/lib/content-client';
import type {
  ContentSection,
  ContentRecord,
  ServiceItemPayload,
  ProductItemPayload,
  TeamMemberPayload,
  SiteSettingsPayload,
  SiteSettingsRecord,
} from '../../src/types/content';

export default function WebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<
    'sections' | 'services' | 'products' | 'team' | 'settings'
  >('sections');

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operatingId, setOperatingId] = useState<string | null>(null);

  // Data states
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [services, setServices] = useState<ContentRecord<ServiceItemPayload>[]>(
    [],
  );
  const [products, setProducts] = useState<ContentRecord<ProductItemPayload>[]>(
    [],
  );
  const [teamMembers, setTeamMembers] = useState<
    ContentRecord<TeamMemberPayload>[]
  >([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsRecord | null>(
    null,
  );

  // Section Editing Modal State
  const [editingSection, setEditingSection] = useState<ContentSection | null>(
    null,
  );
  const [sectionFormState, setSectionFormState] = useState<
    Record<string, unknown>
  >({});

  // Record Editing / Deleting Modal State
  const [recordToDelete, setRecordToDelete] = useState<{
    collection: string;
    id: string;
    title: string;
  } | null>(null);

  const [editingRecord, setEditingRecord] = useState<{
    collection: string;
    id?: string; // undefined means create new
    payload: Record<string, unknown>;
  } | null>(null);

  // Site Settings Form State
  const [settingsFormState, setSettingsFormState] =
    useState<SiteSettingsPayload>({
      companyName: 'CodedDevs Technology LTD',
      contactEmail: 'hello@codeddevs.com',
      contactPhone: '',
      address: '',
      twitterUrl: '',
      linkedinUrl: '',
      githubUrl: '',
      footerNotice: '© 2026 CodedDevs Technology LTD. All rights reserved.',
    });

  // Load active tab data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'sections') {
        const data = await fetchContentSections();
        setSections(data);
      } else if (activeTab === 'services') {
        const data = await fetchRecords<ServiceItemPayload>('services');
        setServices(data);
      } else if (activeTab === 'products') {
        const data = await fetchRecords<ProductItemPayload>('products');
        setProducts(data);
      } else if (activeTab === 'team') {
        const data = await fetchRecords<TeamMemberPayload>('team_members');
        setTeamMembers(data);
      } else if (activeTab === 'settings') {
        const data = await fetchSiteSettings();
        setSiteSettings(data);
        if (data?.draftPayload) {
          setSettingsFormState(data.draftPayload);
        }
      }
    } catch (err) {
      if (err instanceof ContentApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          'Failed to load content. Please check server connection.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------------------------------------------
  // Homepage Sections Actions
  // ----------------------------------------------------------------

  async function handleMoveSection(index: number, direction: 'up' | 'down') {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    const orders = newSections.map((sec, i) => ({
      sectionKey: sec.sectionKey,
      position: i,
    }));

    setSections(newSections.map((s, i) => ({ ...s, position: i })));

    try {
      const updated = await reorderSections(orders);
      setSections(updated);
      setSuccessMessage('Section order updated successfully.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save section order.',
      );
      loadData();
    }
  }

  async function handleToggleSectionVisibility(sec: ContentSection) {
    setOperatingId(sec.sectionKey);
    try {
      const updated = await toggleSectionVisibility(
        sec.sectionKey,
        !sec.draftVisible,
      );
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sec.sectionKey ? updated : s)),
      );
      setSuccessMessage(
        `Section "${sec.sectionKey}" is now ${updated.draftVisible ? 'visible in draft' : 'hidden'}.`,
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update visibility.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handlePublishSection(sec: ContentSection) {
    setOperatingId(sec.sectionKey);
    try {
      const updated = await publishSection(sec.sectionKey);
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sec.sectionKey ? updated : s)),
      );
      setSuccessMessage(`Section "${sec.sectionKey}" published to live site.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to publish section.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handleUnpublishSection(sec: ContentSection) {
    setOperatingId(sec.sectionKey);
    try {
      const updated = await unpublishSection(sec.sectionKey);
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sec.sectionKey ? updated : s)),
      );
      setSuccessMessage(
        `Section "${sec.sectionKey}" unpublished from live site.`,
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to unpublish section.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handlePublishAll() {
    setOperatingId('all');
    try {
      await publishAllSections();
      setSuccessMessage(
        'All homepage section drafts have been published live!',
      );
      loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to publish all sections.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  function openEditSection(sec: ContentSection) {
    setEditingSection(sec);
    setSectionFormState(JSON.parse(JSON.stringify(sec.draftPayload || {})));
  }

  async function handleSaveSectionDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSection) return;

    setOperatingId(editingSection.sectionKey);
    try {
      const updated = await updateSectionDraft(
        editingSection.sectionKey,
        sectionFormState,
      );
      setSections((prev) =>
        prev.map((s) =>
          s.sectionKey === editingSection.sectionKey ? updated : s,
        ),
      );
      setSuccessMessage(`Draft for "${editingSection.sectionKey}" saved.`);
      setEditingSection(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save section draft.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  // ----------------------------------------------------------------
  // Collection Records Actions (Services, Products, Team)
  // ----------------------------------------------------------------

  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRecord) return;

    setOperatingId('saving-record');
    try {
      if (editingRecord.id) {
        await updateRecordDraft(
          editingRecord.collection,
          editingRecord.id,
          editingRecord.payload,
        );
        setSuccessMessage('Draft changes saved.');
      } else {
        await createRecord(
          editingRecord.collection,
          editingRecord.payload,
          true,
        );
        setSuccessMessage('Record created successfully.');
      }
      setEditingRecord(null);
      loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save record.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handleToggleRecordPublish(
    collection: string,
    record: {
      id: string;
      draftVisible: boolean;
      publishedAt: string | null;
      publishedPayload: unknown;
    },
  ) {
    setOperatingId(record.id);
    try {
      if (record.publishedAt && record.publishedPayload) {
        await unpublishRecord(collection, record.id);
        setSuccessMessage('Record unpublished.');
      } else {
        await publishRecord(collection, record.id);
        setSuccessMessage('Record published to live site.');
      }
      loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update record state.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handleToggleRecordVisibility(
    collection: string,
    record: {
      id: string;
      draftVisible: boolean;
      publishedAt: string | null;
      publishedPayload: unknown;
    },
  ) {
    setOperatingId(record.id);
    try {
      await toggleRecordVisibility(collection, record.id, !record.draftVisible);
      setSuccessMessage('Visibility updated.');
      loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update visibility.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handleDeleteRecordConfirm() {
    if (!recordToDelete) return;
    setOperatingId('deleting-record');
    try {
      await deleteRecord(recordToDelete.collection, recordToDelete.id);
      setSuccessMessage(`Record "${recordToDelete.title}" deleted.`);
      setRecordToDelete(null);
      loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete record.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  // ----------------------------------------------------------------
  // Site Settings Actions
  // ----------------------------------------------------------------

  async function handleSaveSettingsDraft(e: React.FormEvent) {
    e.preventDefault();
    setOperatingId('settings');
    try {
      const updated = await updateSiteSettingsDraft(settingsFormState);
      setSiteSettings(updated);
      setSuccessMessage('Site settings draft saved.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save settings draft.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  async function handlePublishSettings() {
    setOperatingId('settings');
    try {
      const updated = await publishSiteSettings();
      setSiteSettings(updated);
      setSuccessMessage('Site settings published to live website.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to publish settings.',
      );
    } finally {
      setOperatingId(null);
    }
  }

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
            }}
          >
            Website Content CMS
          </h1>
          <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
            Structured editing for the public Home page sections, services,
            products, team, and footer.
          </p>
        </div>

        {activeTab === 'sections' && (
          <button
            type="button"
            onClick={handlePublishAll}
            disabled={operatingId === 'all'}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: operatingId === 'all' ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {operatingId === 'all'
              ? 'Publishing...'
              : 'Publish All Sections Live'}
          </button>
        )}
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

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          { key: 'sections', label: 'Homepage Sections & Order' },
          { key: 'services', label: 'Services' },
          { key: 'products', label: 'Products & Projects' },
          { key: 'team', label: 'Team Members' },
          { key: 'settings', label: 'Site & Footer Settings' },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.key as
                    'sections' | 'services' | 'products' | 'team' | 'settings',
                )
              }
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                borderBottom: isSelected
                  ? '2px solid #4f46e5'
                  : '2px solid transparent',
                backgroundColor: 'transparent',
                color: isSelected ? '#4f46e5' : '#4b5563',
                fontWeight: isSelected ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
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
          <p style={{ margin: 0 }}>Loading content data...</p>
        </div>
      ) : activeTab === 'sections' ? (
        /* ======================================================== */
        /* TAB 1: HOMEPAGE SECTIONS & ORDER                          */
        /* ======================================================== */
        <div>
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
                  <th style={{ padding: '0.75rem 1rem', width: '80px' }}>
                    Order
                  </th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>
                    Section Key & Heading
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>Visibility</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Snapshot Status</th>
                  <th
                    style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, idx) => {
                  const isPub = Boolean(
                    sec.publishedAt && sec.publishedPayload,
                  );
                  const isBusy = operatingId === sec.sectionKey;
                  const payload = (sec.draftPayload || {}) as Record<
                    string,
                    unknown
                  >;

                  return (
                    <tr
                      key={sec.sectionKey}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: sec.draftVisible
                          ? '#ffffff'
                          : '#fafafa',
                      }}
                    >
                      {/* Order Controls */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.25rem',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'up')}
                            disabled={idx === 0 || isBusy}
                            aria-label={`Move ${sec.sectionKey} up`}
                            style={{
                              padding: '0.2rem 0.4rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              opacity: idx === 0 ? 0.4 : 1,
                              fontSize: '0.75rem',
                            }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'down')}
                            disabled={idx === sections.length - 1 || isBusy}
                            aria-label={`Move ${sec.sectionKey} down`}
                            style={{
                              padding: '0.2rem 0.4rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              cursor:
                                idx === sections.length - 1
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity: idx === sections.length - 1 ? 0.4 : 1,
                              fontSize: '0.75rem',
                            }}
                          >
                            ▼
                          </button>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              marginLeft: '0.25rem',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Section Key & Heading */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#111827',
                            textTransform: 'capitalize',
                          }}
                        >
                          {sec.sectionKey.replace(/_/g, ' ')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            marginTop: '0.2rem',
                          }}
                        >
                          {(payload.heading as string) ||
                            (payload.eyebrow as string) ||
                            'No heading configured'}
                        </div>
                      </td>

                      {/* Visibility Toggle */}
                      <td style={{ padding: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibility(sec)}
                          disabled={isBusy}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            border: sec.draftVisible
                              ? '1px solid #d1d5db'
                              : '1px solid #e5e7eb',
                            backgroundColor: sec.draftVisible
                              ? '#ffffff'
                              : '#f3f4f6',
                            color: sec.draftVisible ? '#111827' : '#9ca3af',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {sec.draftVisible ? '👁 Visible' : '🙈 Hidden'}
                        </button>
                      </td>

                      {/* Snapshot Status */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isPub ? '#ecfdf5' : '#fef3c7',
                            color: isPub ? '#065f46' : '#92400e',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isPub ? '#10b981' : '#f59e0b',
                            }}
                          />
                          {isPub ? 'Live' : 'Draft Only'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        style={{ padding: '1rem 1.25rem', textAlign: 'right' }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openEditSection(sec)}
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
                            Edit Fields
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              isPub
                                ? handleUnpublishSection(sec)
                                : handlePublishSection(sec)
                            }
                            disabled={isBusy}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '5px',
                              border: isPub
                                ? '1px solid #fcd34d'
                                : '1px solid #a7f3d0',
                              backgroundColor: isPub ? '#fffbeb' : '#ecfdf5',
                              color: isPub ? '#b45309' : '#047857',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: isBusy ? 'wait' : 'pointer',
                            }}
                          >
                            {isBusy ? '...' : isPub ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'services' ? (
        /* ======================================================== */
        /* TAB 2: SERVICES RECORDS                                  */
        /* ======================================================== */
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
              Company Services ({services.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingRecord({
                  collection: 'services',
                  payload: {
                    title: '',
                    description: '',
                    icon: '',
                    features: [],
                  },
                })
              }
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              + Add Service
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {services.map((srv) => {
              const isPub = Boolean(srv.publishedAt && srv.publishedPayload);
              return (
                <div
                  key={srv.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          margin: 0,
                          color: '#111827',
                        }}
                      >
                        {srv.draftPayload.title || 'Untitled Service'}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: isPub ? '#ecfdf5' : '#fef3c7',
                          color: isPub ? '#065f46' : '#92400e',
                        }}
                      >
                        {isPub ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {srv.draftPayload.description ||
                        'No description entered.'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleRecordVisibility('services', srv)
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {srv.draftVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRecordPublish('services', srv)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: isPub
                          ? '1px solid #fcd34d'
                          : '1px solid #a7f3d0',
                        backgroundColor: isPub ? '#fffbeb' : '#ecfdf5',
                        color: isPub ? '#b45309' : '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isPub ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({
                          collection: 'services',
                          id: srv.id,
                          payload: { ...srv.draftPayload },
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRecordToDelete({
                          collection: 'services',
                          id: srv.id,
                          title: srv.draftPayload.title,
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fff5f5',
                        color: '#b91c1c',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'products' ? (
        /* ======================================================== */
        /* TAB 3: PRODUCTS & PROJECTS RECORDS                       */
        /* ======================================================== */
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
              Products & Selected Projects ({products.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingRecord({
                  collection: 'products',
                  payload: {
                    name: '',
                    tagline: '',
                    description: '',
                    url: '',
                    badge: '',
                  },
                })
              }
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              + Add Product / Project
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {products.map((prd) => {
              const isPub = Boolean(prd.publishedAt && prd.publishedPayload);
              return (
                <div
                  key={prd.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            margin: 0,
                            color: '#111827',
                          }}
                        >
                          {prd.draftPayload.name || 'Untitled Product'}
                        </h3>
                        {prd.draftPayload.tagline && (
                          <span
                            style={{ fontSize: '0.8rem', color: '#6b7280' }}
                          >
                            {prd.draftPayload.tagline}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: isPub ? '#ecfdf5' : '#fef3c7',
                          color: isPub ? '#065f46' : '#92400e',
                        }}
                      >
                        {isPub ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {prd.draftPayload.description ||
                        'No description entered.'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleRecordVisibility('products', prd)
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {prd.draftVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRecordPublish('products', prd)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: isPub
                          ? '1px solid #fcd34d'
                          : '1px solid #a7f3d0',
                        backgroundColor: isPub ? '#fffbeb' : '#ecfdf5',
                        color: isPub ? '#b45309' : '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isPub ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({
                          collection: 'products',
                          id: prd.id,
                          payload: { ...prd.draftPayload },
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRecordToDelete({
                          collection: 'products',
                          id: prd.id,
                          title: prd.draftPayload.name,
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fff5f5',
                        color: '#b91c1c',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'team' ? (
        /* ======================================================== */
        /* TAB 4: TEAM MEMBERS RECORDS                              */
        /* ======================================================== */
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
              Company Team Profiles ({teamMembers.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingRecord({
                  collection: 'team_members',
                  payload: {
                    name: '',
                    role: '',
                    bio: '',
                    avatarUrl: '',
                    linkedinUrl: '',
                    twitterUrl: '',
                  },
                })
              }
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              + Add Team Member
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {teamMembers.map((tm) => {
              const isPub = Boolean(tm.publishedAt && tm.publishedPayload);
              return (
                <div
                  key={tm.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            margin: 0,
                            color: '#111827',
                          }}
                        >
                          {tm.draftPayload.name || 'Anonymous Member'}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: '#4f46e5',
                            fontWeight: 600,
                          }}
                        >
                          {tm.draftPayload.role || 'Role unassigned'}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: isPub ? '#ecfdf5' : '#fef3c7',
                          color: isPub ? '#065f46' : '#92400e',
                        }}
                      >
                        {isPub ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {tm.draftPayload.bio && (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#4b5563',
                          margin: '0 0 1rem 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {tm.draftPayload.bio}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleRecordVisibility('team_members', tm)
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {tm.draftVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleRecordPublish('team_members', tm)
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: isPub
                          ? '1px solid #fcd34d'
                          : '1px solid #a7f3d0',
                        backgroundColor: isPub ? '#fffbeb' : '#ecfdf5',
                        color: isPub ? '#b45309' : '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isPub ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({
                          collection: 'team_members',
                          id: tm.id,
                          payload: { ...tm.draftPayload },
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRecordToDelete({
                          collection: 'team_members',
                          id: tm.id,
                          title: tm.draftPayload.name,
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fff5f5',
                        color: '#b91c1c',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 5: SITE & FOOTER SETTINGS                            */
        /* ======================================================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            maxWidth: '700px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  margin: '0 0 0.25rem 0',
                }}
              >
                Global Website Settings & Footer
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {siteSettings?.publishedAt
                  ? `Published on ${new Date(siteSettings.publishedAt).toLocaleDateString()}`
                  : 'Draft changes pending'}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePublishSettings}
              disabled={operatingId === 'settings'}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Publish Settings Live
            </button>
          </div>

          <form
            onSubmit={handleSaveSettingsDraft}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                }}
              >
                Company Legal Name
              </label>
              <input
                type="text"
                value={settingsFormState.companyName}
                onChange={(e) =>
                  setSettingsFormState({
                    ...settingsFormState,
                    companyName: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settingsFormState.contactEmail}
                  onChange={(e) =>
                    setSettingsFormState({
                      ...settingsFormState,
                      contactEmail: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  value={settingsFormState.contactPhone || ''}
                  onChange={(e) =>
                    setSettingsFormState({
                      ...settingsFormState,
                      contactPhone: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                }}
              >
                Company Office Address
              </label>
              <input
                type="text"
                value={settingsFormState.address || ''}
                onChange={(e) =>
                  setSettingsFormState({
                    ...settingsFormState,
                    address: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  Twitter / X URL
                </label>
                <input
                  type="url"
                  value={settingsFormState.twitterUrl || ''}
                  onChange={(e) =>
                    setSettingsFormState({
                      ...settingsFormState,
                      twitterUrl: e.target.value,
                    })
                  }
                  placeholder="https://x.com/..."
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={settingsFormState.linkedinUrl || ''}
                  onChange={(e) =>
                    setSettingsFormState({
                      ...settingsFormState,
                      linkedinUrl: e.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/..."
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={settingsFormState.githubUrl || ''}
                  onChange={(e) =>
                    setSettingsFormState({
                      ...settingsFormState,
                      githubUrl: e.target.value,
                    })
                  }
                  placeholder="https://github.com/..."
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                }}
              >
                Footer Copyright & Notice
              </label>
              <input
                type="text"
                value={settingsFormState.footerNotice || ''}
                onChange={(e) =>
                  setSettingsFormState({
                    ...settingsFormState,
                    footerNotice: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="submit"
                disabled={operatingId === 'settings'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Save Settings Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION EDIT MODAL */}
      {editingSection && (
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
              maxWidth: '550px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  margin: 0,
                  textTransform: 'capitalize',
                }}
              >
                Edit {editingSection.sectionKey.replace(/_/g, ' ')} Section
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSaveSectionDraft}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Optional Eyebrow (Hero) */}
              {editingSection.sectionKey === 'hero' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    Eyebrow / Category Tag
                  </label>
                  <input
                    type="text"
                    value={(sectionFormState.eyebrow as string) || ''}
                    onChange={(e) =>
                      setSectionFormState({
                        ...sectionFormState,
                        eyebrow: e.target.value,
                      })
                    }
                    placeholder="e.g. Next-Generation Software Engineering"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Heading (All sections) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  Section Heading <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={(sectionFormState.heading as string) || ''}
                  onChange={(e) =>
                    setSectionFormState({
                      ...sectionFormState,
                      heading: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Body (Hero, About, Contact) */}
              {['hero', 'about', 'contact'].includes(
                editingSection.sectionKey,
              ) && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    Body Text <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={(sectionFormState.body as string) || ''}
                    onChange={(e) =>
                      setSectionFormState({
                        ...sectionFormState,
                        body: e.target.value,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}

              {/* Introduction (Services, Products, Projects, Team, Featured Insights) */}
              {[
                'services',
                'products',
                'projects',
                'team',
                'featured_insights',
              ].includes(editingSection.sectionKey) && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    Introduction Subtitle (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={(sectionFormState.introduction as string) || ''}
                    onChange={(e) =>
                      setSectionFormState({
                        ...sectionFormState,
                        introduction: e.target.value,
                      })
                    }
                    placeholder="Brief lead paragraph explaining this section..."
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}

              {/* Primary Call to Action (Hero) */}
              {editingSection.sectionKey === 'hero' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        marginBottom: '0.3rem',
                      }}
                    >
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={
                        ((
                          sectionFormState.primaryCallToAction as
                            { label?: string; href?: string } | undefined
                        )?.label as string) || ''
                      }
                      onChange={(e) =>
                        setSectionFormState({
                          ...sectionFormState,
                          primaryCallToAction: {
                            ...((sectionFormState.primaryCallToAction as
                              { label?: string; href?: string } | undefined) ||
                              {}),
                            label: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Explore Capabilities"
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        marginBottom: '0.3rem',
                      }}
                    >
                      CTA Button Link (href)
                    </label>
                    <input
                      type="text"
                      value={
                        ((
                          sectionFormState.primaryCallToAction as
                            { label?: string; href?: string } | undefined
                        )?.href as string) || ''
                      }
                      onChange={(e) =>
                        setSectionFormState({
                          ...sectionFormState,
                          primaryCallToAction: {
                            ...((sectionFormState.primaryCallToAction as
                              { label?: string; href?: string } | undefined) ||
                              {}),
                            href: e.target.value,
                          },
                        })
                      }
                      placeholder="#contact or /insights"
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
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
                  type="submit"
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Section Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EDIT MODAL */}
      {editingRecord && (
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
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {editingRecord.id ? 'Edit Record' : 'Create New Record'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSaveRecord}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Primary Name / Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  {editingRecord.collection === 'team_members'
                    ? 'Full Name'
                    : editingRecord.collection === 'products'
                      ? 'Product / Project Name'
                      : 'Service Title'}{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={
                    (editingRecord.payload.title as string) ||
                    (editingRecord.payload.name as string) ||
                    ''
                  }
                  onChange={(e) => {
                    const key =
                      editingRecord.collection === 'services'
                        ? 'title'
                        : 'name';
                    setEditingRecord({
                      ...editingRecord,
                      payload: {
                        ...editingRecord.payload,
                        [key]: e.target.value,
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tagline / Role */}
              {editingRecord.collection === 'products' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={(editingRecord.payload.tagline as string) || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        payload: {
                          ...editingRecord.payload,
                          tagline: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Enterprise Cloud Automation Platform"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {editingRecord.collection === 'team_members' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    Role / Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={(editingRecord.payload.role as string) || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        payload: {
                          ...editingRecord.payload,
                          role: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Principal Systems Architect"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Description / Bio */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  {editingRecord.collection === 'team_members'
                    ? 'Bio'
                    : 'Description'}{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={
                    (editingRecord.payload.description as string) ||
                    (editingRecord.payload.bio as string) ||
                    ''
                  }
                  onChange={(e) => {
                    const key =
                      editingRecord.collection === 'team_members'
                        ? 'bio'
                        : 'description';
                    setEditingRecord({
                      ...editingRecord,
                      payload: {
                        ...editingRecord.payload,
                        [key]: e.target.value,
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Destination URL (products) */}
              {editingRecord.collection === 'products' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                    }}
                  >
                    External Product URL
                  </label>
                  <input
                    type="url"
                    value={(editingRecord.payload.url as string) || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        payload: {
                          ...editingRecord.payload,
                          url: e.target.value,
                        },
                      })
                    }
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
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
                  type="submit"
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Record Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION MODAL */}
      {recordToDelete && (
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
              maxWidth: '440px',
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
              Confirm Record Deletion
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to delete{' '}
              <strong>&ldquo;{recordToDelete.title}&rdquo;</strong>? This action
              will remove the record from both drafts and live views.
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
                onClick={() => setRecordToDelete(null)}
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
                onClick={handleDeleteRecordConfirm}
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
