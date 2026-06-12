import React, { useState, useEffect } from 'react';
import { View } from '../App';
import QuotationEditor from './QuotationEditor';

interface Quotation {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'zenbill_quotations';

const todayStr = () => new Date().toLocaleDateString('en-IN');

// ─── Default blank content ─────────────────────────────────────────────────
const blankContent = () => `
<p style="text-align:center;font-size:24px;font-weight:bold;margin-bottom:4px;">QUOTATION</p>
<p style="text-align:center;color:#6b7280;margin-bottom:32px;">Ref No: QT-001 &nbsp;|&nbsp; Date: ${todayStr()}</p>
<hr style="border:none;border-top:2px solid #e5e7eb;margin-bottom:32px;"/>
<p><strong>To,</strong><br/>Client Name<br/>Client Address<br/>GSTIN:&nbsp;</p>
<br/>
<p><strong>Subject:</strong> Quotation for [Service/Product Description]</p>
<br/>
<p>Dear Sir/Madam,</p>
<br/>
<p>We are pleased to submit our quotation for the supply of the following goods/services:</p>
<br/>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <thead><tr style="background:#f3f4f6;">
    <th style="border:1px solid #d1d5db;padding:10px;">S.No</th>
    <th style="border:1px solid #d1d5db;padding:10px;text-align:left;">Description</th>
    <th style="border:1px solid #d1d5db;padding:10px;">HSN</th>
    <th style="border:1px solid #d1d5db;padding:10px;">Qty</th>
    <th style="border:1px solid #d1d5db;padding:10px;text-align:right;">Rate (₹)</th>
    <th style="border:1px solid #d1d5db;padding:10px;text-align:right;">Amount (₹)</th>
  </tr></thead>
  <tbody>
    <tr>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:center;">1</td>
      <td style="border:1px solid #d1d5db;padding:10px;">Item description</td>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:center;">0000</td>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:center;">1</td>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:right;">0.00</td>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:right;">0.00</td>
    </tr>
    <tr>
      <td style="border:1px solid #d1d5db;padding:10px;" colspan="5"><strong>Total</strong></td>
      <td style="border:1px solid #d1d5db;padding:10px;text-align:right;"><strong>₹0.00</strong></td>
    </tr>
  </tbody>
</table>
<br/>
<p><strong>Terms &amp; Conditions:</strong></p>
<ol style="padding-left:20px;line-height:2;">
  <li>Valid for 30 days from date of issue.</li>
  <li>Payment: 50% advance, 50% on delivery.</li>
  <li>Delivery within [X] working days of confirmation.</li>
</ol>
<br/><br/>
<p>Thanking You,</p><br/><br/>
<p><strong>For [Company Name]</strong><br/>Authorized Signatory</p>`;

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic Corporate',
    desc: 'Centered, black border letterhead',
    accent: '#111827',
    headerBg: '#ffffff',
    headerText: '#111827',
    style: 'border-top: 3px solid #111827;',
    preview: { top: '#111827', text: '#fff' },
    buildContent: (co: CustomForm) => `
<div style="text-align:center;border-top:3px solid #111827;border-bottom:1px solid #d1d5db;padding:20px 0 16px;margin-bottom:28px;">
  <div style="font-size:26px;font-weight:800;letter-spacing:2px;color:#111827;">${co.name || 'COMPANY NAME'}</div>
  <div style="font-size:12px;color:#6b7280;margin-top:4px;">${co.tagline || 'Your Tagline Here'}</div>
  <div style="font-size:11px;color:#374151;margin-top:6px;">${co.address || '123 Business St, City - 560001'} &nbsp;|&nbsp; ${co.phone || '+91 99999 99999'} &nbsp;|&nbsp; ${co.email || 'info@company.com'}</div>
  ${co.gstin ? `<div style="font-size:11px;color:#374151;">GSTIN: ${co.gstin}</div>` : ''}
</div>
${blankContent()}`,
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    desc: 'Bold navy header with white text',
    accent: '#1e40af',
    preview: { top: '#1e40af', text: '#fff' },
    buildContent: (co: CustomForm) => `
<div style="background:#1e40af;color:#fff;padding:24px 40px;margin:-72px -80px 40px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-size:24px;font-weight:800;letter-spacing:1px;">${co.name || 'COMPANY NAME'}</div>
    <div style="font-size:11px;opacity:0.8;margin-top:3px;">${co.tagline || 'Professional Services'}</div>
  </div>
  <div style="text-align:right;font-size:11px;opacity:0.85;line-height:1.8;">
    <div>${co.phone || '+91 99999 99999'}</div>
    <div>${co.email || 'info@company.com'}</div>
    ${co.gstin ? `<div>GSTIN: ${co.gstin}</div>` : ''}
  </div>
</div>
<div style="margin-bottom:16px;font-size:11px;color:#6b7280;">${co.address || '123 Business Street, City - 560001'}</div>
${blankContent()}`,
  },
  {
    id: 'minimal-violet',
    name: 'Minimal Violet',
    desc: 'Left accent bar, clean layout',
    accent: '#7c3aed',
    preview: { top: '#7c3aed', text: '#fff' },
    buildContent: (co: CustomForm) => `
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-left:5px solid #7c3aed;padding-left:16px;margin-bottom:32px;">
  <div>
    <div style="font-size:22px;font-weight:800;color:#1f2937;">${co.name || 'Company Name'}</div>
    <div style="font-size:11px;color:#7c3aed;font-weight:600;margin-top:2px;">${co.tagline || 'Professional Services'}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px;">${co.address || '123 Business St, City'}</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#6b7280;line-height:1.9;">
    <div>${co.phone || '+91 99999 99999'}</div>
    <div>${co.email || 'info@company.com'}</div>
    ${co.gstin ? `<div>GSTIN: ${co.gstin}</div>` : ''}
  </div>
</div>
${blankContent()}`,
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    desc: 'Dark slate header, premium look',
    accent: '#0f172a',
    preview: { top: '#0f172a', text: '#fff' },
    buildContent: (co: CustomForm) => `
<div style="background:#0f172a;color:#fff;padding:28px 40px;margin:-72px -80px 40px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-size:22px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">${co.name || 'COMPANY NAME'}</div>
    <div style="font-size:10px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">${co.tagline || 'Excellence in Service'}</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#94a3b8;line-height:1.9;">
    ${co.gstin ? `<div>GSTIN: ${co.gstin}</div>` : ''}
    <div>${co.email || 'info@company.com'}</div>
    <div>${co.phone || '+91 99999 99999'}</div>
  </div>
</div>
<div style="margin-bottom:20px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:12px;">${co.address || '123 Business Street, City - 560001'}</div>
${blankContent()}`,
  },
];

