import { useEffect, useState } from 'react';
import { AuthContext } from './authInstance.context';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

function clearAuthStorage() {
  localStorage.removeItem('vigil_token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = localStorage.getItem('vigil_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (!res.ok) throw new Error('not ok');
        if (cancelled) return;
        setUser({ is_super_admin: true, name: 'Super Admin' });
      } catch {
        if (cancelled) return;
        clearAuthStorage();
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const login = userData => setUser(userData);

  const logout = () => {
    setUser(null);
    clearAuthStorage();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, isSuperAdmin: user?.is_super_admin || false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
