import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import { chatService } from '../services/chat.service';
import type { ChatMessage } from '../types/chat';

const SESSION_KEY = 'dashboard_chat_session';

function newLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function ChatPage() {
  const { store } = useAuth();
  const storeId = store?.id ?? '';

  const [sessionId, setSessionId] = useState(() => {
    const saved = sessionStorage.getItem(`${SESSION_KEY}_${storeId}`);
    return saved || '';
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Load existing session history on mount
  useEffect(() => {
    async function loadHistory() {
      if (!storeId) return;
      setIsBootstrapping(true);

      const savedSession = sessionStorage.getItem(`${SESSION_KEY}_${storeId}`);
      if (!savedSession) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! I\'m your store assistant. Ask me anything about our catalog or FAQs.',
          },
        ]);
        setIsBootstrapping(false);
        return;
      }

      try {
        const history = await chatService.getHistory(savedSession, storeId);
        if (history.length > 0) {
          setSessionId(savedSession);
          setMessages(
            history.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            })),
          );
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: 'Hi! How can I help you today?',
            },
          ]);
        }
      } catch {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! How can I help you today?',
          },
        ]);
      } finally {
        setIsBootstrapping(false);
      }
    }

    loadHistory();
  }, [storeId]);

  function persistSession(id: string) {
    setSessionId(id);
    sessionStorage.setItem(`${SESSION_KEY}_${storeId}`, id);
  }

  function startNewConversation() {
    sessionStorage.removeItem(`${SESSION_KEY}_${storeId}`);
    setSessionId('');
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'New conversation started. How can I help you?',
      },
    ]);
    setError('');
    inputRef.current?.focus();
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !storeId || isLoading) return;

    setInput('');
    setError('');

    const userMsg: ChatMessage = {
      id: newLocalId(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await chatService.send({
        storeId,
        sessionId: sessionId || undefined,
        message: text,
      });

      persistSession(res.sessionId);

      setMessages((prev) => [
        ...prev,
        { id: newLocalId(), role: 'assistant', content: res.reply },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh)] max-h-[calc(100vh)] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Test Chatbot</h1>
          <p className="text-sm text-slate-500">
            Preview how customers experience your AI assistant
          </p>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          New conversation
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {isBootstrapping ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-indigo-600 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <p className="mb-1 text-xs font-medium text-indigo-600">Assistant</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4">
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message as a customer would…"
            disabled={isLoading || isBootstrapping}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isBootstrapping}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-slate-400">
            Uses your catalog &amp; Q&amp;A with AI (OpenAI + Qdrant when enabled)
        </p>
      </div>
    </div>
  );
}
