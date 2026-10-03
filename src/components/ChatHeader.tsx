import React from 'react';
import { Menu, MessageSquarePlus, Sparkles, ChevronDown, Radio } from 'lucide-react';
import { Conversation, WorkspaceMode } from '../types';

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  onToggleSidebar: () => void;
  onNewConversation: () => void;
  onOpenSettings?: () => void;
  onOpenLiveVoice?: () => void;
  workspaceMode?: WorkspaceMode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  onNewConversation,
  onOpenSettings,
  onOpenLiveVoice,
  workspaceMode = 'personal',
}) => {
  return (
    <header className="h-14 px-3 sm:px-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
      {/* Left: Menu button */}
      <button
        onClick={onToggleSidebar}
        className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shadow-xs active:scale-95"
        title="Abrir menu lateral"
        aria-label="Menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Center: Model pill with current mode (Pessoal / Empresa) */}
      <button
        onClick={onOpenSettings}
        className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-colors shadow-xs"
        title="Configurações e modo do Voxxl"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-semibold text-white">Voxxl 3.5</span>
        <span className="text-[10px] text-neutral-400 border-l border-neutral-700 pl-2">
          {workspaceMode === 'business' ? 'Empresa' : 'Pessoal'}
        </span>
        <ChevronDown className="w-3 h-3 text-neutral-400" />
      </button>

      {/* Right: Live Voice Call + New Chat */}
      <div className="flex items-center gap-1.5">
        {onOpenLiveVoice && (
          <button
            onClick={onOpenLiveVoice}
            className="w-9 h-9 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors shadow-xs active:scale-95"
            title="Iniciar Conversa Ao Vivo"
            aria-label="Voz Ao Vivo"
          >
            <Radio className="w-4 h-4 animate-pulse" />
          </button>
        )}

        <button
          onClick={onNewConversation}
          className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shadow-xs active:scale-95"
          title="Nova conversa"
          aria-label="Nova conversa"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
