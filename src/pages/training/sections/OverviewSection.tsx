import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { OverviewSection as OverviewSectionData } from '../../../types/training';
import { Button, Card } from '../../../components/ui/primitives';
import type { SectionProps, SectionKey } from '../TrainingPage';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

/** Read-through of EXACTLY what the agent knows (compiled from every source),
 *  with edit links that jump to the right tab. */
export function OverviewSection({ onChanged, jump }: SectionProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
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
    const nextTopic = window.prompt('Topic / title:', topic);
    if (nextTopic == null) return;
    const nextContent = window.prompt('Details:', content);
    if (nextContent == null) return;
    await trainingService.updateKnowledge(
      id,
      { topic: nextTopic.trim(), content: nextContent.trim() },
      token,
    );
    load();
    onChanged();
  }

  async function deleteEntry(id: string) {
    if (!token) return;
    if (!window.confirm('Remove this knowledge entry?')) return;
    await trainingService.deleteKnowledge(id, token);
    load();
    onChanged();
  }

  function handleEditTarget(target: string) {
    if (target === 'catalog') {
      navigate('/dashboard/catalog');
    } else {
      jump(target as SectionKey);
    }
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-text">{s.title}</h3>
            <button
              type="button"
              onClick={() => handleEditTarget(s.editTarget)}
              className="shrink-0 text-[12px] font-medium text-brand hover:underline"
            >
              Edit →
            </button>
          </div>

          {s.entries ? (
            <div className="mt-3 space-y-2">
              {s.entries.map((e) => (
                <KnowledgeEntryCard
                  key={e.id}
                  topic={e.topic}
                  content={e.content}
                  source={e.source}
                  onEdit={() => editEntry(e.id, e.topic, e.content)}
                  onDelete={() => deleteEntry(e.id)}
                />
              ))}
            </div>
          ) : (
            <ul className="mt-2 space-y-1">
              {s.lines.map((line, i) => (
                <li
                  key={i}
                  className="rounded-md bg-surface-muted/50 px-2.5 py-1.5 text-[13px] text-text-muted"
                  dir="auto"
                >
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