interface CustomForm {
  name: string; tagline: string; address: string;
  phone: string; email: string; gstin: string;
}

const CUSTOM_TEMPLATES_KEY = 'zenbill_custom_templates';
const emptyCustom: CustomForm = { name: '', tagline: '', address: '', phone: '', email: '', gstin: '' };

// ─── Template Modal ────────────────────────────────────────────────────────────
const TemplateModal: React.FC<{
  onClose: () => void;
  onSelect: (templateId: string) => void;
  onCustomize: () => void;
  activeTemplateId: string | null;
}> = ({ onClose, onSelect, onCustomize, activeTemplateId }) => {
  const [localSelected, setLocalSelected] = useState<string | null>(activeTemplateId);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Build preview HTML for any template (built-in or custom)
  const getPreviewContent = (id: string): string => {
    const builtIn = TEMPLATES.find(t => t.id === id);
    if (builtIn) return builtIn.buildContent({ name: 'Company Name', tagline: 'Your Tagline', address: '123 Business St, City', phone: '+91 99999 99999', email: 'info@company.com', gstin: '' });
    const customs: { id: string; name: string; content: string }[] =
      JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
    return customs.find(t => t.id === id)?.content || '';
  };

  const handleApply = () => {
    onSelect(localSelected || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>

      {/* ── Full-Page Template Preview ── */}
      {previewId && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span className="font-bold text-gray-800">Template Preview</span>
              <span className="text-xs text-gray-400">— {TEMPLATES.find(t => t.id === previewId)?.name || 'Custom Template'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLocalSelected(previewId); setPreviewId(null); }}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >Select This Template</button>
              <button onClick={() => setPreviewId(null)} className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Close Preview</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-200 p-8">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="bg-white shadow-2xl"
                style={{
                  width: '794px',
                  minHeight: '600px',
                  padding: '72px 80px',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#1a1a1a',
                  transformOrigin: 'top center',
                }}
                dangerouslySetInnerHTML={{ __html: getPreviewContent(previewId) }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Letterhead Templates</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose a template or customize your own letterhead</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCustomize}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border text-violet-600 border-violet-200 hover:bg-violet-50 transition-colors"
            >
              ✏️ Customize Letterhead
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Custom Templates */}
          {(() => {
            const custom: { id: string; name: string; content: string }[] =
              JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
            if (custom.length === 0) return null;
            return (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Your Custom Templates</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {custom.map(ct => (
                    <div key={ct.id}
                      onClick={() => setLocalSelected(ct.id)}
                      className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        localSelected === ct.id ? 'border-violet-500 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <div className="h-24 bg-violet-50 relative overflow-hidden p-2">
                        <div className="text-[7px] leading-tight text-gray-500 overflow-hidden h-full"
                          dangerouslySetInnerHTML={{ __html: ct.content.slice(0, 200) }} />
                        {localSelected === ct.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-800 truncate">{ct.name}</p>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const all: typeof custom = JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
                            localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(all.filter(t => t.id !== ct.id)));
                            if (localSelected === ct.id) setLocalSelected(null);
                            window.dispatchEvent(new Event('storage'));
                          }}
                          className="text-[10px] text-red-400 hover:text-red-600 ml-1 flex-shrink-0" title="Delete template"
                        >✕</button>
                      </div>
                      {/* Preview button below card */}
                      <div className="px-2.5 pb-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setPreviewId(ct.id); }}
                          className="w-full py-1 text-[11px] font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
          {/* Built-in Templates */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Built-in Templates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id}
                onClick={() => setLocalSelected(tpl.id)}
                className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  localSelected === tpl.id ? 'border-indigo-500 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="h-32 bg-gray-50 relative overflow-hidden">
                  <div style={{ background: tpl.preview.top }} className="h-10 w-full flex items-center px-3">
                    <div className="text-white font-bold text-xs opacity-90">COMPANY NAME</div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {[80, 100, 70, 90, 60].map((w, i) => (
                      <div key={i} className="h-1.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {localSelected === tpl.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-sm font-semibold text-gray-800">{tpl.name}</p>
                  <p className="text-xs text-gray-400">{tpl.desc}</p>
                </div>
                {/* Preview button below card */}
                <div className="px-3 pb-3">
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewId(tpl.id); }}
                    className="w-full py-1 text-[11px] font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Clear + Apply row */}
          <div className="flex gap-3">
            <button
              onClick={() => setLocalSelected(null)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              No Template (Blank)
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TEMPLATE_KEY = 'zenbill_active_template';

// ─── Quotation List ───────────────────────────────────────────────────────────
const QuotationList: React.FC<{ setView: (v: View) => void }> = ({ setView }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    () => localStorage.getItem(TEMPLATE_KEY)
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setQuotations(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const persist = (list: Quotation[]) => {
    setQuotations(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const saveActiveTemplate = (id: string) => {
    setActiveTemplateId(id || null);
    if (id) localStorage.setItem(TEMPLATE_KEY, id);
    else localStorage.removeItem(TEMPLATE_KEY);
  };

  // Build content for a new blank quotation — reads from localStorage for freshness
  const newContent = (): string => {
    // Read active template id directly from localStorage to avoid stale closure
    const templateId = activeTemplateId || localStorage.getItem(TEMPLATE_KEY);
    if (!templateId) return '';
    // Built-in templates
    const builtIn = TEMPLATES.find(t => t.id === templateId);
    if (builtIn) return builtIn.buildContent(emptyCustom);
    // Custom templates from localStorage
    const customs: { id: string; name: string; content: string }[] =
      JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
    const found = customs.find(t => t.id === templateId);
    return found?.content || '';
  };

  const openNew = (content?: string, title = 'New Quotation') => {
    const q: Quotation = {
      id: `qt-${Date.now()}`,
      title,
      content: content ?? newContent(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Do NOT persist yet — only add to list when user confirms save
    setEditing(q);
    setEditingIsNew(true);
  };

  const handleSave = (id: string, title: string, content: string) => {
    if (editingIsNew) {
      // Check if another quotation with the same title exists — if so, replace it
      const duplicateIdx = quotations.findIndex(
        q => q.title.trim().toLowerCase() === title.trim().toLowerCase() && q.id !== id
      );
      if (duplicateIdx !== -1) {
        // Replace: remove the old entry and insert the new one
        const updated = quotations.filter((_, i) => i !== duplicateIdx);
        const q: Quotation = { id, title, content, createdAt: editing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        persist([q, ...updated]);
      } else {
        // First save — add to list
        const q: Quotation = { id, title, content, createdAt: editing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        persist([q, ...quotations]);
      }
      setEditingIsNew(false);
    } else {
      // Editing existing: check if renaming to a title that another quotation already has
      const duplicateIdx = quotations.findIndex(
        q => q.title.trim().toLowerCase() === title.trim().toLowerCase() && q.id !== id
      );
      if (duplicateIdx !== -1) {
        // Replace the duplicate, update current
        const filtered = quotations.filter(q => q.id !== quotations[duplicateIdx].id);
        persist(filtered.map(q => q.id === id ? { ...q, title, content, updatedAt: new Date().toISOString() } : q));
      } else {
        persist(quotations.map(q => q.id === id ? { ...q, title, content, updatedAt: new Date().toISOString() } : q));
      }
    }
    if (editing?.id === id) setEditing(prev => prev ? { ...prev, title, content } : prev);
  };

  /** Returns true if another quotation with the same title (case-insensitive) exists */
  const checkDuplicateTitle = (title: string, currentId: string): boolean => {
    return quotations.some(
      q => q.title.trim().toLowerCase() === title.trim().toLowerCase() && q.id !== currentId
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this quotation?')) return;
    persist(quotations.filter(q => q.id !== id));
  };

  // Called by QuotationEditor confirm dialog
  const handleEditorBack = (shouldSave: boolean, title: string, content: string) => {
    if (shouldSave && editing) {
      handleSave(editing.id, title, content);
    }
    // If not saving and it was a new doc, it simply doesn't get added to the list
    setEditing(null);
    setEditingIsNew(false);
  };

  // Customize letterhead = blank editor
  const handleCustomize = () => {
    setShowTemplates(false);
    openNew('', 'Custom Letterhead');
  };

  // Show editor if one is selected
  if (editing) {
    return (
      <QuotationEditor
        quotationId={editing.id}
        initialTitle={editing.title}
        initialContent={editing.content}
        onBack={handleEditorBack}
        onSave={handleSave}
        onCheckDuplicate={checkDuplicateTitle}
      />
    );
  }

  return (
    <div className="space-y-6">
      {showTemplates && (
        <TemplateModal
          onClose={() => setShowTemplates(false)}
          onSelect={saveActiveTemplate}
          onCustomize={handleCustomize}
          activeTemplateId={activeTemplateId}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-400">{quotations.length} document{quotations.length !== 1 ? 's' : ''} saved</p>
            {activeTemplateId && (
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                Template: {TEMPLATES.find(t => t.id === activeTemplateId)?.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Templates
        </button>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

        {/* New Quotation Card */}
        <button
          onClick={() => openNew()}
          className="group h-52 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">New Quotation</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTemplateId
                ? `Uses: ${TEMPLATES.find(t => t.id === activeTemplateId)?.name}`
                : 'Blank white page'}
            </p>
          </div>
        </button>

        {/* Existing Quotation Cards */}
        {quotations.map(q => (
          <div
            key={q.id}
            onClick={() => setEditing(q)}
            className="group relative h-52 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all overflow-hidden flex flex-col"
          >
            {/* Document preview strip */}
            <div className="h-28 bg-gray-50 border-b border-gray-100 p-3 overflow-hidden">
              <div
                className="text-[8px] leading-tight text-gray-400 pointer-events-none scale-75 origin-top-left"
                dangerouslySetInnerHTML={{ __html: q.content.slice(0, 300) }}
              />
            </div>
            {/* Card footer */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 truncate">{q.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Updated {new Date(q.updatedAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-indigo-600 font-medium group-hover:underline">Open →</span>
                <button
                  onClick={e => handleDelete(q.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {quotations.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-14 h-14 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No quotations yet</p>
          <p className="text-xs mt-1">Click the blank card above to create your first one, or pick a template.</p>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
