import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  Pin,
  Image,
  Folder,
  Bell,
  Compass,
  Edit3,
  Radio,
  LogIn,
} from 'lucide-react';
import { Conversation, Project, Reminder, UserProfile, WorkspaceMode } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  projects?: Project[];
  activeProjectId?: string;
  onOpenProjects: () => void;
  reminders?: Reminder[];
  onOpenReminders: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenLiveVoice: () => void;
  workspaceMode: WorkspaceMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isOpen,
  onClose,
  onOpenSettings,
  projects = [],
  onOpenProjects,
  reminders = [],
  onOpenReminders,
  userProfile,
  onOpenAuth,
  onOpenLiveVoice,
  workspaceMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearching(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const pinnedConversations = useMemo(() => {
    return filteredConversations.filter((c) => c.pinned);
  }, [filteredConversations]);

  const unpinnedConversations = useMemo(() => {
    return filteredConversations.filter((c) => !c.pinned);
  }, [filteredConversations]);

  const initials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar with distinct Voxxl styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-neutral-950 border-r border-neutral-900 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">
              Voxxl
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                workspaceMode === 'business'
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {workspaceMode === 'business' ? 'Empresa' : 'Pessoal'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsSearching(!isSearching);
                if (!isSearching) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              className="w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
              title="Pesquisar conversas"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search input when open */}
        {isSearching && (
          <div className="p-3 border-b border-neutral-900 bg-neutral-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar histórico..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="p-3 pb-1 space-y-0.5 border-b border-neutral-900">
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center gap-3 text-xs font-medium transition-colors text-left"
          >
            <Image className="w-4 h-4 text-indigo-400" />
            <span>Imagens & Criatividade</span>
          </button>

          <button
            onClick={onOpenProjects}
            className="w-full px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center justify-between text-xs font-medium transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-purple-400" />
              <span>Projetos</span>
            </div>
            {projects.length > 0 && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {projects.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenReminders}
            className="w-full px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center justify-between text-xs font-medium transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Agendado & Lembretes</span>
            </div>
            {reminders.filter((r) => !r.completed).length > 0 && (
              <span className="text-[10px] text-amber-400 font-mono">
                {reminders.filter((r) => !r.completed).length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenLiveVoice}
            className="w-full px-3 py-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 flex items-center justify-between text-xs font-medium transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Conversa Ao Vivo</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
              Novo
            </span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Section: Fixados */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 px-3 py-1">
                Fixados
              </div>
              {pinnedConversations.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(conv.id, e)}
                        className="flex items-center gap-1 flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full bg-neutral-950 px-2 py-0.5 rounded text-xs text-white border border-indigo-500 focus:outline-none"
                        />
                        <button type="submit" className="p-1 text-emerald-400">
                          <Check className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="truncate flex-1">{conv.title}</span>
                        <div
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onTogglePinConversation(conv.id)}
                            className="p-1 text-amber-400 hover:text-amber-300"
                            title="Desafixar"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 text-neutral-400 hover:text-white"
                            title="Renomear"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteConversation(conv.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Recentes */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-neutral-400 px-3 py-1">
              Recentes
            </div>
            {unpinnedConversations.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-500">
                Nenhuma conversa recente
              </div>
            ) : (
              unpinnedConversations.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(conv.id, e)}
                        className="flex items-center gap-1 flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full bg-neutral-950 px-2 py-0.5 rounded text-xs text-white border border-indigo-500 focus:outline-none"
                        />
                        <button type="submit" className="p-1 text-emerald-400">
                          <Check className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="truncate flex-1">{conv.title}</span>
                        <div
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onTogglePinConversation(conv.id)}
                            className="p-1 text-neutral-500 hover:text-amber-400"
                            title="Fixar conversa"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 text-neutral-400 hover:text-white"
                            title="Renomear"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteConversation(conv.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Bar: Profile or Google Login Button */}
        <div className="p-3 border-t border-neutral-900 bg-neutral-950 shrink-0 space-y-2">
          {userProfile ? (
            <div className="flex items-center justify-between">
              {/* Blue Pill Chat Button */}
              <button
                onClick={() => {
                  onNewConversation();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="py-2 px-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              {/* User Profile Avatar (Clicking opens Settings) */}
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-900 transition-colors"
                title="Configurações e perfil"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {initials}
                </div>
              </button>

              {/* Voice Wave Button */}
              <button
                onClick={onOpenLiveVoice}
                className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center transition-colors"
                title="Abrir Conversa Ao Vivo"
              >
                <Radio className="w-4 h-4 animate-pulse" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {/* Google Icon */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16.7C3.5 20.4 7.4 23.8 12 23.8z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    onNewConversation();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  + Nova Conversa
                </button>
                <button
                  onClick={onOpenLiveVoice}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Radio className="w-3 h-3" />
                  Voz Ao Vivo
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
