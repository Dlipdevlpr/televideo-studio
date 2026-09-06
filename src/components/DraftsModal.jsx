import React from 'react';
import { X, FileText, Clock, Trash2 } from 'lucide-react';

export default function DraftsModal({ isOpen, onClose, onSelectDraft }) {
  if (!isOpen) return null;
  
  const draftsStr = localStorage.getItem('televideo_draft_history') || '[]';
  let drafts = [];
  try { 
    drafts = JSON.parse(draftsStr); 
  } catch(e) {}
  
  const handleDelete = (id, e) => {
    e.stopPropagation();
    const newDrafts = drafts.filter(d => d.id !== id);
    localStorage.setItem('televideo_draft_history', JSON.stringify(newDrafts));
    
    // force re-render by toggling open/close or relying on next open
    onClose();
    setTimeout(() => {
      const btn = document.getElementById('btn-open-drafts');
      if (btn) btn.click();
    }, 50);
  };
  
  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header border-b border-gray-800 pb-4">
          <div className="export-modal-title">
            <FileText size={22} className="modal-title-icon text-emerald-400" />
            <div>
              <h4 className="modal-title-heading">Draft History</h4>
              <p className="modal-title-sub">Your saved scripts ({drafts.length}/20)</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No saved drafts yet.</div>
          ) : (
            drafts.map((draft) => (
              <div 
                key={draft.id} 
                onClick={() => { onSelectDraft(draft); onClose(); }} 
                className="flex items-start justify-between p-3 rounded-lg border border-gray-800 bg-[#1e2229] hover:bg-gray-800 hover:border-indigo-500/50 cursor-pointer transition-all group"
              >
                <div className="flex-1 pr-4">
                  <p className="text-sm font-semibold text-gray-200 mb-1">{draft.preview}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                    <Clock size={10} /> {new Date(draft.timestamp).toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(draft.id, e)} 
                  className="p-2 rounded-md bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all" 
                  title="Delete Draft"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
