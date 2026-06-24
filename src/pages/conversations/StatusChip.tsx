import { Badge } from '../../components/ui/primitives';
import type { ConversationStatus } from '../../types/conversations';

/** Plain-language status chips — never raw codes. */
const CHIPS: Record<
  ConversationStatus,
  { label: string; tone: 'brand' | 'warning' | 'danger' | 'info' | 'neutral'; icon: string }
> = {
  agent_handling: { label: 'Agent handling', tone: 'brand', icon: '🤖' },
  needs_human: { label: 'Needs you', tone: 'warning', icon: '🙋' },
  human_took_over: { label: "You're handling", tone: 'info', icon: '✋' },
  blocked: { label: 'Agent blocked', tone: 'danger', icon: '🚫' },
  resolved: { label: 'Resolved', tone: 'neutral', icon: '✓' },
  agent_off: { label: 'Agent off', tone: 'neutral', icon: '⏸️' },
};

export function StatusChip({ status }: { status: ConversationStatus }) {
  const c = CHIPS[status];
  return (
    <Badge tone={c.tone}>
      <span className="me-1" aria-hidden>
        {c.icon}
      </span>
      {c.label}
    </Badge>
  );
}
