import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7777';

  const loadGroups = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/groups/my`, { withCredentials: true });
      setGroups(res.data?.groups || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    const handler = () => loadGroups();
    window.addEventListener('groups:refresh', handler);
    return () => window.removeEventListener('groups:refresh', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  return (
    <div className="min-h-screen bg-white text-black flex">
      <Sidebar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">My Groups</h1>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g._id} className="card bg-white shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">{g.name}</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expandedId === g._id ? null : g._id)}>
                    {expandedId === g._id ? 'Hide' : 'Details'}
                  </button>
                </div>
                {expandedId === g._id && (
                  <div className="mt-2">
                    <p className="opacity-70">{g.description || 'No description'}</p>
                    <div className="mt-2 text-sm opacity-70">Deposit per person: {g.depositAmountPerPerson} {g.currency}</div>
                    <div className="mt-1 text-sm opacity-70">Status: {g.status}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!loading && groups.length === 0 && (
            <div className="text-base-content/70">No groups yet — create or join one!</div>
          )}
        </div>
      </main>
    </div>
  );
}
