import { type FC, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { useChatStore } from "@/store/chatStore";

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const ChatOverlay: FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const { markRead } = useChatStore();

  useEffect(() => {
    if (isOpen) markRead();
  }, [isOpen, markRead]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-surface border-t border-border"
            style={{ height: "65dvh" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-base font-bold text-white">Chat</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatPanel roomCode={roomCode} />
            </div>

            <div className="border-t border-border px-4 py-2 text-center">
              <p className="text-xs text-slate-600">
                Be respectful and enjoy the game!
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
