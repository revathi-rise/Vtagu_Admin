'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Eraser,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
    h1: false,
    h2: false,
    p: false,
  });

  // Sync value from prop to editor (only if it differs from what's inside to avoid cursor jump)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const ul = document.queryCommandState('insertUnorderedList');
      const ol = document.queryCommandState('insertOrderedList');
      
      const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      const h1 = block === 'h1';
      const h2 = block === 'h2';
      const p = block === 'p';

      setActiveStates({ bold, italic, underline, ul, ol, h1, h2, p });
    } catch {
      // Ignore queryCommandState errors if selection is out of range
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
        updateActiveStates();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateActiveStates]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      
      // Clean empty markup like <br>, <p><br></p>, <div><br></div>
      const textContent = editorRef.current.textContent?.trim() || '';
      const cleanHtml = (!textContent && !html.includes('<img')) ? '' : html;

      onChange(cleanHtml);
      isUpdatingRef.current = false;
      updateActiveStates();
    }
  };

  const executeCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
    editorRef.current?.focus();
  };

  const handleFormatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    handleInput();
    editorRef.current?.focus();
  };

  const handleAddLink = () => {
    const selection = window.getSelection();
    let defaultUrl = 'https://';
    
    if (selection && !selection.isCollapsed) {
      const anchorParent = (selection.anchorNode as HTMLElement)?.parentElement;
      if (anchorParent && anchorParent.tagName === 'A') {
        defaultUrl = (anchorParent as HTMLAnchorElement).href || 'https://';
      }
    }

    const url = prompt('Enter URL:', defaultUrl);
    if (url && url !== 'https://') {
      executeCommand('createLink', url);
    }
  };

  const handleRemoveLink = () => {
    executeCommand('unlink');
  };

  const handleClearFormatting = () => {
    if (!editorRef.current) return;
    executeCommand('removeFormat');

    // Clean inline attributes from elements within editor
    const cleanNodes = (el: HTMLElement) => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('id');
      el.removeAttribute('bgcolor');
      el.removeAttribute('background');
      el.removeAttribute('color');

      Array.from(el.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          cleanNodes(child);
        }
      });
    };

    cleanNodes(editorRef.current);

    // Unwrap empty spans
    const spans = editorRef.current.querySelectorAll('span');
    spans.forEach((span) => {
      if (!span.attributes.length) {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent?.insertBefore(span.firstChild, span);
        }
        parent?.removeChild(span);
      }
    });

    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    let cleanedInsert = '';

    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const cleanNode = (node: Node) => {
          const children = Array.from(node.childNodes);
          for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const el = child as HTMLElement;
              const tag = el.tagName.toLowerCase();

              // Remove dangerous or unwanted tags
              if (['script', 'style', 'iframe', 'meta', 'link', 'object', 'embed'].includes(tag)) {
                el.remove();
                continue;
              }

              // Strip inline style/color/class attributes
              el.removeAttribute('style');
              el.removeAttribute('class');
              el.removeAttribute('id');
              el.removeAttribute('bgcolor');
              el.removeAttribute('background');
              el.removeAttribute('color');

              cleanNode(el);
            }
          }
        };

        cleanNode(doc.body);
        cleanedInsert = doc.body.innerHTML;
      } catch {
        cleanedInsert = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      }
    } else if (text) {
      cleanedInsert = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }

    if (cleanedInsert) {
      document.execCommand('insertHTML', false, cleanedInsert);
      handleInput();
    }
  };

  return (
    <div className="border border-border rounded-xl bg-muted/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {/* Embedded CSS for RichText formatting & reset */}
      <style jsx global>{`
        .rich-text-editor-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-editor-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-editor-content li {
          margin-bottom: 0.25rem !important;
        }
        .rich-text-editor-content h1 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-editor-content h2 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          line-height: 1.35 !important;
          margin-top: 0.625rem !important;
          margin-bottom: 0.375rem !important;
        }
        .rich-text-editor-content p {
          margin-bottom: 0.5rem !important;
        }
        .rich-text-editor-content a {
          color: #60a5fa !important;
          text-decoration: underline !important;
        }
        /* Crucial rule: strip any pasted background colors / black text colors */
        .rich-text-editor-content * {
          background-color: transparent !important;
          background: transparent !important;
          color: inherit !important;
          font-family: inherit !important;
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/60 border-b border-border/80 text-white select-none">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className={`p-1.5 rounded transition-colors ${
            activeStates.bold 
              ? 'bg-primary/30 text-primary font-bold' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className={`p-1.5 rounded transition-colors ${
            activeStates.italic 
              ? 'bg-primary/30 text-primary font-bold' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className={`p-1.5 rounded transition-colors ${
            activeStates.underline 
              ? 'bg-primary/30 text-primary font-bold' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className={`p-1.5 rounded transition-colors ${
            activeStates.ul 
              ? 'bg-primary/30 text-primary font-bold' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className={`p-1.5 rounded transition-colors ${
            activeStates.ol 
              ? 'bg-primary/30 text-primary font-bold' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => handleFormatBlock('h1')}
          className={`px-2 py-1 text-xs rounded font-semibold transition-colors ${
            activeStates.h1 
              ? 'bg-primary/30 text-primary' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => handleFormatBlock('h2')}
          className={`px-2 py-1 text-xs rounded font-semibold transition-colors ${
            activeStates.h2 
              ? 'bg-primary/30 text-primary' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleFormatBlock('p')}
          className={`px-2 py-1 text-xs rounded font-semibold transition-colors ${
            activeStates.p 
              ? 'bg-primary/30 text-primary' 
              : 'hover:bg-muted text-muted-foreground hover:text-white'
          }`}
          title="Paragraph"
        >
          P
        </button>

        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={handleAddLink}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRemoveLink}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Remove Link"
        >
          <Unlink className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleClearFormatting}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Clear Formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div 
        className="relative min-h-[150px] p-4 text-white text-sm cursor-text"
        onClick={() => editorRef.current?.focus()}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className="outline-none min-h-[120px] rich-text-editor-content text-white focus:text-white"
        />
        {!value && (
          <div className="absolute top-4 left-4 text-muted-foreground/50 pointer-events-none text-sm select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

