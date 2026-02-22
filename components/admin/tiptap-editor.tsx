'use client';

import { useEffect } from 'react';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';

type EditorValue = {
  json: JSONContent;
  html: string;
  text: string;
};

type TiptapEditorProps = {
  valueJson?: JSONContent | null;
  valueHtml?: string | null;
  onChange: (value: EditorValue) => void;
};

function ToolbarButton({
  label,
  onClick,
  isActive = false,
  disabled = false
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
        isActive
          ? 'border-[#97c74a] bg-[#d9f395] text-[#192109]'
          : 'border-black/15 bg-white text-black/75 hover:bg-black/[0.03]'
      }`}
    >
      {label}
    </button>
  );
}

function getDefaultContent() {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }]
  } as JSONContent;
}

export function TiptapEditor({ valueJson, valueHtml, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https'
      })
    ],
    content: valueJson ?? valueHtml ?? getDefaultContent(),
    immediatelyRender: false,
    onUpdate({ editor: currentEditor }) {
      onChange({
        json: currentEditor.getJSON(),
        html: currentEditor.getHTML(),
        text: currentEditor.getText()
      });
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (valueJson) {
      editor.commands.setContent(valueJson, { emitUpdate: false });
      return;
    }
    if (valueHtml) {
      editor.commands.setContent(valueHtml, { emitUpdate: false });
      return;
    }
    editor.commands.setContent(getDefaultContent(), { emitUpdate: false });
  }, [editor, valueJson, valueHtml]);

  if (!editor) {
    return <div className="rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black/60">Loading editor...</div>;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Enter URL', previousUrl ?? 'https://');
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: href.trim() }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-lg border border-black/10 bg-white/70 p-2">
        <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
        <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
        <ToolbarButton label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} />
        <ToolbarButton label="Strike" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} />
        <ToolbarButton label="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} />
        <ToolbarButton label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} />
        <ToolbarButton label="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} />
        <ToolbarButton label="Bullet" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
        <ToolbarButton label="Ordered" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />
        <ToolbarButton label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} />
        <ToolbarButton label="Link" onClick={setLink} isActive={editor.isActive('link')} />
        <ToolbarButton label="Unlink" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} />
        <ToolbarButton label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      </div>
      <div className="rounded-lg border border-black/20 bg-white/90 p-3">
        <EditorContent editor={editor} className="prose prose-sm max-w-none [&_.ProseMirror]:min-h-52 [&_.ProseMirror]:outline-none" />
      </div>
    </div>
  );
}
