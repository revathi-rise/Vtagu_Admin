'use client';

import React, { useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Eraser 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Sync value from prop to editor (only if it differs from what's inside to avoid cursor jump)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      // If editor is empty (e.g. only contains <br>), treat as empty string
      const cleanHtml = html === '<br>' || html === '<p><br></p>' ? '' : html;
      onChange(cleanHtml);
      isUpdatingRef.current = false;
    }
  };

  const executeCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
    editorRef.current?.focus();
  };

  return (
    <div className="border border-border rounded-xl bg-muted/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/60 border-b border-border/80 text-white select-none">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h1>')}
          className="px-2 py-1 text-xs hover:bg-muted rounded text-muted-foreground hover:text-white font-semibold transition-colors"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className="px-2 py-1 text-xs hover:bg-muted rounded text-muted-foreground hover:text-white font-semibold transition-colors"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<p>')}
          className="px-2 py-1 text-xs hover:bg-muted rounded text-muted-foreground hover:text-white font-semibold transition-colors"
          title="Paragraph"
        >
          P
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
          onClick={() => executeCommand('removeFormat')}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
          title="Clear Formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div className="relative min-h-[150px] p-4 text-white text-sm">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="outline-none min-h-[120px] prose prose-invert max-w-none text-white focus:text-white"
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
