import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  RtConversationEscalated,
  RtConversationUpdated,
  RtMessageCreated,
} from '../../types/conversations';

interface Handlers {
  onMessage?: (e: RtMessageCreated) => void;
  onUpdated?: (e: RtConversationUpdated) => void;
  onEscalated?: (e: RtConversationEscalated) => void;
  onModeChanged?: (e: { mode: string }) => void;
}

/**
 * Connects the dashboard to its store's realtime room. The JWT in the handshake
 * makes the server auto-join `store:<id>` — the client never picks a room, so a
 * tenant only ever receives its own events.
 */
export function useConversationsSocket(token: string | null, handlers: Handlers) {
  const ref = useRef<Handlers>(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io('/chat', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('message.created', (e: RtMessageCreated) => ref.current.onMessage?.(e));
    socket.on('conversation.updated', (e: RtConversationUpdated) => ref.current.onUpdated?.(e));
    socket.on('conversation.escalated', (e: RtConversationEscalated) =>
      ref.current.onEscalated?.(e),
    );
    socket.on('store.mode.changed', (e: { mode: string }) => ref.current.onModeChanged?.(e));

    return () => {
      socket.disconnect();
    };
  }, [token]);
}
