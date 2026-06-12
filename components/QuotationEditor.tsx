import React, { useRef, useState, useMemo, useEffect } from 'react';
import JoditEditor from 'jodit-react';

const CUSTOM_TEMPLATES_KEY = 'zenbill_custom_templates';

interface QuotationEditorProps {
  quotationId: string;
  initialTitle: string;
  initialContent: string;
  onBack: (shouldSave: boolean, title: string, content: string) => void;
  onSave: (id: string, title: string, content: string) => void;
  onCheckDuplicate: (title: string, currentId: string) => boolean;
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
const QuotationEditor: React.FC<QuotationEditorProps> = ({
  quotationId, initialTitle, initialContent, onBack, onSave, onCheckDuplicate,
}) => {
  const editorRef = useRef(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [zoom, setZoom] = useState(100);
  const [borderStyle, setBorderStyle] = useState('none');
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Configuration for Jodit
  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing...',
    height: '100%',
    toolbarSticky: false,
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'superscript', 'subscript', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    removeButtons: ['about'],
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false
  }), []);

  const handleSaveLocally = () => {
    onSave(quotationId, title, content);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;}
      @media print{body{padding:20px;}}</style>
    </head><body>${content}</body></html>`);
    win.document.close(); win.print();
  };

  const handleExport = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><title>${title}</title></head><body>${content}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/\s+/g,'_')}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleSaveAsTemplate = () => {
    const name = window.prompt('Enter template name:', title);
    if (!name?.trim()) return;
    const existing = JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
    const tpl = { id: `custom-${Date.now()}`, name: name.trim(), content };
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify([tpl, ...existing]));
    window.alert(`Template "${name.trim()}" saved! It will appear in your Templates list.`);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-130px)]">

      {/* ── Back Confirm Modal ── */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <h3 className="text-base font-bold text-gray-800 mb-1">Save before leaving?</h3>
            <p className="text-sm text-gray-500 mb-5">Do you want to save this quotation to your list?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowBackConfirm(false); onBack(false, title, content); }}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >No, Discard</button>
              <button
                onClick={() => {
                  if (onCheckDuplicate(title.trim(), quotationId)) {
                    setShowBackConfirm(false);
                    setShowReplaceConfirm(true);
                  } else {
                    onSave(quotationId, title, content);
                    setShowBackConfirm(false);
                    onBack(true, title, content);
                  }
                }}
                className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >Yes, Save</button>
            </div>
            <button onClick={() => setShowBackConfirm(false)} className="mt-3 w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">Cancel (stay here)</button>
          </div>
        </div>
      )}

      {/* ── Replace Existing Confirm Modal ── */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 animate-in">
            {/* Warning icon */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">File Already Exists</h3>
                <p className="text-xs text-gray-400">A quotation with this name was found</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-amber-800">
                A quotation titled <strong className="text-amber-900">"{title}"</strong> already exists. Do you want to replace it with this version?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReplaceConfirm(false); }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >No, Go Back</button>
              <button
                onClick={() => {
                  onSave(quotationId, title, content);
                  setShowReplaceConfirm(false);
                  onBack(true, title, content);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Yes, Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isDirty) setShowBackConfirm(true);
              else onBack(false, title, content);
            }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to Quotations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
              className="text-xl font-bold text-gray-800 bg-transparent border-none outline-none hover:underline focus:underline cursor-text w-64"
              placeholder="Quotation title..." />
            <p className="text-xs text-gray-400 mt-0.5">Word-Like Editor (Jodit)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveAsTemplate}
            className="px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Save as Template
          </button>
          <button onClick={() => { if (window.confirm('Clear all content?')) { setContent(''); setIsDirty(true); } }}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Clear</button>
          <button onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
          <button onClick={handleSaveLocally}
            className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 ${
              saveState === 'saved' ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {saveState === 'saved'
              ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved!</>
              : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save</>}
          </button>
        </div>
      </div>

      {/* ── Editor Card ── */}
      <div className="bg-gray-200 rounded-2xl shadow-inner border border-gray-300 flex flex-col flex-1 overflow-hidden relative">
        
        {/* We need some global CSS overrides for Jodit to look like an A4 document */}
        <style dangerouslySetInnerHTML={{__html: `
          .jodit-container:not(.jodit_inline) {
            border: none !important;
            display: flex;
            flex-direction: column;
            height: 100% !important;
            background: transparent !important;
          }
          .jodit-toolbar__box {
            background-color: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
            position: sticky;
            top: 0;
            z-index: 20;
            padding: 4px !important;
            border-radius: 1rem 1rem 0 0 !important;
          }
          .jodit-workplace {
            background-color: #e5e7eb !important; /* matches bg-gray-200 */
            padding: 32px 0 !important;
            overflow-y: auto !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
          }
          .jodit-wysiwyg {
            background-color: white !important;
            width: ${794 * zoom / 100}px !important;
            min-height: ${1123 * zoom / 100}px !important;
            padding: ${72 * zoom / 100}px ${80 * zoom / 100}px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
            margin: 0 auto !important;
            transform: scale(${zoom / 100});
            transform-origin: top center;
            transition: all 0.2s ease-out;
            ${borderStyle !== 'none' ? `border: ${borderStyle} !important; box-sizing: border-box;` : ''}
          }
          @media (max-width: 800px) {
            .jodit-wysiwyg {
              width: 100% !important;
              min-height: auto !important;
              padding: 16px !important;
              transform: none !important;
            }
          }
          /* Fix for Jodit fullsize mode with our scaling */
          .jodit_fullsize .jodit-workplace {
            padding: 0 !important;
          }
          .jodit_fullsize .jodit-wysiwyg {
            width: 100% !important;
            transform: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        `}} />

        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
           <div className="flex items-center gap-2">
             <label className="text-[10px] text-gray-500 font-medium ml-1">Page Border</label>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)}
                className="text-xs text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-1 focus:outline-none cursor-pointer">
                <option value="none">No Border</option>
                <option value="1px solid #d1d5db">Light</option>
                <option value="2px solid #374151">Solid</option>
                <option value="3px double #374151">Double</option>
                <option value="2px dashed #6366f1">Dashed</option>
                <option value="2px dotted #374151">Dotted</option>
                <option value="4px solid #10b981">Green</option>
                <option value="4px solid #ef4444">Red</option>
              </select>
           </div>
        </div>

        <JoditEditor
          ref={editorRef}
          value={content}
          config={config}
          onBlur={newContent => {
             setContent(newContent);
             setIsDirty(true);
          }}
          onChange={(newContent) => {}} // Handle onBlur for performance as recommended by Jodit
        />
        
        {/* ── Word-style Zoom Bar ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <span className="text-[11px] text-gray-400">Word-like Editor Active</span>
          <div className="flex items-center gap-2">
            <button
              onMouseDown={e => { e.preventDefault(); setZoom(z => Math.max(25, z - 10)); }}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base leading-none font-bold transition-colors"
              title="Zoom out"
            >−</button>
            <input
              type="range" min={25} max={200} step={5} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-28 h-1.5 accent-indigo-500 cursor-pointer"
              title="Zoom"
            />
            <button
              onMouseDown={e => { e.preventDefault(); setZoom(z => Math.min(200, z + 10)); }}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base leading-none font-bold transition-colors"
              title="Zoom in"
            >+</button>
            <button
              onMouseDown={e => { e.preventDefault(); setZoom(100); }}
              className="text-[11px] text-indigo-600 hover:underline font-semibold w-10 text-center"
              title="Reset zoom"
            >{zoom}%</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationEditor;
