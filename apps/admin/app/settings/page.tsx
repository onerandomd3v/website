'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
  fetchAdminSettings,
  updateAdminSettings,
  publishAdminSettings,
  fetchAccountSecurity,
  changePassword,
  SettingsApiError,
} from '../../src/lib/settings-client';
import {
  fetchMediaAssets,
  uploadMediaAsset,
  updateMediaAssetAltText,
  deleteMediaAsset,
  formatFileSize,
  MediaApiError,
} from '../../src/lib/media-client';
import type { SiteSettings, AccountSecurity } from '../../src/types/settings';
import type { MediaAsset } from '../../src/types/media';

type SettingsTab = 'site' | 'media' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('site');

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Site & SEO Settings State
  // -------------------------------------------------------------
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: 'CodedDevs Technology LTD',
    contactEmail: 'contact@codeddevs.com',
    contactPhone: '',
    address: '',
    twitterUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    footerNotice: '© 2026 CodedDevs Technology LTD. All rights reserved.',
    metaTitle: 'CodedDevs | Pioneering Resilient Digital Solutions',
    metaDescription:
      'Enterprise software engineering, cloud architecture, and mission-critical digital systems.',
    ogImageUrl: '',
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingSettings, setIsPublishingSettings] = useState(false);
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);

  // -------------------------------------------------------------
  // Media Library State
  // -------------------------------------------------------------
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaMimeFilter, setMediaMimeFilter] = useState<
    'all' | 'image' | 'pdf'
  >('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Media modals
  const [editingAltAsset, setEditingAltAsset] = useState<MediaAsset | null>(
    null,
  );
  const [newAltText, setNewAltText] = useState('');
  const [isUpdatingAlt, setIsUpdatingAlt] = useState(false);

  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);
  const [safeguardAsset, setSafeguardAsset] = useState<MediaAsset | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Account & Security State
  // -------------------------------------------------------------
  const [accountInfo, setAccountInfo] = useState<AccountSecurity | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Loaders
  // -------------------------------------------------------------
  const loadSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
      setHasUnsavedSettings(false);
    } catch (err) {
      if (err instanceof SettingsApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load site settings.');
      }
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  const loadMedia = useCallback(async () => {
    setIsMediaLoading(true);
    try {
      const data = await fetchMediaAssets({
        search: mediaSearch.trim() || undefined,
        mimeType:
          mediaMimeFilter === 'image'
            ? 'image/'
            : mediaMimeFilter === 'pdf'
              ? 'application/pdf'
              : undefined,
      });
      setMediaAssets(data);
    } catch (err) {
      if (err instanceof MediaApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load media assets.');
      }
    } finally {
      setIsMediaLoading(false);
    }
  }, [mediaSearch, mediaMimeFilter]);

  const loadAccount = useCallback(async () => {
    setIsAccountLoading(true);
    try {
      const data = await fetchAccountSecurity();
      setAccountInfo(data);
    } catch (err) {
      if (err instanceof SettingsApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load account details.');
      }
    } finally {
      setIsAccountLoading(false);
    }
  }, []);

  // Sync tab data loading
  useEffect(() => {
    if (activeTab === 'site') {
      loadSettings();
    } else if (activeTab === 'media') {
      loadMedia();
    } else if (activeTab === 'security') {
      loadAccount();
    }
  }, [activeTab, loadSettings, loadMedia, loadAccount]);

  // -------------------------------------------------------------
  // Site Settings Handlers
  // -------------------------------------------------------------
  function handleSettingChange(field: keyof SiteSettings, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedSettings(true);
  }

  async function handleSaveSettingsDraft(e: FormEvent) {
    e.preventDefault();
    setIsSavingDraft(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await updateAdminSettings(settings);
      setSettings(updated);
      setHasUnsavedSettings(false);
      setSuccessMessage('Site settings draft saved successfully.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save settings draft.',
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handlePublishSettings() {
    setIsPublishingSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const published = await publishAdminSettings();
      setSettings(published);
      setHasUnsavedSettings(false);
      setSuccessMessage(
        'Site settings published! Changes are now live on the public website.',
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to publish settings.',
      );
    } finally {
      setIsPublishingSettings(false);
    }
  }

  // -------------------------------------------------------------
  // Media Handlers
  // -------------------------------------------------------------
  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadFile(null);
      return;
    }
    const file = files[0];
    // Check max size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(
        `Selected file exceeds the maximum 10MB limit (${formatFileSize(file.size)}).`,
      );
      setUploadFile(null);
      return;
    }
    setUploadFile(file);
  }

  async function handleUploadMedia(e: FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setErrorMessage(null);

    try {
      const uploaded = await uploadMediaAsset(
        uploadFile,
        uploadAltText.trim() || undefined,
      );
      setMediaAssets((prev) => [uploaded, ...prev]);
      setSuccessMessage(`File "${uploadFile.name}" uploaded successfully.`);
      setUploadFile(null);
      setUploadAltText('');
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload media asset.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveAltText(e: FormEvent) {
    e.preventDefault();
    if (!editingAltAsset) return;

    setIsUpdatingAlt(true);
    try {
      const updated = await updateMediaAssetAltText(
        editingAltAsset.id,
        newAltText.trim(),
      );
      setMediaAssets((prev) =>
        prev.map((item) => (item.id === editingAltAsset.id ? updated : item)),
      );
      setSuccessMessage('Alt text updated successfully.');
      setEditingAltAsset(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update alt text.',
      );
    } finally {
      setIsUpdatingAlt(false);
    }
  }

  function handleRequestDelete(asset: MediaAsset) {
    if (asset.referencesCount > 0) {
      // Safeguard triggered!
      setSafeguardAsset(asset);
    } else {
      setAssetToDelete(asset);
    }
  }

  async function handleConfirmDeleteAsset() {
    if (!assetToDelete) return;

    setIsDeletingAsset(true);
    setErrorMessage(null);
    try {
      await deleteMediaAsset(assetToDelete.id, assetToDelete.referencesCount);
      setMediaAssets((prev) => prev.filter((a) => a.id !== assetToDelete.id));
      setSuccessMessage(`Asset "${assetToDelete.objectKey}" deleted.`);
      setAssetToDelete(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete asset.',
      );
    } finally {
      setIsDeletingAsset(false);
    }
  }

  function handleCopyUrl(asset: MediaAsset) {
    navigator.clipboard.writeText(asset.url);
    setCopiedUrlId(asset.id);
    setTimeout(() => {
      setCopiedUrlId((current) => (current === asset.id ? null : current));
    }, 2000);
  }

  // -------------------------------------------------------------
  // Security Handlers
  // -------------------------------------------------------------
  async function handleChangePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setErrorMessage(null);

    try {
      const result = await changePassword(currentPassword, newPassword);
      setSuccessMessage(result.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to change password.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  // Filtered media assets
  const filteredAssets = useMemo(() => {
    return mediaAssets.filter((asset) => {
      if (mediaMimeFilter === 'image' && !asset.mimeType.startsWith('image/')) {
        return false;
      }
      if (mediaMimeFilter === 'pdf' && asset.mimeType !== 'application/pdf') {
        return false;
      }
      if (mediaSearch.trim()) {
        const query = mediaSearch.toLowerCase();
        const matchesKey = asset.objectKey.toLowerCase().includes(query);
        const matchesAlt =
          asset.altText?.toLowerCase().includes(query) ?? false;
        if (!matchesKey && !matchesAlt) return false;
      }
      return true;
    });
  }, [mediaAssets, mediaMimeFilter, mediaSearch]);

  return (
    <div
      style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}
    >
      {/* Page Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em',
          }}
        >
          Settings & Media
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
          Manage site-wide SEO metadata, media assets, and Super Admin security.
        </p>
      </header>

      {/* Global Alerts */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.85rem 1rem',
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
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.85rem 1rem',
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
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <nav
        aria-label="Settings Tabs"
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('site')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'site' ? 600 : 500,
            color: activeTab === 'site' ? '#4f46e5' : '#4b5563',
            borderBottom:
              activeTab === 'site'
                ? '2px solid #4f46e5'
                : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Site & SEO
          {hasUnsavedSettings && (
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
              }}
            >
              Unsaved
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'media' ? 600 : 500,
            color: activeTab === 'media' ? '#4f46e5' : '#4b5563',
            borderBottom:
              activeTab === 'media'
                ? '2px solid #4f46e5'
                : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Media Library
          <span
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.1rem 0.45rem',
              borderRadius: '9999px',
            }}
          >
            {mediaAssets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'security' ? 600 : 500,
            color: activeTab === 'security' ? '#4f46e5' : '#4b5563',
            borderBottom:
              activeTab === 'security'
                ? '2px solid #4f46e5'
                : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          Account & Security
        </button>
      </nav>

      {/* ========================================================= */}
      {/* TAB 1: Site & SEO Settings */}
      {/* ========================================================= */}
      {activeTab === 'site' && (
        <div>
          {isSettingsLoading ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSaveSettingsDraft}>
              {/* Snapshot Toolbar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: '#1e293b',
                    }}
                  >
                    Publishing Controls
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Draft edits are staged safely. Publish to update meta tags
                    and footer on live pages.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    disabled={isSavingDraft || isPublishingSettings}
                    style={{
                      padding: '0.55rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: isSavingDraft ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={handlePublishSettings}
                    disabled={isPublishingSettings || isSavingDraft}
                    style={{
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isPublishingSettings ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isPublishingSettings ? 'Publishing...' : 'Publish Live'}
                  </button>
                </div>
              </div>

              {/* General Company Information */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 1.25rem 0',
                    color: '#111827',
                  }}
                >
                  Company & Contact Information
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    <label
                      htmlFor="companyName"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Company Legal Name *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={settings.companyName}
                      onChange={(e) =>
                        handleSettingChange('companyName', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactEmail"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Official Contact Email *
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      value={settings.contactEmail}
                      onChange={(e) =>
                        handleSettingChange('contactEmail', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactPhone"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Contact Phone Number
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={settings.contactPhone || ''}
                      onChange={(e) =>
                        handleSettingChange('contactPhone', e.target.value)
                      }
                      placeholder="+234 800 000 0000"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Headquarters Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={settings.address || ''}
                      onChange={(e) =>
                        handleSettingChange('address', e.target.value)
                      }
                      placeholder="Lagos, Nigeria"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <label
                    htmlFor="footerNotice"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Footer Notice & Copyright Line
                  </label>
                  <input
                    id="footerNotice"
                    type="text"
                    value={settings.footerNotice || ''}
                    onChange={(e) =>
                      handleSettingChange('footerNotice', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 1.25rem 0',
                    color: '#111827',
                  }}
                >
                  Social Profiles
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    <label
                      htmlFor="twitterUrl"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      X (Twitter) URL
                    </label>
                    <input
                      id="twitterUrl"
                      type="url"
                      value={settings.twitterUrl || ''}
                      onChange={(e) =>
                        handleSettingChange('twitterUrl', e.target.value)
                      }
                      placeholder="https://x.com/codeddevs"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="linkedinUrl"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      LinkedIn URL
                    </label>
                    <input
                      id="linkedinUrl"
                      type="url"
                      value={settings.linkedinUrl || ''}
                      onChange={(e) =>
                        handleSettingChange('linkedinUrl', e.target.value)
                      }
                      placeholder="https://linkedin.com/company/codeddevs"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="githubUrl"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      GitHub Organization URL
                    </label>
                    <input
                      id="githubUrl"
                      type="url"
                      value={settings.githubUrl || ''}
                      onChange={(e) =>
                        handleSettingChange('githubUrl', e.target.value)
                      }
                      placeholder="https://github.com/onerandomd3v"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Meta Defaults */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 1.25rem 0',
                    color: '#111827',
                  }}
                >
                  Search Engine Optimization (SEO) Defaults
                </h2>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="metaTitle"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Default Meta Title
                  </label>
                  <input
                    id="metaTitle"
                    type="text"
                    value={settings.metaTitle || ''}
                    onChange={(e) =>
                      handleSettingChange('metaTitle', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <small
                    style={{
                      color: '#6b7280',
                      display: 'block',
                      marginTop: '0.25rem',
                    }}
                  >
                    Recommended length: 50-60 characters (
                    {settings.metaTitle?.length || 0} characters)
                  </small>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="metaDescription"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Default Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    value={settings.metaDescription || ''}
                    onChange={(e) =>
                      handleSettingChange('metaDescription', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                  <small
                    style={{
                      color: '#6b7280',
                      display: 'block',
                      marginTop: '0.25rem',
                    }}
                  >
                    Recommended length: 140-160 characters (
                    {settings.metaDescription?.length || 0} characters)
                  </small>
                </div>

                <div>
                  <label
                    htmlFor="ogImageUrl"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Default Social Share Image (OpenGraph URL)
                  </label>
                  <input
                    id="ogImageUrl"
                    type="url"
                    value={settings.ogImageUrl || ''}
                    onChange={(e) =>
                      handleSettingChange('ogImageUrl', e.target.value)
                    }
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <small
                    style={{
                      color: '#6b7280',
                      display: 'block',
                      marginTop: '0.25rem',
                    }}
                  >
                    Recommended dimensions: 1200 x 630 pixels.
                  </small>
                </div>
              </div>

              {/* Bottom Submit */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="submit"
                  disabled={isSavingDraft || isPublishingSettings}
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: isSavingDraft ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={handlePublishSettings}
                  disabled={isPublishingSettings || isSavingDraft}
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isPublishingSettings ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isPublishingSettings ? 'Publishing...' : 'Publish Live'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: Media Library */}
      {/* ========================================================= */}
      {activeTab === 'media' && (
        <div>
          {/* Upload Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                color: '#111827',
              }}
            >
              Upload New Media Asset
            </h2>
            <p
              style={{
                color: '#6b7280',
                fontSize: '0.875rem',
                margin: '0 0 1.25rem 0',
              }}
            >
              Upload images (JPEG, PNG, WebP, SVG) or PDF documents up to 10MB.
              Assets are stored securely through the API without exposing
              backend storage credentials.
            </p>

            {uploadError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {uploadError}
              </div>
            )}

            <form
              onSubmit={handleUploadMedia}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                alignItems: 'end',
              }}
            >
              <div>
                <label
                  htmlFor="fileInput"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.4rem',
                  }}
                >
                  Select File *
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                  onChange={handleFileSelect}
                  style={{
                    fontSize: '0.85rem',
                    color: '#4b5563',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="altTextInput"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.4rem',
                  }}
                >
                  Accessibility Alt Text (Optional)
                </label>
                <input
                  id="altTextInput"
                  type="text"
                  placeholder="e.g. CodedDevs office conference room"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  style={{
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor:
                      isUploading || !uploadFile ? 'not-allowed' : 'pointer',
                    opacity: isUploading || !uploadFile ? 0.6 : 1,
                    width: '100%',
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            {/* Search */}
            <div style={{ flex: '1 1 250px', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search assets by name or alt text..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setMediaMimeFilter('all')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor:
                    mediaMimeFilter === 'all' ? '#4f46e5' : '#d1d5db',
                  backgroundColor:
                    mediaMimeFilter === 'all' ? '#eef2ff' : '#ffffff',
                  color: mediaMimeFilter === 'all' ? '#4f46e5' : '#374151',
                  fontWeight: mediaMimeFilter === 'all' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                All Files
              </button>
              <button
                type="button"
                onClick={() => setMediaMimeFilter('image')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor:
                    mediaMimeFilter === 'image' ? '#4f46e5' : '#d1d5db',
                  backgroundColor:
                    mediaMimeFilter === 'image' ? '#eef2ff' : '#ffffff',
                  color: mediaMimeFilter === 'image' ? '#4f46e5' : '#374151',
                  fontWeight: mediaMimeFilter === 'image' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                Images Only
              </button>
              <button
                type="button"
                onClick={() => setMediaMimeFilter('pdf')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor:
                    mediaMimeFilter === 'pdf' ? '#4f46e5' : '#d1d5db',
                  backgroundColor:
                    mediaMimeFilter === 'pdf' ? '#eef2ff' : '#ffffff',
                  color: mediaMimeFilter === 'pdf' ? '#4f46e5' : '#374151',
                  fontWeight: mediaMimeFilter === 'pdf' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                PDFs
              </button>
            </div>
          </div>

          {/* Asset Grid */}
          {isMediaLoading ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              Loading media library...
            </div>
          ) : filteredAssets.length === 0 ? (
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
              <h3
                style={{
                  margin: '0 0 0.5rem 0',
                  color: '#374151',
                  fontSize: '1.1rem',
                }}
              >
                No media assets found
              </h3>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                {mediaSearch || mediaMimeFilter !== 'all'
                  ? 'No files matched your search and filter criteria.'
                  : 'Upload your first image or document above to populate the library.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredAssets.map((asset) => {
                const isImage = asset.mimeType.startsWith('image/');
                const isReferenced = asset.referencesCount > 0;

                return (
                  <div
                    key={asset.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Media Preview Box */}
                    <div
                      style={{
                        height: '160px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {isImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={asset.url}
                          alt={asset.altText || asset.objectKey}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#6b7280',
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>📄</span>
                          <span
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {asset.mimeType}
                          </span>
                        </div>
                      )}

                      {/* References badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: isReferenced ? '#eef2ff' : '#f3f4f6',
                          color: isReferenced ? '#4f46e5' : '#6b7280',
                          border: isReferenced
                            ? '1px solid #c7d2fe'
                            : '1px solid #e5e7eb',
                        }}
                      >
                        {isReferenced
                          ? `${asset.referencesCount} references`
                          : 'Unreferenced'}
                      </span>
                    </div>

                    {/* Asset Details */}
                    <div
                      style={{
                        padding: '1rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: '#111827',
                          wordBreak: 'break-all',
                          marginBottom: '0.35rem',
                        }}
                        title={asset.objectKey}
                      >
                        {asset.objectKey}
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {formatFileSize(asset.byteSize)}
                        {asset.width &&
                          asset.height &&
                          ` • ${asset.width} × ${asset.height}px`}
                      </div>

                      {/* Alt text display */}
                      <div
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: '#f9fafb',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '4px',
                          color: asset.altText ? '#374151' : '#9ca3af',
                          marginBottom: '1rem',
                          fontStyle: asset.altText ? 'normal' : 'italic',
                        }}
                      >
                        {asset.altText
                          ? `Alt: "${asset.altText}"`
                          : 'No alt text set.'}
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          marginTop: 'auto',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          borderTop: '1px solid #f3f4f6',
                          paddingTop: '0.75rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset)}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            backgroundColor:
                              copiedUrlId === asset.id ? '#ecfdf5' : '#ffffff',
                            color:
                              copiedUrlId === asset.id ? '#065f46' : '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedUrlId === asset.id
                            ? 'Copied URL!'
                            : 'Copy URL'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingAltAsset(asset);
                            setNewAltText(asset.altText || '');
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          Edit Alt
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestDelete(asset)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '4px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Alt Text Modal */}
          {editingAltAsset && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="alt-modal-title"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  maxWidth: '460px',
                  width: '100%',
                  padding: '1.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  id="alt-modal-title"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    color: '#111827',
                  }}
                >
                  Edit Accessibility Alt Text
                </h3>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    margin: '0 0 1rem 0',
                  }}
                >
                  Accurate alt text ensures screen readers and assistive devices
                  can describe this media file.
                </p>

                <form onSubmit={handleSaveAltText}>
                  <textarea
                    rows={3}
                    value={newAltText}
                    onChange={(e) => setNewAltText(e.target.value)}
                    placeholder="Describe what is in the image..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      marginBottom: '1.25rem',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setEditingAltAsset(null)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#374151',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingAlt}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isUpdatingAlt ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isUpdatingAlt ? 'Saving...' : 'Save Alt Text'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Safeguard Warning Modal: Asset is referenced */}
          {safeguardAsset && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="safeguard-modal-title"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '100%',
                  padding: '1.75rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', color: '#d97706' }}>
                    ⚠️
                  </span>
                  <h3
                    id="safeguard-modal-title"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#92400e',
                    }}
                  >
                    Referenced Asset Safeguard
                  </h3>
                </div>

                <p
                  style={{
                    color: '#374151',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    margin: '0 0 1rem 0',
                  }}
                >
                  The asset{' '}
                  <strong style={{ wordBreak: 'break-all' }}>
                    {safeguardAsset.objectKey}
                  </strong>{' '}
                  cannot be deleted because it is currently referenced by{' '}
                  <strong>{safeguardAsset.referencesCount}</strong> published or
                  draft content item(s).
                </p>

                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#92400e',
                    marginBottom: '1.5rem',
                  }}
                >
                  To safely remove this asset, you must first replace or unlink
                  it inside the corresponding Website Content section or
                  Insights article. This safeguard protects live pages from
                  broken image links.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSafeguardAsset(null)}
                    style={{
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Understood
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Modal: Asset has 0 references */}
          {assetToDelete && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-asset-modal-title"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  maxWidth: '460px',
                  width: '100%',
                  padding: '1.75rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  id="delete-asset-modal-title"
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    margin: '0 0 0.75rem 0',
                    color: '#991b1b',
                  }}
                >
                  Delete Media Asset?
                </h3>
                <p
                  style={{
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    margin: '0 0 1.5rem 0',
                  }}
                >
                  Are you sure you want to permanently delete{' '}
                  <strong style={{ wordBreak: 'break-all' }}>
                    {assetToDelete.objectKey}
                  </strong>
                  ? This action is irreversible and removes the object from
                  storage.
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
                    onClick={() => setAssetToDelete(null)}
                    disabled={isDeletingAsset}
                    style={{
                      padding: '0.55rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAsset}
                    disabled={isDeletingAsset}
                    style={{
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDeletingAsset ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDeletingAsset ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: Account & Security */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div>
          {isAccountLoading ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              Loading security details...
            </div>
          ) : (
            <div>
              {/* Single Admin Governance Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        margin: '0 0 0.5rem 0',
                        color: '#111827',
                      }}
                    >
                      Single-Administrator Governance
                    </h2>
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        margin: 0,
                      }}
                    >
                      CodedDevs CMS operates under a single Super Admin model to
                      enforce strict accountability.
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#eef2ff',
                      color: '#4f46e5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      border: '1px solid #c7d2fe',
                    }}
                  >
                    Super Admin
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginTop: '1.5rem',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '1.25rem',
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
                      Administrator Email
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827',
                        marginTop: '0.25rem',
                      }}
                    >
                      {accountInfo?.email || 'admin@codeddevs.com'}
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
                      Active Sessions
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827',
                        marginTop: '0.25rem',
                      }}
                    >
                      {accountInfo?.activeSessionsCount ?? 1} active session(s)
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
                      Role Authority
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#059669',
                        marginTop: '0.25rem',
                      }}
                    >
                      Full Content & Publishing Access
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    color: '#111827',
                  }}
                >
                  Change Super Admin Password
                </h2>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    margin: '0 0 1.25rem 0',
                  }}
                >
                  Updating your password will invalidate other active sessions
                  and require re-authentication.
                </p>

                {passwordError && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      marginBottom: '1.25rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    {passwordError}
                  </div>
                )}

                <form
                  onSubmit={handleChangePasswordSubmit}
                  style={{ maxWidth: '440px' }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      htmlFor="currentPassword"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Current Password *
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      htmlFor="newPassword"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      New Password *
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <small
                      style={{
                        color: '#6b7280',
                        display: 'block',
                        marginTop: '0.25rem',
                      }}
                    >
                      Must be at least 8 characters long.
                    </small>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      htmlFor="confirmPassword"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Confirm New Password *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isChangingPassword
                      ? 'Updating Password...'
                      : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
