import { type FC, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useUserStore } from '@/store/userStore';

interface ChatMessage {
  id: string; // client-assigned stable key; not from server
  senderId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  roomCode: string;
}

export const ChatPanel: FC<ChatPanelProps> = ({ roomCode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();

  const msgSeqRef = useRef(0);

  // Subscribe to incoming chat messages
  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try { socket = getSocket(); } catch { return; }

    // Assign a stable client-side id so we never use array index as React key
    const handler = (msg: Omit<ChatMessage, 'id'>): void => {
      msgSeqRef.current += 1;
      setMessages((prev) => [...prev, { ...msg, id: `${msg.senderId}-${msg.timestamp}-${msgSeqRef.current}` }]);
    };

    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((): void => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const socket = getSocket();
      socket.emit('chat:send', { roomCode, message: trimmed }, (res) => {
        setIsSending(false);
        if (res.ok) setInput('');
      });
    } catch {
      setIsSending(false);
    }
  }, [input, isSending, roomCode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl bg-slate-800">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-500">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-1.5">
            <span
              className={`font-medium ${msg.senderId === user?.id ? 'text-indigo-400' : 'text-slate-300'}`}
            >
              {msg.senderId === user?.id ? 'You' : msg.displayName}
            </span>
            <span className="ml-1 text-slate-400">{msg.message}</span>
            <span className="ml-2 text-xs text-slate-600">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-slate-700 p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          maxLength={500}
          aria-label="Chat message"
          className="flex-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
};
