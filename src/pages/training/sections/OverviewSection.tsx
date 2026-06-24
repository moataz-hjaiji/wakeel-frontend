import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { OverviewSection as OverviewSectionData } from '../../../types/training';
import { Button, Card } from '../../../components/ui/primitives';
import type { SectionProps, SectionKey } from '../TrainingPage';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'added by you',
  interview: 'from the interview',
  document: 'from a file',
};

/** Read-through of EXACTLY what the agent knows (compiled from every source),
 *  with edit links that jump to the right tab. General-knowledge entries are
 *  editable inline. */
export function OverviewSection({ onChanged, jump }: SectionProps) {
  const { token } = useAuth();
  const [sections, setSections] = useState<OverviewSectionData[] | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    trainingService.overview(token).then(setSections);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!sections) {
    return <div className="h-40 animate-pulse rounded-[14px] bg-surface-muted" />;
  }

  if (sections.length === 0) {
    return (
      <Card>
        <h3 className="text-[15px] font-semibold text-text">Your agent doesn't know anything yet</h3>
        <p className="mt-1 text-[13px] text-text-muted">
          Fill in <strong>Business basics</strong>, or let the <strong>AI interview</strong> ask you
          questions — then everything it learns shows up here.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => jump('basics')}>
            Start with basics
          </Button>
          <Button variant="secondary" size="sm" onClick={() => jump('interview')}>
            Let the AI ask me
          </Button>
        </div>
      </Card>
    );
  }

  async function editEntry(id: string, topic: string, content: string) {
    if (!token) return;
    const next = window.prompt('Edit this fact:', `${topic}: ${content}`);
    if (next == null) return;
    const [t, ...rest] = next.split(':');
    await trainingService.updateKnowledge(
      id,
      { topic: t.trim(), content: rest.join(':').trim() || t.trim() },
      token,
    );
    load();
    onChanged();
  }

  async function deleteEntry(id: string) {
    if (!token) return;
    await trainingService.deleteKnowledge(id, token);
    load();
    onChanged();
  }

  return (
    <div className="space-y-3">
      <Card className="bg-brand-soft/40">
        <p className="text-[13px] text-text">
          This is <strong>exactly what your agent uses</strong> to answer customers — drafts
          included. Anything not here, it won't say. Use the Edit links to change a section.
        </p>
      </Card>

      {sections.map((s) => (
        <Card key={s.key}>
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text">{s.title}</h3>
            <button
              type="button"
              onClick={() => jump(s.editTarget as SectionKey)}
              className="text-[12px] font-medium text-brand hover:underline"
            >
              Edit →
            </button>
          </div>

          {s.entries ? (
            <div className="mt-2 space-y-1.5">
              {s.entries.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-start justify-between gap-2 rounded-md bg-surface-muted px-3 py-1.5"
                >
                  <span className="text-[13px] text-text">
                    <strong className="font-medium">{e.topic}:</strong> {e.content}
                    <span className="ms-1 text-[11px] text-text-subtle">
                      ({SOURCE_LABEL[e.source] ?? e.source})
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => editEntry(e.id, e.topic, e.content)}
                      className="text-[12px] font-medium text-text-muted hover:text-text"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(e.id)}
                      className="text-[12px] font-medium text-danger hover:underline"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ul className="mt-2 space-y-0.5">
              {s.lines.map((line, i) => (
                <li key={i} className="whitespace-pre-wrap text-[13px] text-text-muted" dir="auto">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
