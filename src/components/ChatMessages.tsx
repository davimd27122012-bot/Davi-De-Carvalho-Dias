import React, { useRef, useEffect, useState } from 'react';
import {
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
  AlertTriangle,
  Code,
  PenTool,
  GraduationCap,
  Briefcase,
  FileText,
  CornerDownRight,
  Zap,
  Video,
  Music,
  FileCode,
  File,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Message, Persona, VoiceName, TimeFormat } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PERSONAS } from '../constants/personas';
import { VoxxlLogo } from './VoxxlLogo';
import { ImageGeneratorCard } from './ImageGeneratorCard';

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  activePersonaId: string;
  onSelectPrompt: (promptText: string) => void;
  onRegenerate: (messageIndex: number) => void;
  voice?: VoiceName;
  timeFormat?: TimeFormat;
}

const personaIconMap: Record<string, React.ReactNode> = {
  Sparkles: <Zap className="w-5 h-5 text-indigo-400" />,
  Code: <Code className="w-5 h-5 text-cyan-400" />,
  PenTool: <PenTool className="w-5 h-5 text-amber-400" />,
  GraduationCap: <GraduationCap className="w-5 h-5 text-emerald-400" />,
  Briefcase: <Briefcase className="w-5 h-5 text-rose-400" />,
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isStreaming,
  activePersonaId,
  onSelectPrompt,
  onRegenerate,
  voice = 'Kore',
  timeFormat = '24h',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePersona =
    PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  // Auto-scroll to bottom on new message or streaming update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlayTTS = async (id: string, text: string) => {
    if (playingAudioId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setAudioLoadingId(id);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar voz');
      }

      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingAudioId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setPlayingAudioId(null);
          audioRef.current = null;
        };
        await audio.play();
        setPlayingAudioId(id);
      }
    } catch (err) {
      console.error('Erro no áudio TTS:', err);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h',
    }).format(new Date(ts));
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-end max-w-3xl mx-auto w-full">
        {/* Action Suggestion Pills at Bottom Left (Exact match of Screenshot 6) */}
        <div className="space-y-2 mb-2">
          <button
            onClick={() => onSelectPrompt('Crie uma imagem de ')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-left transition-all max-w-sm group shadow-sm active:scale-98"
          >
            <div className="p-2 rounded-xl bg-neutral-800 text-indigo-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                Crie uma imagem ou figurinha
              </span>
              <span className="text-[11px] text-neutral-400">
                Gere fotos realistas ou ilustrações em alta definição
              </span>
            </div>
          </button>

          <button
            onClick={() => onSelectPrompt('Me ajude a escrever ou editar ')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-left transition-all max-w-sm group shadow-sm active:scale-98"
          >
            <div className="p-2 rounded-xl bg-neutral-800 text-sky-400 group-hover:scale-105 transition-transform">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                Escreva ou edite
              </span>
              <span className="text-[11px] text-neutral-400">
                Textos, roteiros, e-mails ou revisão detalhada
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isCopied = copiedId === message.id;
        const isPlayingAudio = playingAudioId === message.id;
        const isAudioLoading = audioLoadingId === message.id;

        return (
          <div
            key={message.id}
            className={`flex items-start gap-3.5 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            } group`}
          >
            {/* Avatar */}
            {isUser ? (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-neutral-800 text-neutral-300 border border-neutral-700 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-neutral-900 border border-neutral-800 shadow-md">
                <VoxxlLogo size="xs" showText={false} />
              </div>
            )}

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Attachments if present (Universal support: image, video, audio, pdf, doc) */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.attachments.map((att) => {
                    const isImg =
                      att.type === 'image' || att.mimeType.startsWith('image/');
                    const isVid =
                      att.type === 'video' || att.mimeType.startsWith('video/');
                    const isAud =
                      att.type === 'audio' || att.mimeType.startsWith('audio/');
                    const isPdf =
                      att.type === 'pdf' || att.mimeType === 'application/pdf';

                    return (
                      <div
                        key={att.id}
                        className="relative rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 shadow-sm"
                      >
                        {isImg ? (
                          <img
                            src={
                              att.previewUrl ||
                              `data:${att.mimeType};base64,${att.data}`
                            }
                            alt={att.name}
                            className="max-h-56 max-w-xs object-cover rounded-xl"
                          />
                        ) : isVid ? (
                          <video
                            src={
                              att.previewUrl ||
                              `data:${att.mimeType};base64,${att.data}`
                            }
                            controls
                            className="max-h-56 max-w-xs rounded-xl"
                          />
                        ) : isAud ? (
                          <div className="p-2.5 flex items-center gap-2">
                            <Music className="w-4 h-4 text-pink-400" />
                            <audio
                              src={`data:${att.mimeType};base64,${att.data}`}
                              controls
                              className="h-8 max-w-[200px]"
                            />
                          </div>
                        ) : isPdf ? (
                          <div className="p-3 flex items-center gap-2.5 text-xs text-neutral-200">
                            <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate max-w-[140px] font-medium text-white">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                Documento PDF
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 flex items-center gap-2.5 text-xs text-neutral-200">
                            <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate max-w-[140px] font-medium text-white">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                Arquivo
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Text Content */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-neutral-900/95 text-neutral-200 border border-neutral-800 rounded-tl-xs w-full'
                }`}
              >
                {message.error ? (
                  <div className="flex items-start gap-2.5 text-rose-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Erro ao obter resposta:</p>
                      <p className="text-neutral-300 mt-1">{message.error}</p>
                      <button
                        onClick={() => onRegenerate(index)}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                ) : isUser ? (
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                ) : message.isStreaming && !message.content ? (
                  // Instant typing animation before first token arrives
                  <div className="flex items-center gap-3 py-1 text-xs text-neutral-400">
                    <div className="flex items-end gap-1 h-4">
                      <span className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                      <span className="w-1 bg-sky-400 rounded-full animate-bounce h-2.5" />
                    </div>
                    <span className="font-medium text-neutral-300">
                      Voxxl está respondendo...
                    </span>
                  </div>
                ) : (
                  <>
                    <MarkdownRenderer
                      content={message.content}
                      isStreaming={message.isStreaming}
                    />

                    {/* Image Generation Card with 0% to 100% Progress */}
                    {message.imageGen && (
                      <ImageGeneratorCard
                        imageGen={message.imageGen}
                        onRetry={(p) => onSelectPrompt(`Crie uma imagem de ${p}`)}
                      />
                    )}

                    {/* Live Web Grounding Sources */}
                    {message.groundingSources && message.groundingSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                          <span>Fontes consultadas na web ({message.groundingSources.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {message.groundingSources.map((g, idx) => (
                            <a
                              key={idx}
                              href={g.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-xs flex items-center justify-between gap-2 group/src transition-colors"
                            >
                              <span className="truncate text-[11px] text-neutral-300 group-hover/src:text-white font-medium">
                                {g.title || g.url}
                              </span>
                              <ExternalLink className="w-3 h-3 text-neutral-500 group-hover/src:text-sky-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Toolbar & Timestamp */}
              <div
                className={`flex items-center gap-2 mt-1.5 px-1 text-[11px] text-neutral-500 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span>{formatTimestamp(message.timestamp)}</span>

                {!isUser && !message.error && message.content && (
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                      title="Copiar texto"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Text-To-Speech Button */}
                    <button
                      onClick={() => handlePlayTTS(message.id, message.content)}
                      disabled={isAudioLoading}
                      className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                      title={
                        isPlayingAudio
                          ? 'Pausar áudio'
                          : `Ouvir resposta com voz da Voxxl (${voice})`
                      }
                    >
                      {isAudioLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : isPlayingAudio ? (
                        <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Regenerate Button */}
                    <button
                      onClick={() => onRegenerate(index)}
                      disabled={isStreaming}
                      className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-40"
                      title="Regenerar resposta"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};
