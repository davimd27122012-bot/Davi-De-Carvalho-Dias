import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Briefcase,
  Smile,
  BookOpen,
  Volume2,
  Bug,
  Info,
  LogOut,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Play,
  Loader2,
  Radio,
  Globe,
  Sliders,
} from 'lucide-react';
import { AppSettings, UserProfile, VoiceName, WorkspaceMode, DetailLevel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenBugReport: () => void;
  onOpenLiveVoice: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userProfile,
  onLogout,
  onOpenAuth,
  onOpenBugReport,
  onOpenLiveVoice,
}) => {
  const [subScreen, setSubScreen] = useState<'main' | 'memories' | 'voice' | 'about'>('main');
  const [newMemory, setNewMemory] = useState('');
  const [testingVoice, setTestingVoice] = useState<VoiceName | null>(null);

  if (!isOpen) return null;

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    onUpdateSettings({ customMemories: [...settings.customMemories, newMemory.trim()] });
    setNewMemory('');
  };

  const handleRemoveMemory = (index: number) => {
    onUpdateSettings({
      customMemories: settings.customMemories.filter((_, i) => i !== index),
    });
  };

  const handleRemoveAutoMemory = (index: number) => {
    onUpdateSettings({
      autoMemories: settings.autoMemories.filter((_, i) => i !== index),
    });
  };

  const handleTestVoice = async (voiceName: VoiceName) => {
    try {
      setTestingVoice(voiceName);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Olá! Eu sou o Voxxl com a voz ${voiceName}. Como posso te ajudar hoje?`,
          voice: voiceName,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.onended = () => setTestingVoice(null);
        audio.onerror = () => setTestingVoice(null);
        await audio.play();
      } else {
        setTestingVoice(null);
      }
    } catch {
      setTestingVoice(null);
    }
  };

  const voices: { id: VoiceName; label: string; desc: string }[] = [
    { id: 'Kore', label: 'Kore', desc: 'Voz feminina suave, articulada e expressiva (Padrão)' },
    { id: 'Puck', label: 'Puck', desc: 'Voz jovem, descontraída e ágil' },
    { id: 'Charon', label: 'Charon', desc: 'Voz masculina calma e profunda' },
    { id: 'Fenrir', label: 'Fenrir', desc: 'Voz masculina firme e assertiva' },
    { id: 'Zephyr', label: 'Zephyr', desc: 'Voz moderna, equilibrada e acolhedora' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col text-neutral-100 antialiased font-sans animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md shrink-0">
        <button
          onClick={() => {
            if (subScreen !== 'main') setSubScreen('main');
            else onClose();
          }}
          className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-bold text-white tracking-tight">
          {subScreen === 'main'
            ? 'Configurações do Voxxl'
            : subScreen === 'memories'
            ? 'Memória da IA'
            : subScreen === 'voice'
            ? 'Voz & Áudio'
            : 'Sobre o Voxxl'}
        </span>

        <button
          onClick={onClose}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          Concluir
        </button>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-6 pb-20">
        {subScreen === 'main' && (
          <>
            {/* 1. SEÇÃO DE CONTA (Login com Google ou Perfil Conectado) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Sua Conta
              </span>

              {userProfile ? (
                <div className="p-4 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold text-base flex items-center justify-center shrink-0">
                      {userProfile.name ? userProfile.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{userProfile.name}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                          Conectado
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {userProfile.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onLogout();
                      onOpenAuth();
                    }}
                    className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl hover:bg-neutral-800 transition-colors"
                    title="Alternar ou sair da conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-neutral-900 to-indigo-950/40 border border-indigo-500/30 shadow-md space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Você está usando como Convidado
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        Faça login com o Google ou e-mail para salvar seu histórico, projetos e memórias de forma permanente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <span>Entrar com o Google ou E-mail</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. MODO DE USO: PESSOAL VS EMPRESARIAL (Funcionalidade real exigida) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Modo de Uso do Assistente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Modo Pessoal */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ workspaceMode: 'personal' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    settings.workspaceMode === 'personal'
                      ? 'bg-indigo-600/15 border-indigo-500/80 shadow-md'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Modo Pessoal</span>
                    {settings.workspaceMode === 'personal' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Conversas do dia a dia, estilo próximo e amigável ("eu e você"), ideias criativas e estudos.
                  </p>
                </button>

                {/* Modo Empresarial */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ workspaceMode: 'business' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    settings.workspaceMode === 'business'
                      ? 'bg-indigo-600/15 border-indigo-500/80 shadow-md'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Modo Empresarial</span>
                    {settings.workspaceMode === 'business' && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Comunicação corporativa de alto nível, técnica, focada em metas, relatórios e negócios sérios.
                  </p>
                </button>
              </div>
            </div>

            {/* 3. CONVERSA AO VIVO & ÁUDIO */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Voz & Conversa Ao Vivo
              </span>

              <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 divide-y divide-neutral-800/80 overflow-hidden shadow-sm">
                {/* Botão de Abrir Conversa Ao Vivo */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenLiveVoice();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Iniciar Conversa Ao Vivo
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Fale naturalmente como numa chamada de telefone real
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>

                {/* Seletor de Voz */}
                <button
                  onClick={() => setSubScreen('voice')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Voz do Assistente
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Voz atual: {settings.voice}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* 4. PERSONALIZAÇÃO & MEMÓRIA */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Personalização & Memória
              </span>

              <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 divide-y divide-neutral-800/80 overflow-hidden shadow-sm">
                {/* Memórias */}
                <button
                  onClick={() => setSubScreen('memories')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Memórias Salvas ({settings.autoMemories.length + settings.customMemories.length})
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Gerenciar o que o Voxxl lembra sobre suas preferências
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>

                {/* Pesquisa Web em tempo real */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Pesquisa Web em Tempo Real
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Permite consultar notícias e fatos recentes na internet
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.webSearchEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ webSearchEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 5. SUPORTE & SOBRE */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Suporte & Aplicativo
              </span>

              <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 divide-y divide-neutral-800/80 overflow-hidden shadow-sm">
                {/* Relatar Bug (Funcional) */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenBugReport();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Relatar um Bug / Problema
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Avise nossa equipe sobre falhas no aplicativo
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>

                {/* Sobre o Voxxl */}
                <button
                  onClick={() => setSubScreen('about')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Sobre o Voxxl
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Versão 3.5.2 Pro · Inteligência Artificial
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* SUB SCREEN: MEMORIES */}
        {subScreen === 'memories' && (
          <div className="space-y-5 animate-in fade-in">
            <p className="text-xs text-neutral-400 leading-relaxed">
              O Voxxl aprende de forma inteligente detalhes do seu dia a dia e trabalho para não ficar repetindo perguntas. Você tem controle total:
            </p>

            {/* Auto Memories */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">
                Memórias Aprendidas Automaticamente ({settings.autoMemories.length})
              </span>
              {settings.autoMemories.length === 0 ? (
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-500 text-center">
                  Nenhuma memória aprendida ainda. Conforme você conversa, informações relevantes aparecem aqui.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {settings.autoMemories.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs text-neutral-200"
                    >
                      <span className="flex-1 mr-2">{m}</span>
                      <button
                        onClick={() => handleRemoveAutoMemory(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                        title="Esquecer esta memória"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Fixed Memories */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-white block">
                Instruções Manuais Fixas
              </span>
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  placeholder="Ex: 'Sempre responda em TypeScript', 'Prefiro respostas curtas'..."
                  className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {settings.customMemories.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {settings.customMemories.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs text-neutral-200"
                    >
                      <span className="flex-1 mr-2">{m}</span>
                      <button
                        onClick={() => handleRemoveMemory(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB SCREEN: VOICE */}
        {subScreen === 'voice' && (
          <div className="space-y-3 animate-in fade-in">
            <p className="text-xs text-neutral-400">
              Escolha a voz que o Voxxl utiliza no modo de Conversa Ao Vivo e na leitura de respostas:
            </p>
            <div className="space-y-2">
              {voices.map((v) => (
                <div
                  key={v.id}
                  onClick={() => onUpdateSettings({ voice: v.id })}
                  className={`p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all ${
                    settings.voice === v.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      {v.label}
                      {settings.voice === v.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{v.desc}</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(v.id);
                    }}
                    className="p-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {testingVoice === v.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Ouvir</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB SCREEN: ABOUT */}
        {subScreen === 'about' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <h4 className="text-lg font-bold text-white tracking-tight">Voxxl 3.5 Pro</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Assistente de inteligência artificial conversacional moderno, projetado com raciocínio ágil, geração de imagem Flux Ultra HD e conversação por voz ao vivo.
              </p>
              <div className="pt-3 border-t border-neutral-800 text-xs text-neutral-400 space-y-1.5">
                <div>Versão: 3.5.2 Pro</div>
                <div>Modo Ativo: {settings.workspaceMode === 'business' ? 'Empresarial' : 'Pessoal'}</div>
                <div>Autoria & Criação: Davi Dias</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
