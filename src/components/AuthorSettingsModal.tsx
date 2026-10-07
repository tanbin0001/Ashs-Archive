import React, { useState } from 'react';
import { X, User, Key, LogOut, Check, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorSettingsModal: React.FC<AuthorSettingsModalProps> = ({ isOpen, onClose }) => {
  const { author, updateAuthorProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile form state
  const [name, setName] = useState(author?.name || '');
  const [authorTitle, setAuthorTitle] = useState(author?.authorTitle || '');
  const [bio, setBio] = useState(author?.bio || '');
  const [coverQuote, setCoverQuote] = useState(author?.coverQuote || '');
  const [avatarUrl, setAvatarUrl] = useState(author?.avatarUrl || '');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await updateAuthorProfile({
      name,
      authorTitle,
      bio,
      coverQuote,
      avatarUrl,
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg('Profile information updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters');
      return;
    }

    setLoading(true);
    const res = await changePassword(oldPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Author passphrase changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              filename: file.name,
            }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setAvatarUrl(data.url);
          } else {
            setErrorMsg(data.error || 'Avatar upload failed');
          }
        } catch {
          setErrorMsg('Failed to process image upload');
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
      setErrorMsg('Could not read image file');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 md:p-8 border shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--paper-page)',
          borderColor: 'var(--paper-border)',
          color: 'var(--ink-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--paper-border)' }}>
          <div>
            <h2 className="text-xl font-display font-semibold tracking-wide">
              Author Settings
            </h2>
            <p className="text-xs text-stone-500 font-garamond italic">
              Manage cover inscription and author identity
            </p>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-600 transition-colors cursor-pointer font-garamond uppercase tracking-wider"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-4 mb-6 border-b" style={{ borderColor: 'var(--paper-border)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 text-xs font-garamond uppercase tracking-wider transition-colors cursor-pointer relative ${
              activeTab === 'profile' ? 'font-semibold' : 'text-stone-500 hover:text-stone-800'
            }`}
            style={{ color: activeTab === 'profile' ? 'var(--ink-accent)' : undefined }}
          >
            <span className="flex items-center gap-1.5">
              <User size={14} /> Profile & Cover
            </span>
            {activeTab === 'profile' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--ink-accent)' }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 text-xs font-garamond uppercase tracking-wider transition-colors cursor-pointer relative ${
              activeTab === 'security' ? 'font-semibold' : 'text-stone-500 hover:text-stone-800'
            }`}
            style={{ color: activeTab === 'security' ? 'var(--ink-accent)' : undefined }}
          >
            <span className="flex items-center gap-1.5">
              <Key size={14} /> Passphrase
            </span>
            {activeTab === 'security' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--ink-accent)' }}
              />
            )}
          </button>
        </div>

        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/20 border border-red-800/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar Preview & Upload */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden border-2 relative group shadow-inner"
                  style={{ borderColor: 'var(--paper-border)', backgroundColor: 'var(--paper-page-alt)' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <User size={32} />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-file"
                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs"
                    title="Change Photo"
                  >
                    <Upload size={16} />
                  </label>
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <label
                  htmlFor="avatar-file"
                  className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer font-garamond underline"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </label>
              </div>

              {/* Name & Title */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Ash"
                    className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--paper-page-alt)',
                      borderColor: 'var(--paper-border)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                    Sub-heading / Inscription Title
                  </label>
                  <input
                    type="text"
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="e.g. Keeper of Quiet Thoughts"
                    className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--paper-page-alt)',
                      borderColor: 'var(--paper-border)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Avatar URL alternative */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                Or Photo Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                Short Bio (Bangla / English)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few quiet words describing you or the journal..."
                className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            {/* Cover Quote */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                Front Cover Quote (Displayed prominently on front page)
              </label>
              <textarea
                rows={4}
                value={coverQuote}
                onChange={(e) => setCoverQuote(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm font-bengali leading-relaxed focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
              <p className="mt-1 text-[11px] text-stone-500 font-garamond italic">
                Rendered with Noto Serif Bengali on the diary cover.
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg text-xs font-garamond uppercase tracking-wider text-white transition-opacity disabled:opacity-50 cursor-pointer shadow-md"
                style={{ backgroundColor: 'var(--ink-accent)' }}
              >
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                Current Passphrase
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Current author key..."
                className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                New Passphrase
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 4 characters..."
                className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1 font-garamond">
                Confirm New Passphrase
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new passphrase..."
                className="w-full px-3 py-2 rounded-lg border text-sm font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg text-xs font-garamond uppercase tracking-wider text-white transition-opacity disabled:opacity-50 cursor-pointer shadow-md"
                style={{ backgroundColor: 'var(--ink-accent)' }}
              >
                {loading ? 'Updating Key...' : 'Update Passphrase'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
