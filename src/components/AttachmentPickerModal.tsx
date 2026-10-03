import React, { useRef } from 'react';
import {
  X,
  Image,
  Video,
  FileText,
  Music,
  FolderOpen,
  Sparkles,
  Camera,
} from 'lucide-react';

interface AttachmentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: FileList) => void;
  onOpenImageGen: () => void;
}

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFiles,
  onOpenImageGen,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const allFilesInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFiles(e.target.files);
      onClose();
    }
  };

  const options = [
    {
      id: 'gallery',
      title: 'Galeria & Fotos',
      desc: 'PNG, JPG, WEBP, GIF do seu aparelho',
      icon: <Image className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-600/10 border-indigo-500/30 hover:border-indigo-400',
      action: () => imageInputRef.current?.click(),
    },
    {
      id: 'camera',
      title: 'Câmera / Foto Instantânea',
      desc: 'Tirar uma foto diretamente',
      icon: <Camera className="w-5 h-5 text-sky-400" />,
      bg: 'bg-sky-600/10 border-sky-500/30 hover:border-sky-400',
      action: () => cameraInputRef.current?.click(),
    },
    {
      id: 'videos',
      title: 'Vídeos',
      desc: 'MP4, MOV, WEBM para análise',
      icon: <Video className="w-5 h-5 text-purple-400" />,
      bg: 'bg-purple-600/10 border-purple-500/30 hover:border-purple-400',
      action: () => videoInputRef.current?.click(),
    },
    {
      id: 'docs',
      title: 'Documentos & PDFs',
      desc: 'PDF, DOCX, XLSX, TXT, CSV, planilhas',
      icon: <FileText className="w-5 h-5 text-rose-400" />,
      bg: 'bg-rose-600/10 border-rose-500/30 hover:border-rose-400',
      action: () => docInputRef.current?.click(),
    },
    {
      id: 'audio',
      title: 'Áudios & Sons',
      desc: 'MP3, WAV, M4A, OGG e gravações',
      icon: <Music className="w-5 h-5 text-pink-400" />,
      bg: 'bg-pink-600/10 border-pink-500/30 hover:border-pink-400',
      action: () => audioInputRef.current?.click(),
    },
    {
      id: 'all',
      title: 'Todos os Arquivos',
      desc: 'Navegar por todos os arquivos do telefone',
      icon: <FolderOpen className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-600/10 border-amber-500/30 hover:border-amber-400',
      action: () => allFilesInputRef.current?.click(),
    },
    {
      id: 'ai-image',
      title: 'Criar Imagem com IA',
      desc: 'Gerar imagem em Ultra HD com barra de progresso',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      bg: 'bg-cyan-600/10 border-cyan-500/30 hover:border-cyan-400',
      action: () => {
        onClose();
        onOpenImageGen();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleFileChange}
        accept="video/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.md"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={allFilesInputRef}
        onChange={handleFileChange}
        accept="*/*"
        multiple
        className="hidden"
      />

      {/* Sheet Container */}
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Anexar ao Voxxl</h3>
            <p className="text-xs text-neutral-400">
              Escolha a fonte ou tipo de arquivo para enviar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[65vh] overflow-y-auto pt-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={opt.action}
              className={`p-3 rounded-xl border ${opt.bg} flex items-start gap-3 text-left transition-all group active:scale-[0.98]`}
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0 group-hover:scale-105 transition-transform">
                {opt.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {opt.title}
                </span>
                <span className="text-[11px] text-neutral-400 line-clamp-1">
                  {opt.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
