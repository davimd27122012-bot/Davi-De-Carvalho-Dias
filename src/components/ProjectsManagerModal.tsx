import React, { useState } from 'react';
import {
  FolderPlus,
  Folder,
  X,
  FileText,
  Trash2,
  Edit2,
  Check,
  Plus,
  Layers,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { Project, Attachment } from '../types';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (projectId?: string) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdateProject(editingId, {
        name: name.trim(),
        description: description.trim(),
        systemInstruction: systemInstruction.trim(),
        updatedAt: Date.now(),
      });
      setEditingId(null);
    } else {
      onCreateProject({
        name: name.trim(),
        description: description.trim(),
        systemInstruction: systemInstruction.trim(),
        files: [],
      });
      setIsCreating(false);
    }

    setName('');
    setDescription('');
    setSystemInstruction('');
  };

  const handleStartEdit = (proj: Project) => {
    setEditingId(proj.id);
    setName(proj.name);
    setDescription(proj.description);
    setSystemInstruction(proj.systemInstruction);
    setIsCreating(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Projetos do Voxxl
              </h2>
              <p className="text-xs text-neutral-400">
                Organize conversas, contexto e arquivos em workspaces dedicados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Create or Edit Form */}
          {isCreating ? (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">
                  {editingId ? 'Editar Projeto' : 'Novo Projeto'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lançamento de Livro, App Mobile, Estudos de Física"
                  required
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Descrição (Objetivo do trabalho)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Roteirização e desenvolvimento dos personagens principais"
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Instruções Específicas do Projeto (Contexto fixo)
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="Instruções para o Voxxl seguir em todas as conversas deste projeto..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">
                Seus Projetos ({projects.length})
              </span>
              <button
                onClick={() => {
                  setName('');
                  setDescription('');
                  setSystemInstruction('');
                  setIsCreating(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Projeto
              </button>
            </div>
          )}

          {/* Project List */}
          <div className="space-y-2.5">
            {/* Global Workspace (Sem projeto) */}
            <div
              onClick={() => onSelectProject(undefined)}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                !activeProjectId
                  ? 'bg-neutral-800 border-indigo-500/60 shadow-xs'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    Geral (Sem Projeto)
                    {!activeProjectId && (
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Conversas padrão do dia a dia
                  </div>
                </div>
              </div>
            </div>

            {projects.map((proj) => {
              const isActive = activeProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/60 shadow-xs'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-800 text-indigo-400 shrink-0 mt-0.5">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span className="truncate">{proj.name}</span>
                        {isActive && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                            Ativo
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {proj.description}
                        </p>
                      )}
                      {proj.systemInstruction && (
                        <p className="text-[10px] text-indigo-300/80 truncate mt-0.5 italic">
                          Instruções: {proj.systemInstruction}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartEdit(proj)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Editar projeto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
