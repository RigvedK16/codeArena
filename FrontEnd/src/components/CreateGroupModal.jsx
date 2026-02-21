import { useState } from 'react';
import axios from 'axios';

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [depositAmountPerPerson, setDepositAmountPerPerson] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7777';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !depositAmountPerPerson) {
      setError('Please fill in required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        depositAmountPerPerson: Number(depositAmountPerPerson),
        currency,
      };
      const res = await axios.post(`${API_BASE}/groups`, payload, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      const group = res.data?.group || res.data; // support either shape
      // Log group details to browser console
      console.log('[CreateGroupModal] Group created:', group);
      onCreated?.(group);
      onClose?.();
      // reset form
      setName('');
      setDescription('');
      setDepositAmountPerPerson('');
      setCurrency('INR');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open={open} className="modal">
      <div className="modal-box bg-white text-black">
        <h3 className="font-bold text-lg mb-4">Create a new group</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder="Group Name"
            className="input input-bordered bg-white text-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="input input-bordered bg-white text-black"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Deposit Amount Per Person"
            className="input input-bordered bg-white text-black"
            value={depositAmountPerPerson}
            onChange={(e) => setDepositAmountPerPerson(e.target.value)}
            min="0"
            step="0.01"
            required
          />
          <select
            className="select select-bordered bg-white text-black"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={loading}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
