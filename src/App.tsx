import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  AppSettings,
  GroundingSource,
  ImageGenState,
  Project,
  Reminder,
  UserProfile,
} from './types';
import { PERSONAS } from './constants/personas';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { RemindersManagerModal } from './components/RemindersManagerModal';
import { AuthModal } from './components/AuthModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { BugReportModal } from './components/BugReportModal';
import { Bell, Check, X } from 'lucide-react';

const CONVERSATIONS_STORAGE_KEY = 'voxxl_conversations_v6';
const SETTINGS_STORAGE_KEY = 'voxxl_settings_v6';
const PROJECTS_STORAGE_KEY = 'voxxl_projects_v6';
const REMINDERS_STORAGE_KEY = 'voxxl_reminders_v6';
const USER_PROFILE_STORAGE_KEY = 'voxxl_user_profile_v6';

const DEFAULT_SETTINGS: AppSettings = {
  workspaceMode: 'personal',
  voice: 'Kore',
  autoPlayVoice: false,
  speechSpeed: 1.0,
  themeColor: 'indigo',
  timeFormat: '24h',
  detailLevel: 'balanced',
  customMemories: [
    'Respostas sempre ágeis, bem estruturadas e com formatação Markdown impecável.',
  ],
  autoMemories: [],
  autoMemoryEnabled: true,
  webSearchEnabled: true,
  notificationsEnabled: true,
};

