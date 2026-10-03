import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  X,
  Calendar,
  Repeat,
} from 'lucide-react';
import { Reminder } from '../types';

interface RemindersManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersManagerModal: React.FC<RemindersManagerModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      datetime,
      recurrence,
      completed: false,
    });

    setTitle('');
    setIsAdding(false);
  };

  const activeReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Lembretes & Tarefas
              </h2>
              <p className="text-xs text-neutral-400">
                Lembretes reais programados com data, horário e repetição
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
          {/* Add Reminder Form */}
          {isAdding ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">Criar Novo Lembrete</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-xs text-neutral-300 block mb-1">O que lembrar?</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tomar remédio, Revisar capítulo, Reunião de equipe..."
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 block mb-1">Data e Hora</label>
                  <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 block mb-1">Recorrência</label>
                  <select
                    value={recurrence}
                    onChange={(e: any) => setRecurrence(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="none">Sem repetição</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Salvar Lembrete
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">
                Lembretes Ativos ({activeReminders.length})
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Lembrete
              </button>
            </div>
          )}

          {/* Active List */}
          <div className="space-y-2">
            {activeReminders.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-xs text-neutral-500">
                Nenhum lembrete pendente. Peça no chat como <em>"Me lembre amanhã às 9h"</em> ou crie um novo aqui!
              </div>
            ) : (
              activeReminders.map((rem) => {
                const dateObj = new Date(rem.datetime);
                const isOverdue = dateObj.getTime() < Date.now();

                return (
                  <div
                    key={rem.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleComplete(rem.id)}
                        className="text-neutral-500 hover:text-emerald-400 transition-colors shrink-0"
                        title="Marcar como concluído"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{rem.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue ? 'text-rose-400 font-medium' : 'text-neutral-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {dateObj.toLocaleDateString('pt-BR')} às{' '}
                            {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rem.recurrence && rem.recurrence !== 'none' && (
                            <span className="flex items-center gap-1 text-indigo-400">
                              <Repeat className="w-2.5 h-2.5" />
                              {rem.recurrence === 'daily'
                                ? 'Todo dia'
                                : rem.recurrence === 'weekly'
                                ? 'Toda semana'
                                : 'Todo mês'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Concluídos ({completedReminders.length})
              </span>
              <div className="space-y-1.5">
                {completedReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60 flex items-center justify-between text-xs opacity-60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button onClick={() => onToggleComplete(rem.id)}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </button>
                      <span className="line-through text-neutral-400 truncate">{rem.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
