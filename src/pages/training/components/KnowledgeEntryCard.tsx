import { useState } from 'react';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Added by you',
  interview: 'From interview',
  document: 'From file',
};

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '');
}

const CONTENT_PREVIEW_LEN = 180;

export function KnowledgeEntryCard({
  topic,
  content,
  source,
  onEdit,
  onDelete,
}: {
  topic: string;
  content: string;
  source: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cleanTopic = stripBom(topic);
  const cleanContent = stripBom(content);
  const isLong = cleanContent.length > CONTENT_PREVIEW_LEN;
  const displayContent =
    isLong && !expanded
      ? `${cleanContent.slice(0, CONTENT_PREVIEW_LEN)}…`
      : cleanContent;

  return (
    <div className="group rounded-[10px] border border-border bg-surface-muted/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug text-text" dir="auto">
            {cleanTopic}
          </p>
          {cleanContent && cleanContent !== cleanTopic && (
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-text-muted" dir="auto">
              {displayContent}
            </p>
          )}
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[12px] font-medium text-brand hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-subtle">
          {SOURCE_LABEL[source] ?? source}
        </span>
      </div>
      <div className="mt-2 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="text-[12px] font-medium text-text-muted hover:text-text"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[12px] font-medium text-danger hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
