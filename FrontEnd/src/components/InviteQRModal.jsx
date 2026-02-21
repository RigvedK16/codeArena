import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function InviteQRModal({ open, groupId, groupName, onClose }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    if (!groupId) return '';
    const origin = window.location.origin;
    return `${origin}/join/${groupId}`;
  }, [groupId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // noop
    }
  };

  return (
    <dialog open={open} className="modal">
      <div className="modal-box bg-white text-black">
        <h3 className="font-bold text-lg mb-2">Group Created</h3>
        {groupName && <p className="mb-4">{groupName}</p>}
        <div className="flex flex-col items-center gap-4 py-2">
          {inviteUrl ? (
            <QRCodeCanvas value={inviteUrl} size={256} />
          ) : (
            <div className="text-base-content/70">Preparing QR...</div>
          )}
          <div className="w-full">
            <button className="btn btn-primary w-full" onClick={copyToClipboard} disabled={!inviteUrl}>
              {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>
          <p className="text-xs opacity-70 break-all text-center">{inviteUrl}</p>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
}
