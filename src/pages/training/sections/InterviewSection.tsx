import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import { Button, Card } from '../../../components/ui/primitives';
import type { SectionProps } from '../TrainingPage';

type Turn = { role: 'assistant' | 'user'; content: string };

/**
 * The AI interviewer: it keeps asking the owner smart questions about their
 * business; each answer is distilled into an editable knowledge entry (draft).
 * Owner stops whenever they want.
 */
export function InterviewSection({ onChanged, jump }: SectionProps) {
  const { token } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    setLoading(true);
    trainingService
      .interviewNext([], token)
      .then((r) => {
        setCurrentQ(r.question);
        setTurns([{ role: 'assistant', content: r.question }]);
        setDone(r.done);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const answer = input.trim();
    if (!answer || !token || loading) return;
    setInput('');
    const history = [...turns];
    setTurns((t) => [...t, { role: 'user', content: answer }]);
    setLoading(true);
    try {
      const r = await trainingService.interviewAnswer(
        { question: currentQ, answer, history },
        token,
      );
      if (r.saved) {
        setSavedCount((c) => c + 1);
        onChanged();
      }
      setCurrentQ(r.nextQuestion);
      setDone(r.done);
      setTurns((t) => [...t, { role: 'assistant', content: r.nextQuestion }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-15rem)] flex-col gap-3">
      <Card>
        <h3 className="text-[15px] font-semibold text-text">Let the AI learn about your business</h3>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Answer in your own words — no forms. Each answer becomes something your agent knows
          (saved as a draft). Stop anytime; you've saved{' '}
          <strong className="text-brand">{savedCount}</strong> so far.
          {savedCount > 0 && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => jump('overview')}
                className="font-medium text-brand hover:underline"
              >
                Review them →
              </button>
            </>
          )}
        </p>
      </Card>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-sm)]">
        <div className="flex-1 space-y-2 overflow-y-auto bg-bg px-4 py-3">
          {turns.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                dir="auto"
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-brand text-white'
                    : 'rounded-bl-md border border-border bg-surface text-text'
                }`}
              >
                {m.role === 'assistant' && (
                  <p className="mb-0.5 text-[10px] font-medium text-brand">AI interviewer</p>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2 text-[13px] text-text-subtle">
                …
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-border p-2.5">
          <input
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={done ? 'Add anything else…' : 'Type your answer…'}
            disabled={loading}
            className="h-9 flex-1 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
          />
          <Button type="submit" disabled={!input.trim() || loading}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
