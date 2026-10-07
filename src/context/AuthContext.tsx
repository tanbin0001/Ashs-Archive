import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthorProfile } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  author: AuthorProfile | null;
  loading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateAuthorProfile: (profile: Partial<AuthorProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ash_archive_auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch author profile
  const fetchProfile = async (authToken?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      const activeToken = authToken !== undefined ? authToken : token;
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      const res = await fetch('/api/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        setAuthor(data);
      }
    } catch (err) {
      console.error('Failed to load author profile:', err);
    }
  };

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      if (!token) {
        setIsAuthenticated(false);
        await fetchProfile(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setAuthor(data.author);
          } else {
            // Token invalidated
            setIsAuthenticated(false);
            setToken(null);
            localStorage.removeItem('ash_archive_auth_token');
            await fetchProfile(null);
          }
        } else {
          setIsAuthenticated(false);
          setToken(null);
          localStorage.removeItem('ash_archive_auth_token');
          await fetchProfile(null);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setIsAuthenticated(false);
        await fetchProfile(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        setIsAuthenticated(true);
        setAuthor(data.author);
        localStorage.setItem('ash_archive_auth_token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Connection error while authenticating' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('ash_archive_auth_token');
      await fetchProfile(null);
    }
  };

  const updateAuthorProfile = async (updates: Partial<AuthorProfile>) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthor(data.author);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update author profile' };
      }
    } catch (err) {
      console.error('Update author profile error:', err);
      return { success: false, error: 'Network error updating profile' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to change password' };
      }
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Network error updating password' };
    }
  };

  const refreshProfile = async () => {
    await fetchProfile(token);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        author,
        loading,
        login,
        logout,
        updateAuthorProfile,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
