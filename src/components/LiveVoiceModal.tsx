import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Sparkles,
  Square,
  MessageSquare,
  Radio,
} from 'lucide-react';
import { VoiceName, WorkspaceMode } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  voice: VoiceName;
  workspaceMode: WorkspaceMode;
  onMessageLogged?: (userText: string, modelText: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  voice,
  workspaceMode,
  onMessageLogged,
}) => {
  const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking' | 'idle'>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastModelResponse, setLastModelResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(1);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isComponentMounted = useRef(true);
  const currentAudioLevelInterval = useRef<any>(null);

  // Initialize Web Speech API for real-time live input
  useEffect(() => {
    isComponentMounted.current = true;
    if (!isOpen) {
      cleanup();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz contínuo. Use o Chrome ou Edge.');
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let speechTimeout: any = null;

    recognition.onstart = () => {
      if (isComponentMounted.current) {
        setStatus('listening');
      }
    };

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }

      setLiveTranscript(currentText);

      // If user speaks while model is speaking, interrupt the model immediately!
      if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
        setStatus('listening');
      }

      // Detect end of speech pause (1.2s silence after speech)
      clearTimeout(speechTimeout);
      speechTimeout = setTimeout(() => {
        if (currentText.trim().length > 1) {
          handleProcessVoiceTurn(currentText.trim());
        }
      }, 1200);
    };

    recognition.onerror = (err: any) => {
      console.warn('Erro de voz ao vivo:', err.error);
      if (err.error !== 'no-speech' && isComponentMounted.current) {
        setStatus('listening');
      }
    };

    recognition.onend = () => {
      // Re-start if still in voice modal and not muted
      if (isComponentMounted.current && !isMuted) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Falha ao iniciar microfone:', e);
    }

    // Dynamic pulsating audio orb simulation
    currentAudioLevelInterval.current = setInterval(() => {
      setAudioLevel((prev) => {
        if (status === 'speaking') {
          return 1 + Math.random() * 0.55;
        } else if (status === 'listening' && liveTranscript) {
          return 1 + Math.random() * 0.35;
        }
        return 1 + Math.random() * 0.08;
      });
    }, 120);

    return () => {
      isComponentMounted.current = false;
      cleanup();
    };
  }, [isOpen, isMuted]);

  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (currentAudioLevelInterval.current) {
      clearInterval(currentAudioLevelInterval.current);
    }
  };

  // Process a turn spoken by the user
  const handleProcessVoiceTurn = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setStatus('thinking');
    setLiveTranscript('');

    try {
      // System tone based on workspace mode
      const toneInstruction =
        workspaceMode === 'business'
          ? 'Você está em modo Empresarial/Profissional. Responda de forma ágil, executiva, direta, objetiva e concisa (máximo 2 a 3 frases faladas).'
          : 'Você está em modo Pessoal. Responda de forma natural, calorosa, amigável e conversacional, como um amigo batendo papo (máximo 2 a 3 frases faladas).';

      // 1. Get concise conversational text from model
      const chatRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: spokenText }],
          systemInstruction: `Você é o Voxxl em uma chamada de voz ao vivo. Responda em Português com linguagem falada natural. Use entonação humana. Não use markdown, asteriscos ou formatações visuais, pois sua resposta será sintetizada em áudio para o usuário ouvir na ligação. ${toneInstruction}`,
          thinkingMode: 'fast',
        }),
      });

      if (!chatRes.ok) throw new Error('Falha na resposta do Voxxl');

      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) accumulatedText += parsed.text;
              } catch {
                // ignore
              }
            }
          }
        }
      }

      const finalText = accumulatedText.trim();
      setLastModelResponse(finalText);

      if (onMessageLogged) {
        onMessageLogged(spokenText, finalText);
      }

      // 2. Synthesize expressive voice audio
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: finalText,
          voice,
        }),
      });

      const ttsData = await ttsRes.json();

      if (ttsData.audio) {
        setStatus('speaking');
        const audio = new Audio(ttsData.audio);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setStatus('listening');
          audioPlayerRef.current = null;
        };

        audio.onerror = () => {
          setStatus('listening');
          audioPlayerRef.current = null;
        };

        await audio.play();
      } else {
        setStatus('listening');
      }
    } catch (e) {
      console.error('Erro na resposta de voz:', e);
      setStatus('listening');
    }
  };

  const handleInterrupt = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setStatus('listening');
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      try {
        recognitionRef.current?.start();
      } catch {
        // ignore
      }
    } else {
      setIsMuted(true);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-white font-medium">Conversa Ao Vivo</span>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {workspaceMode === 'business' ? 'Empresarial' : 'Pessoal'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
          title="Fechar"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Center Interactive Glowing Audio Orb */}
      <div className="flex flex-col items-center justify-center my-auto space-y-8 w-full max-w-sm text-center">
        {/* Animated Fluid Orb */}
        <div
          onClick={status === 'speaking' ? handleInterrupt : undefined}
          className="relative flex items-center justify-center cursor-pointer transition-transform duration-150"
          style={{ transform: `scale(${audioLevel})` }}
          title={status === 'speaking' ? 'Clique para interromper' : undefined}
        >
          {/* Ambient Outer Halo */}
          <div
            className={`absolute w-56 h-56 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-amber-500 to-rose-600 animate-pulse'
                : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
            }`}
          />

          {/* Core Living Orb */}
          <div
            className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full shadow-2xl flex items-center justify-center border transition-all duration-300 ${
              status === 'speaking'
                ? 'bg-gradient-to-b from-indigo-500/80 to-purple-700/80 border-indigo-400/50 shadow-indigo-500/30'
                : status === 'thinking'
                ? 'bg-gradient-to-b from-amber-600/80 to-rose-700/80 border-amber-400/50 shadow-amber-500/30 animate-pulse'
                : 'bg-gradient-to-b from-neutral-900 to-neutral-800 border-neutral-700 shadow-neutral-900'
            }`}
          >
            {/* Visualizer bars inside orb */}
            <div className="flex items-center gap-1.5 h-12">
              <span
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  status === 'speaking'
                    ? 'h-10 bg-white animate-bounce'
                    : status === 'listening'
                    ? 'h-4 bg-indigo-400'
                    : 'h-6 bg-amber-400 animate-pulse'
                }`}
              />
              <span
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  status === 'speaking'
                    ? 'h-14 bg-white animate-bounce [animation-delay:-0.2s]'
                    : status === 'listening'
                    ? 'h-7 bg-indigo-400'
                    : 'h-8 bg-amber-400 animate-pulse [animation-delay:-0.2s]'
                }`}
              />
              <span
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  status === 'speaking'
                    ? 'h-8 bg-white animate-bounce [animation-delay:-0.4s]'
                    : status === 'listening'
                    ? 'h-3 bg-indigo-400'
                    : 'h-5 bg-amber-400 animate-pulse [animation-delay:-0.4s]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Status Text & Live Transcript */}
        <div className="space-y-2 min-h-[80px]">
          <h3 className="text-base font-semibold text-white tracking-wide">
            {status === 'speaking'
              ? 'Voxxl falando...'
              : status === 'thinking'
              ? 'Pensando na resposta...'
              : isMuted
              ? 'Microfone mutado'
              : 'Pode falar, estou ouvindo você...'}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed px-4">
            {status === 'speaking'
              ? `"${lastModelResponse}"`
              : liveTranscript
              ? `Você: "${liveTranscript}"`
              : 'Fale livremente como em uma ligação telefônica normal.'}
          </p>

          {status === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="text-[11px] text-indigo-400 hover:text-white underline pt-1"
            >
              Clique para interromper a fala
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-sm flex items-center justify-center gap-6 pb-4">
        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
            isMuted
              ? 'bg-rose-600 text-white'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-850'
          }`}
          title={isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-xl shadow-rose-600/30 active:scale-95"
          title="Encerrar conversa ao vivo"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        {/* Interrupt / Speaker button */}
        <button
          onClick={handleInterrupt}
          disabled={status !== 'speaking'}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${
            status === 'speaking'
              ? 'bg-neutral-900 border-indigo-500/50 text-indigo-400 hover:text-white'
              : 'bg-neutral-900/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
          }`}
          title="Pausar áudio"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