export default function App() {
  // User profile: starts as null (Guest) unless logged in!
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved =
        localStorage.getItem(CONVERSATIONS_STORAGE_KEY) ||
        localStorage.getItem('voxxl_conversations_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar conversas do localStorage:', e);
    }
    const initialId = 'conv_' + Date.now();
    return [
      {
        id: initialId,
        title: 'Nova Conversa',
        messages: [],
        personaId: 'general',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved =
        localStorage.getItem(SETTINGS_STORAGE_KEY) ||
        localStorage.getItem('voxxl_settings_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Erro ao carregar configurações do localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar projetos:', e);
    }
    return [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar lembretes:', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    return conversations[0]?.id || '';
  });

  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestedInput, setSuggestedInput] = useState<string>('');
  const [thinkingMode, setThinkingMode] = useState<'fast' | 'deep'>('fast');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  // Active reminder alert banner
  const [activeReminderAlert, setActiveReminderAlert] = useState<Reminder | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const autoPlayAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
      } else {
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Erro ao salvar conversas:', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Erro ao salvar projetos:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (e) {
      console.error('Erro ao salvar lembretes:', e);
    }
  }, [reminders]);

  // Real-time Reminder Alarm checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const due = reminders.find(
        (r) =>
          !r.completed &&
          new Date(r.datetime).getTime() <= now &&
          new Date(r.datetime).getTime() > now - 2 * 60 * 1000
      );
      if (due && activeReminderAlert?.id !== due.id) {
        setActiveReminderAlert(due);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [reminders, activeReminderAlert]);

  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleLogout = () => {
    setUserProfile(null);
  };

  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const activePersonaId = activeConversation?.personaId || 'general';

  const handleSelectPersona = (personaId: string) => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, personaId, updatedAt: Date.now() } : c
      )
    );
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'Nova Conversa',
      messages: [],
      personaId: activePersonaId,
      projectId: activeProjectId,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh: Conversation = {
          id: 'conv_' + Date.now(),
          title: 'Nova Conversa',
          messages: [],
          personaId: 'general',
          projectId: activeProjectId,
          pinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Projects Handlers
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProj: Project = {
      ...projectData,
      id: 'proj_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(undefined);
    }
  };

  // Reminders Handlers
  const handleAddReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newRem: Reminder = {
      ...reminderData,
      id: 'rem_' + Date.now(),
      createdAt: Date.now(),
    };
    setReminders((prev) => [newRem, ...prev]);
  };

  const handleToggleCompleteReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
    if (activeReminderAlert?.id === id) {
      setActiveReminderAlert(null);
    }
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (activeReminderAlert?.id === id) {
      setActiveReminderAlert(null);
    }
  };

  // Dedicated Image Generation Handler with Flux Engine
  const handleGenerateImage = async (
    rawPrompt: string,
    userMessage: Message,
    modelMessageId: string
  ) => {
    const cleanPrompt = rawPrompt
      .replace(
        /^(\/imagem|crie uma imagem de|gere uma imagem de|desenhe|cria uma imagem de|gerar imagem de|foto de|imagem de)/i,
        ''
      )
      .trim() || rawPrompt;

    const initialImageGen: ImageGenState = {
      id: 'img_' + Date.now(),
      prompt: cleanPrompt,
      status: 'generating',
      progress: 5,
      stepDescription: 'Iniciando o Voxxl Flux Engine...',
    };

    const modelPlaceholder: Message = {
      id: modelMessageId,
      role: 'model',
      content: '🎨 Gerando imagem em Ultra HD (Flux 1024px)...',
      timestamp: Date.now(),
      imageGen: initialImageGen,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, userMessage, modelPlaceholder],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 92) {
        currentProgress = 92;
        clearInterval(progressInterval);
      }

      let stepDesc = 'Interpretando o conceito e iluminação...';
      if (currentProgress > 25 && currentProgress <= 60) {
        stepDesc = 'Sintetizando detalhes e texturas em alta resolução...';
      } else if (currentProgress > 60 && currentProgress <= 85) {
        stepDesc = 'Renderizando resolução máxima em 1024px com Flux...';
      } else if (currentProgress > 85) {
        stepDesc = 'Aplicando polimento final e acabamento de estúdio...';
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === modelMessageId && m.imageGen
                ? {
                    ...m,
                    imageGen: {
                      ...m.imageGen,
                      progress: currentProgress,
                      stepDescription: stepDesc,
                    },
                  }
                : m
            ),
          };
        })
      );
    }, 250);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Falha ao processar imagem no servidor.');
      }

      const data = await response.json();

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === modelMessageId && m.imageGen
                ? {
                    ...m,
                    content: `Aqui está a sua imagem gerada em Ultra HD pelo Voxxl para o pedido: **"${cleanPrompt}"**`,
                    imageGen: {
                      ...m.imageGen,
                      status: 'completed',
                      progress: 100,
                      stepDescription: 'Imagem concluída!',
                      imageUrl: data.imageUrl,
                    },
                  }
                : m
            ),
          };
        })
      );
    } catch (err: any) {
      clearInterval(progressInterval);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === modelMessageId && m.imageGen
                ? {
                    ...m,
                    content: 'Houve um erro ao gerar sua imagem.',
                    imageGen: {
                      ...m.imageGen,
                      status: 'error',
                      progress: 0,
                      stepDescription: 'Erro na renderização',
                      error: err.message || 'Erro inesperado.',
                    },
                  }
                : m
            ),
          };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Send message flow (Chat, Search, Vision, Image Generation)
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = []
  ) => {
    if (!activeConversation || isStreaming) return;

    const userMessage: Message = {
      id: 'msg_' + Date.now() + '_user',
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now(),
    };

    const modelMessageId = 'msg_' + Date.now() + '_model';

    // Check if user is requesting image generation
    const isImageRequest =
      /^(\/imagem|crie uma imagem|gere uma imagem|faça uma imagem|desenhe|cria uma imagem|gerar imagem|foto de|imagem de)/i.test(
        text.trim()
      );

    if (isImageRequest && attachments.length === 0) {
      handleGenerateImage(text, userMessage, modelMessageId);
      return;
    }

    const modelPlaceholder: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const currentPersona =
      PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

    const currentProject = projects.find((p) => p.id === activeProjectId);

    const updatedMessages = [...activeConversation.messages, userMessage];

    // Optimistically update conversation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...updatedMessages, modelPlaceholder],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const allMemories = [
        ...settings.customMemories,
        ...settings.autoMemories,
      ];

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments?.map((a) => ({
              mimeType: a.mimeType,
              data: a.data,
            })),
          })),
          systemInstruction: currentPersona.systemInstruction,
          thinkingMode,
          customMemories: allMemories,
          webSearchEnabled: settings.webSearchEnabled,
          workspaceMode: settings.workspaceMode,
          projectContext: currentProject
            ? {
                name: currentProject.name,
                description: currentProject.description,
                systemInstruction: currentProject.systemInstruction,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erro de conexão com o servidor (${response.status})`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Falha ao inicializar o leitor de stream.');

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let detectedSources: GroundingSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (rawData === '[DONE]') continue;

            try {
              const parsed = JSON.parse(rawData);
              if (parsed.error) throw new Error(parsed.error);

              // Auto-memory detection
              if (parsed.autoMemory && settings.autoMemoryEnabled) {
                const learned = parsed.autoMemory;
                if (!settings.autoMemories.includes(learned)) {
                  setSettings((prev) => ({
                    ...prev,
                    autoMemories: [...prev.autoMemories, learned],
                  }));
                }
              }

              // In-app Reminder creation detected
              if (parsed.reminderSuggestion) {
                const rem = parsed.reminderSuggestion;
                const d = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
                handleAddReminder({
                  title: rem.title,
                  datetime: d,
                  recurrence: 'none',
                  completed: false,
                });
              }

              // Grounding web sources
              if (Array.isArray(parsed.groundingSources)) {
                detectedSources = parsed.groundingSources;
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== activeId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === modelMessageId
                          ? { ...m, groundingSources: detectedSources }
                          : m
                      ),
                    };
                  })
                );
              }

              if (parsed.text) {
                accumulatedContent += parsed.text;
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== activeId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === modelMessageId
                          ? { ...m, content: accumulatedContent }
                          : m
                      ),
                    };
                  })
                );
              }
            } catch (err: any) {
              if (err.message && err.message !== 'Unexpected end of JSON input') {
                console.warn('Erro ao decodificar chunk:', err);
              }
            }
          }
        }
      }

      // Mark streaming completed
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    content: accumulatedContent,
                    groundingSources:
                      detectedSources.length > 0 ? detectedSources : undefined,
                  }
                : m
            ),
          };
        })
      );

      // Auto generate title on first exchange
      if (
        activeConversation.messages.length === 0 &&
        activeConversation.title === 'Nova Conversa'
      ) {
        try {
          const titleRes = await fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text }),
          });
          const titleData = await titleRes.json();
          if (titleData.title) {
            handleRenameConversation(activeId, titleData.title);
          }
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream interrompida.');
      } else {
        console.error('Erro no chat stream:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === modelMessageId
                  ? {
                      ...m,
                      isStreaming: false,
                      error:
                        err.message ||
                        'Não foi possível obter resposta no momento. Tente novamente.',
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Helper to log live voice conversation turns into active chat
  const handleLiveVoiceTurnLogged = (userText: string, modelText: string) => {
    const userMsg: Message = {
      id: 'voice_' + Date.now() + '_user',
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    const modelMsg: Message = {
      id: 'voice_' + Date.now() + '_model',
      role: 'model',
      content: modelText,
      timestamp: Date.now() + 10,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, userMsg, modelMsg],
              updatedAt: Date.now(),
            }
          : c
      )
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 antialiased font-sans">
      {/* Real-time In-App Reminder Due Alert Banner */}
      {activeReminderAlert && (
        <div className="fixed top-4 right-4 z-50 p-4 max-w-sm rounded-2xl bg-neutral-900 border border-amber-500/60 shadow-2xl flex items-start gap-3 animate-in slide-in-from-top">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Lembrete do Voxxl
            </h4>
            <p className="text-xs text-neutral-200 font-medium truncate mt-0.5">
              {activeReminderAlert.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleToggleCompleteReminder(activeReminderAlert.id)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Concluir
              </button>
              <button
                onClick={() => setActiveReminderAlert(null)}
                className="px-2 py-1 rounded-lg text-neutral-400 hover:text-white text-[11px]"
              >
                Dispensar
              </button>
            </div>
          </div>
          <button
            onClick={() => setActiveReminderAlert(null)}
            className="text-neutral-500 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar with distinct Voxxl styling */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        projects={projects}
        activeProjectId={activeProjectId}
        onOpenProjects={() => setIsProjectsOpen(true)}
        reminders={reminders}
        onOpenReminders={() => setIsRemindersOpen(true)}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        workspaceMode={settings.workspaceMode}
      />

      {/* Main chat viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-neutral-950">
        <ChatHeader
          activeConversation={activeConversation}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNewConversation={handleNewConversation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          workspaceMode={settings.workspaceMode}
        />

        <ChatMessages
          messages={activeConversation?.messages || []}
          isStreaming={isStreaming}
          activePersonaId={activePersonaId}
          onSelectPrompt={(prompt) => setSuggestedInput(prompt)}
          onRegenerate={() => {}}
          voice={settings.voice}
          timeFormat={settings.timeFormat}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          suggestedInput={suggestedInput}
          onClearSuggestedInput={() => setSuggestedInput('')}
          autoSendOnVoice={settings.autoPlayVoice}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        />
      </main>

      {/* Settings Modal (Functional: Workspace, Personalização, Memória, Voz, Bug Report, Conta) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        userProfile={userProfile}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
        onOpenBugReport={() => {
          setIsSettingsOpen(false);
          setIsBugReportOpen(true);
        }}
        onOpenLiveVoice={() => {
          setIsSettingsOpen(false);
          setIsLiveVoiceOpen(true);
        }}
      />

      {/* Projects Manager Modal */}
      <ProjectsManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setIsProjectsOpen(false);
        }}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Reminders Manager Modal */}
      <RemindersManagerModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onToggleComplete={handleToggleCompleteReminder}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* Auth Modal (Google & Email Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Live Voice Modal (Conversa Ao Vivo Humana) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        voice={settings.voice}
        workspaceMode={settings.workspaceMode}
        onMessageLogged={handleLiveVoiceTurnLogged}
      />

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
        userEmail={userProfile?.email}
      />
    </div>
  );
}
