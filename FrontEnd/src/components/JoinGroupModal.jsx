import { useState } from 'react';
import axios from 'axios';

export default function JoinGroupModal({ open, onClose, onJoined }) {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7777';

  const parseGroupId = (link) => {
    if (!link) return '';
    // Try to extract ID from /join/{id}
    const m = link.match(/\/join\/([a-f0-9]{24})/i);
    if (m) return m[1];
    // If user pasted raw ID
    if (/^[a-f0-9]{24}$/i.test(link)) return link;
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const groupId = parseGroupId(inviteLink.trim());
    if (!groupId) {
      setError('Please paste a valid invite link or group ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/groups/join`, { groupId }, { withCredentials: true });
      onJoined?.(res.data?.group || res.data);
      onClose?.();
      setInviteLink('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open={open} className="modal">
      <div className="modal-box bg-white text-black">
        <h3 className="font-bold text-lg mb-4">Join a group</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder="Paste invite link or Group ID"
            className="input input-bordered bg-white text-black"
            value={inviteLink}
            onChange={(e) => setInviteLink(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={loading}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join Group'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
