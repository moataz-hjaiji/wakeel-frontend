import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { trainingService } from '../../services/training.service';
import type { TrainingStatusCounts } from '../../types/training';
import { Badge, Button } from '../../components/ui/primitives';
import { PreviewPanel } from './PreviewPanel';
import { OverviewSection } from './sections/OverviewSection';
import { BasicsSection } from './sections/BasicsSection';
import { OperatingSection } from './sections/OperatingSection';
import { QnaSection } from './sections/QnaSection';
import { InterviewSection } from './sections/InterviewSection';

export type SectionKey = 'overview' | 'basics' | 'operating' | 'qa' | 'interview';

const SECTIONS: {
  key: SectionKey;
  labelKey: string;
  num: number;
  desc: string;
}[] = [
  { key: 'overview', labelKey: 'tc.overview', num: 1, desc: 'Everything your agent knows, in one place' },
  { key: 'basics', labelKey: 'tc.basics', num: 2, desc: 'Name, what you do, pricing, how it behaves' },
  { key: 'operating', labelKey: 'tc.operating', num: 3, desc: 'Hours, delivery, policies (optional)' },
  { key: 'qa', labelKey: 'tc.qa', num: 4, desc: 'Common questions & your answers' },
  { key: 'interview', labelKey: 'tc.interview', num: 5, desc: 'Let the AI ask you what it needs' },
];

export interface SectionProps {
  onChanged: () => void;
  jump: (key: SectionKey) => void;
}

export function TrainingPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [active, setActive] = useState<SectionKey>('overview');
  const [status, setStatus] = useState<TrainingStatusCounts | null>(null);
  const [publishing, setPublishing] = useState(false);

  const refreshStatus = useCallback(() => {
    if (!token) return;
    trainingService.status(token).then(setStatus).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function publish() {
    if (!token) return;
    setPublishing(true);
    try {
      await trainingService.publish(token);
      refreshStatus();
    } finally {
      setPublishing(false);
    }
  }

  const sectionProps: SectionProps = { onChanged: refreshStatus, jump: setActive };

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-text">{t('tc.title')}</h2>
            <p className="mt-0.5 text-[13px] text-text-muted">
              Fill in the steps on the left, test on the right, then publish to go live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status &&
              (status.pending ? (
                <Badge tone="warning">
                  {status.draft} unpublished change{status.draft === 1 ? '' : 's'}
                </Badge>
              ) : (
                <Badge tone="brand">✓ Live</Badge>
              ))}
            <Button onClick={publish} disabled={publishing || !status?.pending}>
              {publishing ? t('tc.publishing') : t('tc.publish')}
            </Button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5 text-[12px] text-text-subtle">
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-text-muted">
            1. Edit
          </span>
          <span>→</span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-text-muted">
            2. Test in preview →
          </span>
          <span>→</span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-text-muted">
            3. Publish
          </span>
          <span className="ms-1">
            Your changes stay private until you publish. The live agent only uses published info.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[230px_1fr_320px] gap-4 max-[1100px]:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors ${
                  isActive ? 'bg-brand-soft' : 'hover:bg-surface-muted'
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    isActive ? 'bg-brand text-white' : 'bg-surface-muted text-text-muted'
                  }`}
                >
                  {s.num}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[13px] font-medium ${
                      isActive ? 'text-brand' : 'text-text'
                    }`}
                  >
                    {t(s.labelKey)}
                  </span>
                  <span className="block text-[11px] leading-tight text-text-subtle">
                    {s.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {active === 'overview' && <OverviewSection {...sectionProps} />}
          {active === 'basics' && <BasicsSection {...sectionProps} />}
          {active === 'operating' && <OperatingSection {...sectionProps} />}
          {active === 'qa' && <QnaSection {...sectionProps} />}
          {active === 'interview' && <InterviewSection {...sectionProps} />}
        </div>

        <div className="h-[calc(100vh-11rem)] max-[1100px]:hidden">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
