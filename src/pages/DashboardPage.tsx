import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { whatsappService, type WhatsappConnectionStatus } from '../services/whatsapp.service';
import { ApiError } from '../lib/api';
import { Card, StatTile, StatusDot, Badge, Button } from '../components/ui/primitives';

export function DashboardPage() {
  const { store, token } = useAuth();
  const { t } = useI18n();
  const [wa, setWa] = useState<WhatsappConnectionStatus | null>(null);

  useEffect(() => {
    if (!token) return;
    whatsappService
      .getStatus(token)
      .then(setWa)
      .catch((err) => {
        if (!(err instanceof ApiError)) return;
      });
  }, [token]);

  const connected = wa?.status === 'connected';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-text">
          {t('overview.welcome', { name: store?.name ?? '' })}
        </h2>
        <p className="mt-0.5 text-[13px] text-text-muted">{t('overview.subtitle')}</p>
      </div>

      {/* Status strip */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[13px] font-medium text-text-muted">{t('overview.agent')}</p>
              <div className="mt-1">
                <StatusDot
                  active={connected}
                  label={connected ? t('overview.active') : t('overview.paused')}
                />
              </div>
            </div>
            <div className="h-9 w-px bg-border" />
            <div>
              <p className="text-[13px] font-medium text-text-muted">{t('overview.whatsapp')}</p>
              <p className="mt-1 text-sm font-medium text-text">
                {connected && wa?.phone ? (
                  `+${wa.phone}`
                ) : (
                  <span className="text-text-subtle">{t('overview.notConnected')}</span>
                )}
              </p>
            </div>
            <div className="h-9 w-px bg-border" />
            <div>
              <p className="text-[13px] font-medium text-text-muted">{t('overview.languages')}</p>
              <p className="mt-1 text-sm text-text">Derja · FR · AR · EN</p>
            </div>
          </div>

          {!connected && (
            <Link to="/dashboard/whatsapp">
              <Button size="sm">{t('common.connect')}</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('overview.statConversations')} value="—" />
        <StatTile label={t('overview.statResolved')} value="—" />
        <StatTile label={t('overview.statHandoffs')} value="—" />
        <StatTile label={t('overview.statResponse')} value="—" />
      </div>

      {/* Connection details — quiet, secondary */}
      <Card>
        <p className="text-[13px] font-medium text-text-muted">
          {t('overview.connectionDetails')}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-subtle">Store ID</p>
            <p className="mt-1 break-all font-mono text-[13px] text-text">{store?.id}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-subtle">Webhook secret</p>
              <Badge tone="neutral">keep private</Badge>
            </div>
            <p className="mt-1 break-all font-mono text-[13px] text-text">
              {store?.webhookSecret}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
