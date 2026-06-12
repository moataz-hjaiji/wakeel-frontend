import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import { whatsappService, type WhatsappConnectionStatus } from '../services/whatsapp.service';

const statusLabels: Record<WhatsappConnectionStatus['status'], string> = {
  disconnected: 'Not connected',
  connecting: 'Waiting for scan…',
  connected: 'Connected',
  failed: 'Connection failed',
};

const statusColors: Record<WhatsappConnectionStatus['status'], string> = {
  disconnected: 'bg-slate-100 text-slate-600',
  connecting: 'bg-amber-100 text-amber-800',
  connected: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export function WhatsappPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<WhatsappConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const data = await whatsappService.getStatus(token);
      setStatus(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load status');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleConnect() {
    if (!token) return;
    setError('');
    setMessage('');
    setIsConnecting(true);
    try {
      const result = await whatsappService.connect(token);
      if (result.status === 'connected') {
        setMessage(`Connected as +${result.phone}`);
      } else if (result.status === 'scan_qr') {
        setMessage('Scan the QR code with WhatsApp on your phone');
      } else if (result.message) {
        setMessage(result.message);
      }
      await loadStatus();
      if (result.qr) {
        setStatus((prev) =>
          prev ? { ...prev, qr: result.qr!, status: 'connecting' } : prev,
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connect failed');
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!token) return;
    if (!window.confirm('Disconnect WhatsApp for this store?')) return;
    setIsDisconnecting(true);
    setError('');
    try {
      await whatsappService.disconnect(token);
      setMessage('Disconnected');
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Disconnect failed');
    } finally {
      setIsDisconnecting(false);
    }
  }

  const qr = status?.qr;
  const currentStatus = status?.status ?? 'disconnected';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">WhatsApp</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your store&apos;s WhatsApp number — each store gets its own session via WAHA
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-lg space-y-6">
          {!status?.configured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              WAHA is not configured on the server. Ask your admin to set{' '}
              <code className="rounded bg-amber-100 px-1">WAHA_BASE_URL</code> and{' '}
              <code className="rounded bg-amber-100 px-1">WAHA_API_KEY</code>.
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[currentStatus]}`}
                >
                  {statusLabels[currentStatus]}
                </span>
              </div>
              {status?.phone && (
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Linked number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">+{status.phone}</p>
                </div>
              )}
            </div>

            {status?.sessionName && (
              <p className="mt-4 text-xs text-slate-400">
                Session: <code>{status.sessionName}</code>
              </p>
            )}

            {qr && currentStatus !== 'connected' && (
              <div className="mt-6 flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">
                  Scan with WhatsApp → Linked devices
                </p>
                <img src={qr} alt="WhatsApp QR code" className="h-64 w-64 rounded-lg bg-white p-2" />
                <button
                  type="button"
                  onClick={loadStatus}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
                >
                  Refresh status
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {currentStatus !== 'connected' ? (
                <button
                  type="button"
                  disabled={!status?.configured || isConnecting}
                  onClick={handleConnect}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isConnecting ? 'Starting…' : 'Connect WhatsApp'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isDisconnecting}
                  onClick={handleDisconnect}
                  className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              )}
              <button
                type="button"
                onClick={loadStatus}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{message}</div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">How it works</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Click Connect — a QR code appears</li>
              <li>Open WhatsApp on your phone → Linked devices → Link a device</li>
              <li>Customers message your number — the AI bot replies automatically</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
