import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, Clock, Download, FileText, Send, User, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Proof = {
  id: string;
  stage: string;
  can_upload: boolean;
  can_download: boolean;
  has_notes: boolean;
};

type UserProfile = {
  email: string;
  username: string;
  role: string;
};

const api = axios.create({
  baseURL: '/api',
});
function caps(string: string) {
  if (!string) return ""; // Handle empty strings
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function App() {
  const [viewId, setViewId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: me, isLoading: isLoadingMe, error: meError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<UserProfile>('/me');
      return res.data;
    },
    retry: false,
  });

  const { data: proofs, isLoading: isLoadingProofs } = useQuery({
    queryKey: ['proofs'],
    queryFn: async () => {
      const res = await api.get<Proof[]>('/proofs');
      return res.data;
    },
    enabled: !!me,
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress(0);
      await api.post(`/proofs/${id}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : null;
          setUploadProgress(progress);
        },
        timeout: 600000,
      });
    },
    onSuccess: () => {
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['proof', viewId] });
      alert('Proof advanced to next stage!');
    },
    onError: (error: any) => {
      setUploadProgress(null);
      console.error('Upload failed:', error);
      const msg = error.response?.data?.detail || error.message;
      alert(`Upload Status: ${msg}`);
    }
  });

  const uploadNotesMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/proofs/${id}/notes`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['proof', viewId] });
      alert('Notes updated successfully!');
    },
    onError: (error: any) => {
      console.error('Notes upload failed:', error);
      alert(`Notes upload failed: ${error.response?.data?.detail || error.message}`);
    }
  });

  if (isLoadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-plum">
        <p className="animate-pulse font-serif italic text-xl">Identifying user...</p>
      </div>
    );
  }

  if (meError || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-6">
        <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-xl w-full max-w-md text-center border-t-4 border-plum">
          <h1 className="text-3xl font-black mb-4 text-plum">Access Denied</h1>
          <p className="text-gray-700 mb-6 font-serif">You do not have permission to access this system.</p>
          <p className="text-xs text-gray-400">Please contact the administrator to authorize your email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-gray-800 font-sans">
      <header className="bg-plum text-paper shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-xl font-black tracking-tighter cursor-pointer hover:opacity-80 transition flex items-center gap-2"
            onClick={() => setViewId(null)}
          >
            PLUMFIELD PRESS <span className="font-light italic opacity-60">Review</span>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
              <User size={14} />
              {me.username}
            </div>
            <button
              onClick={() => window.location.href = '/cdn-cgi/access/logout'}
              className="text-[10px] font-black uppercase tracking-widest border border-paper/30 px-3 py-1.5 rounded-md hover:bg-paper hover:text-plum transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {viewId ? (
          <ProofDetail
            id={viewId}
            user={me}
            onBack={() => setViewId(null)}
            onUpload={(file) => uploadVersionMutation.mutate({ id: viewId, file })}
            onUploadNotes={(file) => uploadNotesMutation.mutate({ id: viewId, file })}
            uploadProgress={uploadProgress}
          />
        ) : (
          <div>
            <h2 className="text-5xl font-black text-plum mb-12 tracking-tighter">Dashboard</h2>
            <div className="flex flex-wrap pb-8 gap-8 -mx-6 px-6 no-scrollbar">
              {['ed', 'diane', 'sara', 'kristi', 'diane_2', 'done'].map(stage => (
                <StageColumn
                  key={stage}
                  title={caps(stage.replace('_', ' '))}
                  proofs={proofs?.filter(p => p.stage === stage) || []}
                  onView={setViewId}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StageColumn({ title, proofs, onView }: { title: string, proofs: Proof[], onView: (id: string) => void }) {
  return (
    <div className="w-[320px] shrink-0 flex flex-col">
      <h3 className="font-serif text-lg font-black mb-6 text-plum flex items-center justify-between border-b-2 border-plum/10 pb-2">
        <span>{title}</span>
        <span className="text-xs font-mono opacity-40">{proofs.length}</span>
      </h3>
      <div className="space-y-4">
        {proofs.map(proof => (
          <div
            key={proof.id}
            onClick={() => onView(proof.id)}
            className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-plum/5 shadow-sm hover:shadow-md hover:border-plum/20 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden"
          >
            {proof.has_notes && <div className="absolute top-0 right-0 w-2 h-full bg-blue-500/20" />}
            <div className="min-w-0 flex-1 mr-4">
              <div className="font-black text-gray-900 text-base group-hover:text-plum transition-colors truncate tracking-tight">{proof.id}</div>
              {proof.has_notes && <div className="text-[10px] text-blue-600 font-black uppercase mt-1 tracking-tighter">Editorial Notes attached</div>}
            </div>
            <ArrowRight size={18} className="text-plum/20 group-hover:text-plum group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        ))}
        {proofs.length === 0 && (
          <div className="text-plum/20 text-xs text-center py-12 font-serif italic border-2 border-dashed border-plum/10 rounded-2xl">
            No active proofs
          </div>
        )}
      </div>
    </div>
  );
}

function ProofDetail({ id, user, onBack, onUpload, onUploadNotes, uploadProgress }: { id: string, user: UserProfile, onBack: () => void, onUpload: (f: File) => void, onUploadNotes: (f: File) => void, uploadProgress: number | null }) {
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: proof, isLoading } = useQuery({
    queryKey: ['proof', id],
    queryFn: async () => {
      const res = await api.get<Proof>(`/proofs/${id}`);
      return res.data;
    },
  });

  if (isLoading || !proof) return <p className="text-center py-20 text-plum font-serif italic animate-pulse">Loading proof details...</p>;

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl border border-plum/10 overflow-hidden max-w-5xl mx-auto">
      <div className="bg-plum/5 p-4 border-b border-plum/10 flex justify-between items-center px-8">
        <button onClick={onBack} className="text-xs font-black text-plum hover:opacity-70 transition flex items-center gap-2 uppercase tracking-widest">
          &larr; Back
        </button>
        <span className="text-[10px] font-black text-plum/40 uppercase tracking-widest italic">Proof ID: {id}</span>
      </div>

      <div className="p-12">
        <div className="mb-16">
          <h2 className="text-6xl font-black text-plum mb-6 tracking-tighter leading-none">{id}</h2>
          <span className="px-6 py-2 bg-plum text-paper rounded-full text-xs font-black uppercase tracking-widest inline-block">
            Current Stage: {proof.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <section>
              <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Download size={16} /> 1. Retrieve Current
              </h3>
              <div className="space-y-4">
                {proof.can_download ? (
                  <a
                    href={`/api/proofs/${id}/download`}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-plum/5 bg-white text-plum transition-all group hover:shadow-lg hover:border-plum"
                    download
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-plum/5 group-hover:bg-plum group-hover:text-paper transition-all">
                        <Download size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none mb-1">Latest Version</span>
                        <span className="text-[10px] uppercase font-bold opacity-40">PDF Document</span>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="p-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-300 flex items-center gap-5 italic grayscale">
                    <Download size={24} className="opacity-20" />
                    <span className="text-sm font-bold uppercase tracking-widest">Restricted in this stage</span>
                  </div>
                )}

                {proof.has_notes && (
                  <a
                    href={`/api/proofs/${id}/notes`}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-blue-900 transition-all group hover:shadow-lg hover:border-blue-500"
                    download
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none mb-1">Editorial Notes</span>
                        <span className="text-[10px] uppercase font-bold opacity-40">DOCX Document</span>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </section>

            {(user.username === 'ed' || user.role === 'admin') && (
              <section className="pt-8 border-t border-plum/10">
                <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-6">Optional: Add Notes</h3>
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
          </div>

          <div className="bg-plum/5 p-10 rounded-3xl border border-plum/10 relative">
            <h3 className="text-sm font-black text-plum/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Clock size={16} /> 2. Submit Review
            </h3>

            {proof.can_upload ? (
              <div className="space-y-8">
                {uploadProgress !== null && (
                  <div className="absolute inset-0 bg-plum/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-12 text-paper rounded-3xl">
                    <div className="text-4xl font-black mb-8 tracking-tighter">{uploadProgress}%</div>
                    <div className="w-full max-w-xs h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                      <div className="bg-paper h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60 animate-pulse">Processing Manuscript...</p>
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
                            <div className="font-black text-plum text-lg truncate max-w-[200px]">{stagedFile.name}</div>
                            <div className="text-[10px] font-black uppercase opacity-40">Ready to advance</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setStagedFile(null)}
                          className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <button
                        onClick={() => onUpload(stagedFile)}
                        className="w-full py-5 bg-plum text-paper rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4"
                      >
                        <Send size={18} />
                        Submit and Advance
                      </button>
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
                        <span className="font-black text-plum text-xl tracking-tight mb-2">Select Revised PDF</span>
                        <span className="text-[10px] text-plum/40 uppercase font-black tracking-widest tracking-tighter text-center max-w-[200px]">Selecting a file will stage it for final submission.</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-plum/30 font-bold uppercase text-center leading-relaxed">
                    Submitting will move this proof to the next person in the workflow. <br /> This action cannot be undone.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-8 flex flex-col items-center">
                <Clock size={48} className="text-plum/10 mb-6" />
                <p className="text-plum/50 font-serif italic text-xl leading-relaxed">
                  {proof.stage === 'done'
                    ? "Workflow finalized. Manuscript is archived."
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

export default App;
