import React, { useState } from 'react';
import { Bug, X, CheckCircle2, Send, AlertTriangle } from 'lucide-react';
import { BugReport } from '../types';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [category, setCategory] = useState<'ui' | 'voice' | 'response' | 'speed' | 'other'>('ui');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Store in localStorage for debugging
      const savedReports = JSON.parse(localStorage.getItem('voxxl_bug_reports') || '[]');
      const newReport: BugReport = {
        id: 'bug_' + Date.now(),
        category,
        description: description.trim(),
        createdAt: Date.now(),
        userEmail,
      };
      localStorage.setItem('voxxl_bug_reports', JSON.stringify([newReport, ...savedReports]));

      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 1800);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Relatar um Problema</h3>
            <p className="text-xs text-neutral-400">
              Descreva o que aconteceu para corrigirmos no Voxxl
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-neutral-950 border border-emerald-500/40 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Relato Enviado com Sucesso!</h4>
            <p className="text-xs text-neutral-400">
              Obrigado pela sua contribuição para aprimorar o Voxxl.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Categoria do Problema
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ui', label: 'Visual / Botões' },
                  { id: 'voice', label: 'Microfone ou Voz' },
                  { id: 'response', label: 'Resposta da IA' },
                  { id: 'speed', label: 'Lentidão' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`p-2 rounded-xl border text-xs text-left transition-colors ${
                      category === cat.id
                        ? 'bg-rose-600/20 border-rose-500 text-white font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                O que aconteceu?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o que você tentou fazer e o que deu errado..."
                rows={4}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Relato'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
