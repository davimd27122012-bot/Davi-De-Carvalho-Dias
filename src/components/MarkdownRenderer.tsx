import React, { useMemo, useState } from 'react';
import { marked, Renderer } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parsedHtml = useMemo(() => {
    const customRenderer = new Renderer();

    // Customize links to open in a new tab
    customRenderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">${text}</a>`;
    };

    // Customize code blocks to include a neat toolbar
    let codeIndex = 0;
    customRenderer.code = ({ text, lang }) => {
      const index = codeIndex++;
      const language = lang || 'código';
      const encodedCode = encodeURIComponent(text);
      return `
        <div class="my-4 rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-lg group">
          <div class="flex items-center justify-between px-4 py-2 bg-neutral-800/80 border-b border-neutral-800 text-xs text-neutral-400 font-mono">
            <span class="font-medium text-neutral-300 lowercase">${language}</span>
            <button
              type="button"
              data-code="${encodedCode}"
              data-index="${index}"
              class="code-copy-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/60 transition-all text-xs cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span class="btn-label">Copiar</span>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-sm text-neutral-200 font-mono leading-relaxed selection:bg-indigo-500/40"><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
      `;
    };

    try {
      return marked.parse(content || '', { renderer: customRenderer, gfm: true, breaks: true }) as string;
    } catch (e) {
      console.error('Erro ao renderizar markdown:', e);
      return content;
    }
  }, [content]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.code-copy-btn') as HTMLElement;
    if (button) {
      const code = button.getAttribute('data-code');
      const indexStr = button.getAttribute('data-index');
      if (code) {
        const decoded = decodeURIComponent(code);
        navigator.clipboard.writeText(decoded);
        const index = indexStr ? parseInt(indexStr, 10) : 0;
        setCopiedIndex(index);

        const label = button.querySelector('.btn-label');
        if (label) {
          const originalText = label.textContent;
          label.textContent = 'Copiado!';
          button.classList.add('text-emerald-400');
          setTimeout(() => {
            label.textContent = originalText;
            button.classList.remove('text-emerald-400');
            setCopiedIndex(null);
          }, 2000);
        }
      }
    }
  };

  return (
    <div className="relative prose-chat leading-relaxed">
      <div
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
        className="break-words space-y-2 text-[15px]"
        onClick={handleContainerClick}
      />
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-1.5 bg-indigo-400 animate-pulse align-middle rounded-full" />
      )}
    </div>
  );
};
