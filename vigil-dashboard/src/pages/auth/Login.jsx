import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secret.trim()) return setError('Enter the dashboard secret');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Invalid secret');
      }

      localStorage.setItem('vigil_token', data.data.token);
      login({ is_super_admin: true, name: 'Super Admin' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-vigil flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-dark-charcoal">Vigil Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Super Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded shadow-md p-6">
          {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-danger">{error}</p>}
          <label className="block text-sm font-medium text-dark-charcoal mb-1.5">Dashboard Secret</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Enter dashboard secret"
            className="w-full border border-border-gray rounded px-3 py-2 text-sm mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vigil text-white rounded py-2.5 text-sm font-semibold hover:bg-vigil-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
