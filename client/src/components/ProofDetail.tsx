import { Button } from '@/components/ui/button';
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from '@/components/ui/progress';
import { Proof, UserProfile } from '@/types';
import { FilloutPopupEmbed } from "@fillout/react";
import { ArrowRight, Clock, Download, FileText, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
interface ProofDetailProps {
  proof: Proof;
  user: UserProfile;
  onBack: () => void;
  onUpload: (file: File) => void;
  onUploadNotes: (file: File) => void;
  uploadProgress: number | null;
}

export function ProofDetail({
  proof,
  user,
  onBack,
  onUpload,
  onUploadNotes,
  uploadProgress,
}: ProofDetailProps) {
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFilloutOpen, setIsFilloutOpen] = useState(false);

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl border border-plum/10 overflow-hidden max-w-5xl mx-auto font-sans">
      <FilloutPopupEmbed
        filloutId="3XxsmAAjLeus"
        isOpen={isFilloutOpen}
        onClose={() => setIsFilloutOpen(false)}
      />
      {/* Header bar */}
      <div className="bg-plum/5 p-4 border-b border-plum/10 flex justify-between items-center px-8">
        <button
          onClick={onBack}
          className="text-xs font-black text-plum hover:opacity-70 transition flex items-center gap-2 uppercase tracking-widest cursor-pointer"
        >
          &larr; Back
        </button>
        <span className="text-[10px] font-black text-plum/40 uppercase tracking-widest italic">
          Proof ID: {proof.id}
        </span>
      </div>

      <div className="p-12">
        {/* Title and stage info */}
        <div className="mb-16">
          <h2 className="text-6xl font-black text-plum mb-6 tracking-tighter leading-none font-serif">
            {proof.id}
          </h2>
          <span className="px-6 py-2 bg-plum text-paper rounded-full text-xs font-black uppercase tracking-widest inline-block">
            Current Stage: {proof.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Retrieve Current / Add Notes */}
          <div className="space-y-12">
            <section>
              <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Download size={16} /> 1. Retrieve Current
              </h3>
              <div className="space-y-4">
                {proof.can_download ? (
                  <a
                    href={`/api/proofs/${proof.id}/download`}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-plum/5 bg-white text-plum transition-all group hover:shadow-lg hover:border-plum"
                    download
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-plum/5 group-hover:bg-plum group-hover:text-paper transition-all">
                        <Download size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none mb-1">
                          Latest Version
                        </span>
                        <span className="text-[10px] uppercase font-bold opacity-40">
                          PDF Document
                        </span>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="p-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-300 flex items-center gap-5 italic grayscale">
                    <Download size={24} className="opacity-20" />
                    <span className="text-sm font-bold uppercase tracking-widest">
                      Restricted in this stage
                    </span>
                  </div>
                )}

                {proof.has_notes && (
                  <a
                    href={`/api/proofs/${proof.id}/notes`}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-blue-900 transition-all group hover:shadow-lg hover:border-blue-500"
                    download
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none mb-1">
                          Editorial Notes
                        </span>
                        <span className="text-[10px] uppercase font-bold opacity-40">
                          DOCX Document
                        </span>
                      </div>
                    </div>
                  </a>
                )}

                {proof.stage !== 'ed' && proof.has_txt && (
                  <a
                    href={`/api/proofs/${proof.id}/txt`}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 text-emerald-950 transition-all group hover:shadow-lg hover:border-emerald-600"
                    download
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none mb-1">
                          Plaintext Notes
                        </span>
                        <span className="text-[10px] uppercase font-bold opacity-40">
                          TXT Document
                        </span>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </section>

            {(user.username === 'ed' || user.role === 'admin') && (
              <section className="pt-8 border-t border-plum/10">
                <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-6">
                  Optional: Add Notes
                </h3>
                <input
                  type="file"
                  accept=".docx"
                  id="notes-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadNotes(file);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="notes-upload"
                  className="flex items-center justify-center gap-3 w-full py-5 px-6 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all text-blue-800 font-black uppercase text-xs tracking-widest"
                >
                  <FileText size={18} />
                  {proof.has_notes ? 'Update Word Doc' : 'Attach Word Doc'}
                </label>
              </section>
            )}
            {(user.username === 'diane' || user.role === 'admin') && (
              <section className="pt-8 border-t border-plum/10">
                <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-6">
                  Optional: Add Notes
                </h3>
                <button
                  onClick={() => setIsFilloutOpen(true)}
                  className="flex items-center justify-center gap-3 w-full py-5 px-6 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all text-blue-800 font-black uppercase text-xs tracking-widest"
                >
                  <FileText size={18} />
                  Add Proof Notes
                </button>
              </section>
            )}
          </div>

          {/* Right Column: Submit Review */}
          <div className="bg-plum/5 p-10 rounded-3xl border border-plum/10 relative">
            <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Clock size={16} /> 2. Submit Review
            </h3>

            {proof.can_upload ? (
              <div className="space-y-8">
                {uploadProgress !== null && (
                  <div className="absolute inset-0 bg-plum/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-12 text-paper rounded-3xl">
                    <Progress value={uploadProgress} className="w-full max-w-xs text-paper">
                      <ProgressLabel className="font-black uppercase tracking-widest text-xs opacity-80 mb-2 block">
                        Processing Manuscript...
                      </ProgressLabel>
                      <ProgressValue className="text-4xl font-black mb-4 block tracking-tighter" />
                      <ProgressTrack className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <ProgressIndicator className="bg-paper" />
                      </ProgressTrack>
                    </Progress>
                  </div>
                )}

                <div className="space-y-6">
                  {stagedFile ? (
                    <div className="bg-white p-8 rounded-2xl border-2 border-plum shadow-xl animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-plum text-paper rounded-xl">
                            <FileText size={24} />
                          </div>
                          <div>
                            <div className="font-black text-plum text-lg truncate max-w-[200px]">
                              {stagedFile.name}
                            </div>
                            <div className="text-[10px] font-black uppercase opacity-40">
                              Ready to advance
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setStagedFile(null)}
                          className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <Button
                        onClick={() => onUpload(stagedFile)}
                        className="w-full py-7 rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4 cursor-pointer"
                      >
                        <Send size={18} />
                        Submit and Advance
                      </Button>
                    </div>
                  ) : (
                    <div className="group relative">
                      <input
                        type="file"
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setStagedFile(file);
                        }}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full py-16 px-8 bg-white/50 border-2 border-dashed border-plum/20 rounded-3xl cursor-pointer hover:bg-white hover:border-plum transition-all group"
                      >
                        <div className="bg-plum/5 p-5 rounded-full mb-6 group-hover:scale-110 transition-transform">
                          <ArrowRight className="text-plum rotate-90" size={32} />
                        </div>
                        <span className="font-black text-plum text-xl tracking-tight mb-2">
                          Select Revised PDF
                        </span>
                        <span className="text-[10px] text-plum/40 uppercase font-black tracking-widest tracking-tighter text-center max-w-[200px]">
                          Selecting a file will stage it for final submission.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-plum/30 font-bold uppercase text-center leading-relaxed">
                    Submitting will move this proof to the next person in the workflow.{' '}
                    <br /> This action cannot be undone.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-8 flex flex-col items-center">
                <Clock size={48} className="text-plum/10 mb-6" />
                <p className="text-plum/50 font-serif italic text-xl leading-relaxed">
                  {proof.stage === 'done'
                    ? 'Workflow finalized. Manuscript is archived.'
                    : `Currently in review by ${proof.stage.replace('_', ' ')}.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
