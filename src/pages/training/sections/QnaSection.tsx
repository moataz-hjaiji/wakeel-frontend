import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { QnaPair } from '../../../types/training';
import { Button, Card, Field, Input } from '../../../components/ui/primitives';
import type { SectionProps } from '../TrainingPage';

export function QnaSection({ onChanged }: SectionProps) {
  const { token } = useAuth();
  const [items, setItems] = useState<QnaPair[]>([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => token && trainingService.listQna(token).then(setItems);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit() {
    if (!token || !q.trim() || !a.trim()) return;
    if (editingId) {
      await trainingService.updateQna(editingId, { question: q, answer: a }, token);
    } else {
      await trainingService.createQna({ question: q, answer: a }, token);
    }
    setQ('');
    setA('');
    setEditingId(null);
    load();
    onChanged();
  }

  async function remove(id: string) {
    if (!token) return;
    await trainingService.deleteQna(id, token);
    load();
    onChanged();
  }

  function edit(item: QnaPair) {
    setEditingId(item.id);
    setQ(item.question);
    setA(item.answer);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-[15px] font-semibold text-text">
          What do customers ask, and how should the agent answer?
        </h3>
        <div className="mt-4 space-y-3">
          <Field label="Question">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do you do gluten-free?" />
          </Field>
          <Field label="Answer">
            <Input value={a} onChange={(e) => setA(e.target.value)} placeholder="Yes, +2 TND on any pizza." />
          </Field>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!q.trim() || !a.trim()}>
              {editingId ? 'Save' : 'Add'}
            </Button>
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setQ('');
                  setA('');
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-text">{item.question}</p>
                <p className="mt-0.5 text-[13px] text-text-muted">{item.answer}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={() => edit(item)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => remove(item.id)}
                  className="border-danger/30 text-danger hover:bg-danger-soft"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="px-1 text-[13px] text-text-subtle">No Q&A yet.</p>
        )}
      </div>
    </div>
  );
}
