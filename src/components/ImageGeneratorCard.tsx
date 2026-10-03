import React, { useState } from 'react';
import {
  Download,
  Maximize2,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { ImageGenState } from '../types';

interface ImageGeneratorCardProps {
  imageGen: ImageGenState;
  onRetry?: (prompt: string) => void;
}

export const ImageGeneratorCard: React.FC<ImageGeneratorCardProps> = ({
  imageGen,
  onRetry,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(imageGen.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = async () => {
    if (!imageGen.imageUrl) return;
    try {
      const response = await fetch(imageGen.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voxxl-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageGen.imageUrl, '_blank');
    }
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span>Voxxl Studio · Criação de Imagem</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
          Ultra HD 1024px
        </span>
      </div>

      {/* Generating State with 0% to 100% Progress Bar */}
      {imageGen.status === 'generating' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-neutral-400">
                Criando sua imagem sob medida...
              </span>
              <p className="text-xs text-neutral-200 font-medium italic line-clamp-2 max-w-md">
                "{imageGen.prompt}"
              </p>
            </div>
            {/* Big Percentage Number */}
            <div className="text-right">
              <span className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 font-mono">
                {Math.min(Math.round(imageGen.progress), 100)}%
              </span>
            </div>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="relative w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out shadow-lg shadow-indigo-500/50"
              style={{ width: `${Math.min(Math.max(imageGen.progress, 5), 100)}%` }}
            />
          </div>

          {/* Real-time Status Step Indicator */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              {imageGen.stepDescription || 'Processando renderização em alta qualidade...'}
            </span>
            <span className="text-neutral-500 font-mono">Quase pronto</span>
          </div>
        </div>
      )}

      {/* Completed State */}
      {imageGen.status === 'completed' && imageGen.imageUrl && (
        <div className="p-4 space-y-3">
          <div className="relative group rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 aspect-square max-h-[460px] flex items-center justify-center">
            <img
              src={imageGen.imageUrl}
              alt={imageGen.prompt}
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />

            {/* Quick Action Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white backdrop-blur-md transition-colors"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white line-clamp-2 font-medium drop-shadow-md">
                  {imageGen.prompt}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar em HD
                  </button>
                  <button
                    onClick={handleCopyPrompt}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors"
                  >
                    {copiedPrompt ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar Prompt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="truncate max-w-xs font-mono text-[11px]">
                {imageGen.prompt}
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {imageGen.status === 'error' && (
        <div className="p-5 space-y-3">
          <p className="text-xs text-rose-400 font-medium">
            Não foi possível gerar a imagem no momento. {imageGen.error}
          </p>
          {onRetry && (
            <button
              onClick={() => onRetry(imageGen.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isFullscreen && imageGen.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageGen.imageUrl}
            alt={imageGen.prompt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
