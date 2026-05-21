import { type FC, useEffect, useRef, useCallback, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import { Avatar } from "@/components/ui/Avatar";

interface ChatPanelProps {
  roomCode: string;
}

export const ChatPanel: FC<ChatPanelProps> = ({ roomCode }) => {
  const { messages } = useChatStore();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((): void => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const socket = getSocket();
      socket.emit("chat:send", { roomCode, message: trimmed }, (res) => {
        setIsSending(false);
        if (res.ok) setInput("");
      });
    } catch {
      setIsSending(false);
    }
  }, [input, isSending, roomCode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-500 mt-4">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className="flex items-start gap-2">
              <Avatar src={null} displayName={msg.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xs font-semibold ${isMe ? "text-primary" : "text-slate-300"}`}
                  >
                    {isMe ? "You" : msg.displayName}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-slate-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 break-words leading-snug">
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          maxLength={500}
          aria-label="Chat message"
          className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary/60 border border-border"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  );
};
