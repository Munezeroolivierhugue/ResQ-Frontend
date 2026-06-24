import { useState, useEffect } from 'react'
import {
  Download,
  X,
  FileText,
  Loader2,
  Check,
  Mail,
  Users,
  Plus
} from 'lucide-react'

export default function ExportShareModal({ isOpen, onClose }) {
  const [exportStatus, setExportStatus] = useState('idle') // 'idle' | 'exporting' | 'success'
  const [isAddingRecipient, setIsAddingRecipient] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setExportStatus('idle')
      setIsAddingRecipient(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (exportStatus === 'exporting') {
      const timer = setTimeout(() => {
        setExportStatus('success')
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [exportStatus])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-md export-modal-backdrop"
      onClick={() => {
        if (exportStatus === 'idle') onClose()
      }}
    >
      <div 
        className="dispatcher-surface w-full max-w-md relative rounded-xl shadow-2xl border border-(--border) overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {exportStatus === 'idle' ? (
          <>
            <div className="p-4 border-b border-(--border) flex justify-between items-center bg-(--bg-elevated)">
              <h3 className="text-[16px] font-bold m-0 flex items-center gap-2">
                <Download size={18} style={{ color: 'var(--accent)' }} />
                Export & Share
              </h3>
              <button
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer bg-transparent border-none p-1 rounded-md hover:bg-(--bg-base)"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div>
                <h4 className="text-[13px] font-bold m-0 mb-3 flex items-center gap-2 text-(--text-primary)">
                  <FileText size={14} className="text-(--text-muted)" />
                  Download Report
                </h4>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button" 
                    className="dispatcher-btn-primary h-11 text-[13px] font-medium flex justify-between items-center px-4 rounded-lg"
                    onClick={() => setExportStatus('exporting')}
                  >
                    <span>PDF Document</span>
                    <span className="font-mono text-[11px] opacity-70">.pdf</span>
                  </button>
                  <button 
                    type="button" 
                    className="dispatcher-btn-outline h-11 text-[13px] font-medium flex justify-between items-center px-4 rounded-lg bg-(--bg-base)"
                    onClick={() => setExportStatus('exporting')}
                  >
                    <span>Excel Spreadsheet</span>
                    <span className="font-mono text-[11px] opacity-70">.xlsx</span>
                  </button>
                  <button 
                    type="button" 
                    className="dispatcher-btn-outline h-11 text-[13px] font-medium flex justify-between items-center px-4 rounded-lg bg-(--bg-base)"
                    onClick={() => setExportStatus('exporting')}
                  >
                    <span>Raw Data (CSV)</span>
                    <span className="font-mono text-[11px] opacity-70">.csv</span>
                  </button>
                </div>
              </div>

              <hr className="border-(--border) my-0" />

              <div>
                <h4 className="text-[13px] font-bold m-0 mb-3 flex items-center gap-2 text-(--text-primary)">
                  <Mail size={14} className="text-(--text-muted)" />
                  Distribution List
                </h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between p-3 border border-(--border) rounded-lg bg-(--bg-base) cursor-pointer hover:border-(--accent) transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="accent-(--accent) w-4 h-4" />
                      <div>
                        <div className="text-[13px] font-medium">Daily Exec Briefing</div>
                        <div className="text-[11px] text-(--text-muted)">12 recipients</div>
                      </div>
                    </div>
                    <Users size={14} className="text-(--text-muted)" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-(--border) rounded-lg bg-(--bg-base) cursor-pointer hover:border-(--accent) transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="accent-(--accent) w-4 h-4" />
                      <div>
                        <div className="text-[13px] font-medium">District Commanders</div>
                        <div className="text-[11px] text-(--text-muted)">30 recipients</div>
                      </div>
                    </div>
                    <Users size={14} className="text-(--text-muted)" />
                  </label>
                  
                  {isAddingRecipient ? (
                    <div className="mt-2 p-3 border border-(--border) rounded-lg bg-(--bg-elevated) flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="Recipient Name" 
                        className="dispatcher-input h-9 text-[12px]" 
                      />
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="dispatcher-input h-9 text-[12px]" 
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button 
                          type="button" 
                          className="dispatcher-btn-ghost h-7 px-3 text-[11px] font-semibold"
                          onClick={() => setIsAddingRecipient(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="dispatcher-btn-primary h-7 px-3 text-[11px] font-semibold"
                          onClick={() => setIsAddingRecipient(false)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="dispatcher-btn-ghost text-[12px] h-9 mt-1 flex items-center gap-1"
                      onClick={() => setIsAddingRecipient(true)}
                    >
                      <Plus size={14} />
                      Add Recipient
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-(--border) flex justify-end gap-3 bg-(--bg-elevated)">
              <button 
                type="button" 
                className="dispatcher-btn-ghost h-10 px-5 font-bold text-[13px]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="dispatcher-btn-primary h-10 px-5 font-bold text-[13px] flex items-center gap-2"
                onClick={() => setExportStatus('exporting')}
              >
                <Mail size={16} />
                Email Report
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500"
              style={{
                background: exportStatus === 'success' ? 'var(--accent)' : 'var(--accent-ghost)',
                color: exportStatus === 'success' ? 'white' : 'var(--accent)',
                animation: exportStatus === 'exporting' ? 'export-icon-pulse 2s infinite ease-in-out' : 'none',
              }}
            >
              {exportStatus === 'success' ? <Check size={32} /> : <FileText size={32} />}
            </div>
            <h3 className="text-[18px] font-bold m-0 mb-2">
              {exportStatus === 'success' ? 'Export Complete' : 'Exporting Report'}
            </h3>
            <p className="text-[13px] text-(--text-secondary) m-0 mb-6">
              {exportStatus === 'success' 
                ? 'Your report has been successfully processed.' 
                : 'Please wait while we compile the report data. This may take a few moments.'}
            </p>
            
            {exportStatus === 'exporting' ? (
              <>
                <div className="w-full h-2 rounded-full overflow-hidden mb-3 relative export-progress-track">
                  <div className="absolute top-0 left-0 h-full rounded-full export-progress-fill" />
                </div>
                <div className="flex items-center gap-2 text-[12px] text-(--text-muted) font-medium">
                  <Loader2 size={14} className="animate-spin" />
                  Processing datasets...
                </div>
              </>
            ) : (
              <div className="flex w-full mt-2">
                <button 
                  type="button" 
                  className="dispatcher-btn-outline flex-1 h-11 font-bold text-[13px]"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
