import { useEffect, useState } from 'react';
import { Activity, Database, Clock, Zap, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export default function HealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(err.message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'ok';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-gray-500 text-sm mt-1">Vigil server status and cache performance</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] border border-[#2A2A2A] rounded-lg text-gray-300 text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Banner */}
      <div className={`flex items-center gap-4 p-5 rounded-xl border ${
        error ? 'bg-red-500/10 border-red-500/30' :
        isHealthy ? 'bg-green-500/10 border-green-500/30' :
        'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          error ? 'bg-red-500/20' :
          isHealthy ? 'bg-green-500/20' :
          'bg-yellow-500/20'
        }`}>
          <Activity className={`w-7 h-7 ${
            error ? 'text-red-400' :
            isHealthy ? 'text-green-400' :
            'text-yellow-400'
          }`} strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              error ? 'bg-red-500 animate-pulse' :
              isHealthy ? 'bg-green-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <span className={`text-lg font-bold ${
              error ? 'text-red-400' :
              isHealthy ? 'text-green-400' :
              'text-yellow-400'
            }`}>
              {error ? 'UNREACHABLE' : isHealthy ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {error ? `Connection failed: ${error}` :
             isHealthy ? `Uptime: ${formatUptime(health?.data?.uptime)}` :
             'Server responded with unexpected status'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="AI Provider"
          value={health?.data?.aiProvider || '—'}
          color="vigil"
        />
        <StatCard
          icon={<Database className="w-5 h-5" />}
          label="Cache Entries"
          value={health?.data?.cache?.size ?? '—'}
          color="blue"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Cache Hit Rate"
          value={health?.data?.cache?.hitRate || '0%'}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Last Checked"
          value={lastChecked ? lastChecked.toLocaleTimeString() : '—'}
          color="gray"
        />
      </div>

      {/* Cache Details */}
      {health?.data?.cache && (
        <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Cache Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CacheMetric label="Hits" value={health.data.cache.hits} />
            <CacheMetric label="Misses" value={health.data.cache.misses} />
            <CacheMetric label="Entries" value={health.data.cache.size} />
            <CacheMetric label="Hit Rate" value={health.data.cache.hitRate} />
          </div>
          <div className="mt-4 p-3 bg-[#1A1A1A] rounded-lg">
            <p className="text-gray-500 text-xs">
              Cache TTL: 60 seconds. Keys are scoped by <code className="text-vigil">businessId:toolName:args</code>.
              Identical requests within the TTL window return cached responses.
            </p>
          </div>
        </div>
      )}

      {/* Server Info */}
      {health?.data && (
        <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Server Info</h2>
          <div className="space-y-2">
            <InfoRow label="Environment" value={health.data.env || '—'} />
            <InfoRow label="Uptime" value={formatUptime(health.data.uptime)} />
            <InfoRow label="Response" value={JSON.stringify(health.status)} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    vigil: 'bg-vigil/10 text-vigil border-vigil/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.gray}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs font-medium uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function CacheMetric({ label, value }) {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1A1A1A] last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-white text-sm font-mono">{value}</span>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
