import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { ApiError } from '../lib/api';
import { whatsappService, type WhatsappConnectionStatus } from '../services/whatsapp.service';
import { Card, Button, Badge } from '../components/ui/primitives';

const statusLabelKeys: Record<WhatsappConnectionStatus['status'], string> = {
  disconnected: 'wa.statusDisconnected',
  connecting: 'wa.statusConnecting',
  connected: 'wa.statusConnected',
  failed: 'wa.statusFailed',
};

const statusTones: Record<
  WhatsappConnectionStatus['status'],
  'neutral' | 'warning' | 'brand' | 'danger'
> = {
  disconnected: 'neutral',
  connecting: 'warning',
  connected: 'brand',
  failed: 'danger',
};

export function WhatsappPage() {
  const { token } = useAuth();
  const { t } = useI18n();
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
      setStatus(await whatsappService.getStatus(token));
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
      if (result.status === 'connected') setMessage(`Connected as +${result.phone}`);
      else if (result.status === 'scan_qr') setMessage('Scan the QR code with WhatsApp on your phone');
      else if (result.message) setMessage(result.message);
      await loadStatus();
      if (result.qr) {
        setStatus((prev) => (prev ? { ...prev, qr: result.qr!, status: 'connecting' } : prev));
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
  const connected = currentStatus === 'connected';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text">{t('whatsapp.title')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('whatsapp.subtitle')}</p>
      </div>

      {isLoading ? (
        <Card>
          <div className="h-20 animate-pulse rounded-lg bg-surface-muted" />
        </Card>
      ) : (
        <>
          {!status?.configured && (
            <Card className="border-warning/30 bg-warning-soft">
              <p className="text-sm text-text">
                WhatsApp isn't enabled on the server yet. Ask your admin to turn on the
                WhatsApp engine.
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-text-muted">{t('whatsapp.status')}</p>
                <div className="mt-2">
                  <Badge tone={statusTones[currentStatus]}>
                    {t(statusLabelKeys[currentStatus])}
                  </Badge>
                </div>
              </div>
              {status?.phone && (
                <div className="text-end">
                  <p className="text-[13px] font-medium text-text-muted">
                    {t('whatsapp.linkedNumber')}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-text">+{status.phone}</p>
                </div>
              )}
            </div>

            {qr && !connected && (
              <div className="mt-6 flex flex-col items-center rounded-[10px] border border-border bg-surface-muted p-6">
                <p className="mb-4 text-sm font-medium text-text">
                  Scan with WhatsApp → Linked devices
                </p>
                <img
                  src={qr}
                  alt="WhatsApp QR code"
                  className="h-64 w-64 rounded-lg bg-white p-2"
                />
                <button
                  type="button"
                  onClick={loadStatus}
                  className="mt-4 text-sm font-medium text-brand hover:underline"
                >
                  Refresh status
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!connected ? (
                <Button
                  disabled={!status?.configured || isConnecting}
                  onClick={handleConnect}
                >
                  {isConnecting ? 'Starting…' : t('common.connect')}
                </Button>
              ) : (
                <Button variant="danger" disabled={isDisconnecting} onClick={handleDisconnect}>
                  {isDisconnecting ? 'Disconnecting…' : t('whatsapp.disconnect')}
                </Button>
              )}
              <Button variant="secondary" onClick={loadStatus}>
                {t('common.refresh')}
              </Button>
            </div>
          </Card>

          {message && (
            <div className="rounded-[10px] bg-brand-soft px-4 py-3 text-sm text-brand">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-[10px] bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Card>
            <p className="font-medium text-text">{t('whatsapp.howItWorks')}</p>
            <ol className="mt-3 space-y-2 text-sm text-text-muted">
              <li>1. Click Connect — a QR code appears.</li>
              <li>2. Open WhatsApp → Linked devices → Link a device.</li>
              <li>3. Customers message your number — your agent replies automatically.</li>
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
