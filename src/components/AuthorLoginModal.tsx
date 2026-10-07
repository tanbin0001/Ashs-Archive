import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthorLoginModal: React.FC<AuthorLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError(null);
    setLoading(true);

    const res = await login(password);
    setLoading(false);

    if (res.success) {
      setPassword('');
      onSuccess();
    } else {
      setError(res.error || 'Incorrect passphrase');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl p-8 border shadow-2xl transition-all"
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
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--paper-border)', color: 'var(--ink-accent)' }}
          >
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold tracking-wide">
              Author Sanctuary
            </h2>
            <p className="text-xs text-stone-500 font-garamond italic">
              Ash’s Private Writing Key
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/20 border border-red-800/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1.5 font-garamond">
              Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter author key..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-hidden transition-all font-serif"
              style={{
                backgroundColor: 'var(--paper-page-alt)',
                borderColor: 'var(--paper-border)',
                color: 'var(--ink-primary)',
              }}
            />
            <p className="mt-2 text-[11px] text-stone-500 font-garamond italic flex items-center gap-1">
              <Sparkles size={12} className="text-amber-600 dark:text-amber-400" />
              Initial key: <code className="px-1 py-0.5 rounded bg-stone-200/50 dark:bg-stone-800/50 font-mono">archive2026</code> (editable in settings)
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-garamond uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="px-5 py-2 rounded-lg text-xs font-garamond uppercase tracking-wider text-white transition-opacity disabled:opacity-50 cursor-pointer shadow-md"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              {loading ? 'Unlocking...' : 'Open Journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
