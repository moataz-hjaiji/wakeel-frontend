import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { trainingService } from '../../services/training.service';
import { Button } from '../../components/ui/primitives';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Always-visible docked chat. Talks to /training/preview-chat, which reads
 * DRAFT data — so the owner sees training changes immediately, before publish.
 */
export function PreviewPanel() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !token || loading) return;
    setInput('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await trainingService.preview(
        { message: text, sessionId: sessionRef.current },
        token,
      );
      sessionRef.current = res.sessionId;
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'assistant', content: res.reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '⚠️ Could not reach the agent.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    sessionRef.current = undefined;
    setMessages([]);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-sm)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <p className="text-[13px] font-semibold text-text">{t('tc.preview')}</p>
          <p className="text-[11px] text-text-subtle">{t('tc.previewHint')}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-[12px] font-medium text-text-muted hover:text-text"
        >
          ↺
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-bg px-3 py-3">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-[12px] text-text-subtle">
            "how much is X" · "are you open now" · "do you deliver to Y"
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              dir="auto"
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-brand text-white'
                  : 'rounded-bl-md border border-border bg-surface text-text'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2">
              <span className="text-[12px] text-text-subtle">…</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-border p-2.5">
        <input
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask as a customer…"
          disabled={loading}
          className="h-8 flex-1 rounded-[10px] border border-border bg-surface px-3 text-[12px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || loading}>
          →
        </Button>
      </form>
    </div>
  );
}
