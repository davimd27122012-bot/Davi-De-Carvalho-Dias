import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Plus,
  Mic,
  MicOff,
  X,
  FileText,
  FileCode,
  File,
  Video,
  Music,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import { Attachment } from '../types';
import { AttachmentPickerModal } from './AttachmentPickerModal';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  suggestedInput?: string;
  onClearSuggestedInput?: () => void;
  autoSendOnVoice?: boolean;
  onOpenLiveVoice?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  suggestedInput,
  onClearSuggestedInput,
  onOpenLiveVoice,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync external suggested input if provided
  useEffect(() => {
    if (suggestedInput) {
      setText(suggestedInput);
      if (onClearSuggestedInput) onClearSuggestedInput();
      textareaRef.current?.focus();
    }
  }, [suggestedInput, onClearSuggestedInput]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Permissão do microfone negada no navegador.');
        } else if (event.error !== 'no-speech') {
          setVoiceError('Erro no microfone. Tente novamente.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'O seu navegador não possui suporte nativo à API de reconhecimento de voz. Recomendamos usar o Google Chrome, Edge ou Safari.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error('Falha ao iniciar microfone:', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const classifyFileType = (
    mimeType: string,
    fileName: string
  ): 'image' | 'video' | 'pdf' | 'audio' | 'document' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf'))
      return 'pdf';
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('document') ||
      mimeType.includes('sheet') ||
      mimeType.includes('json') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.md')
    ) {
      return 'document';
    }
    return 'other';
  };

  const handleProcessFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // 25MB limit per file
      if (file.size > 25 * 1024 * 1024) {
        alert(
          `O arquivo "${file.name}" ultrapassa o limite de 25MB permitido para envio.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        const fileType = classifyFileType(file.type, file.name);

        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: base64Data,
          previewUrl:
            fileType === 'image' || fileType === 'video' ? result : undefined,
          size: file.size,
          type: fileType,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileIcon = (type?: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-pink-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'document':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      default:
        return <File className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="shrink-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick helper pills */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-neutral-400">
          <span className="text-[11px] text-neutral-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Ferramentas:
          </span>
          <button
            type="button"
            onClick={() => {
              setText('Crie uma imagem de ');
              textareaRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors shrink-0 text-[11px] flex items-center gap-1 font-medium"
          >
            <ImageIcon className="w-3 h-3" />
            Criar Imagem
          </button>
          <button
            type="button"
            onClick={() => {
              setText('Pesquise na web: ');
              textareaRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors shrink-0 text-[11px] flex items-center gap-1"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            Pesquisar na Web
          </button>
          <button
            type="button"
            onClick={() =>
              setText((prev) =>
                prev
                  ? `${prev} Me explique em tópicos objetivos.`
                  : 'Me explique em tópicos objetivos e práticos.'
              )
            }
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors shrink-0 text-[11px]"
          >
            Formatar em tópicos
          </button>
          <button
            type="button"
            onClick={() =>
              setText((prev) =>
                prev
                  ? `${prev} Mostre um exemplo prático de código.`
                  : 'Mostre um exemplo completo de código limpo com comentários.'
              )
            }
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors shrink-0 text-[11px]"
          >
            Exemplo em código
          </button>
        </div>

        {/* Voice error toast if any */}
        {voiceError && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{voiceError}</span>
            <button
              onClick={() => setVoiceError(null)}
              className="text-rose-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Container */}
        <div
          className={`relative rounded-2xl bg-neutral-900 border shadow-lg transition-all ${
            isListening
              ? 'border-rose-500/80 ring-2 ring-rose-500/20 bg-neutral-900/95'
              : 'border-neutral-700/80 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20'
          }`}
        >
          {/* File Attachments Preview (Accepts ALL file types) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0 max-h-36 overflow-y-auto">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 shadow-xs"
                >
                  {att.type === 'image' && att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : att.type === 'video' ? (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Video className="w-4 h-4 text-purple-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-neutral-700/60 flex items-center justify-center">
                      {renderFileIcon(att.type)}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[160px]">
                    <span className="truncate text-xs font-medium text-white">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatFileSize(att.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-700 transition-colors ml-1"
                    title="Remover anexo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Voice Recording Bar when listening */}
          {isListening && (
            <div className="px-3 pt-2.5 flex items-center justify-between text-xs text-rose-400 border-b border-rose-500/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="font-semibold text-rose-300">
                  Ouvindo sua voz... Fale normalmente!
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" />
                <button
                  onClick={toggleListening}
                  className="ml-2 text-[11px] underline text-rose-300 hover:text-white"
                >
                  Concluir fala
                </button>
              </div>
            </div>
          )}

          {/* Text input area */}
          <div className="flex items-end gap-1.5 sm:gap-2 p-3">
            {/* The "+" Button: Opens the Attachment Menu Sheet */}
            <button
              type="button"
              onClick={() => setShowPickerModal(true)}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
              title="Anexar arquivos, fotos, vídeos, documentos ou criar imagem"
              aria-label="Abrir menu de anexos"
            >
              <Plus className="w-5 h-5 text-indigo-400" />
            </button>

            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                  : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800'
              }`}
              title={
                isListening
                  ? 'Clique para pausar microfone'
                  : 'Falar no microfone (Transforma voz em texto)'
              }
              aria-label="Microfone de voz"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Live Voice Call Button */}
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={onOpenLiveVoice}
                className="p-2 rounded-xl text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors shrink-0"
                title="Conversa ao vivo por voz"
                aria-label="Conversa ao vivo"
              >
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                </div>
              </button>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Ouvindo sua fala em tempo real...'
                  : 'Pergunte ao Voxxl, use o microfone ou toque no + para anexar...'
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none resize-none max-h-48 py-1.5 leading-relaxed"
            />

            {/* Send or Stop button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0 transition-colors shadow-sm"
                title="Interromper geração"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white shrink-0 transition-all shadow-sm active:scale-95"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span>Voxxl · Assistente de Inteligência Artificial</span>
          <span className="hidden sm:inline">Pressione Enter ↵ para enviar</span>
        </div>
      </div>

      {/* Attachment Picker Modal (The requested sheet on "+" click) */}
      <AttachmentPickerModal
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onSelectFiles={handleProcessFiles}
        onOpenImageGen={() => {
          setText('Crie uma imagem de ');
          textareaRef.current?.focus();
        }}
      />
    </div>
  );
};
