import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, CheckCircle, Clock, ArrowRight, User, FileText } from 'lucide-react';

type Proof = {
  id: string;
  book_title: string;
  current_stage: 'ed' | 'diane' | 'sara' | 'done';
  created_at: number;
  files: {
    original: boolean;
    ed: boolean;
    diane: boolean;
    done: boolean;
    docx: boolean;
  };
};

const api = axios.create({
  baseURL: '/api',
});

function App() {
  const [viewId, setViewId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: me, isLoading: isLoadingMe, error: meError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<{ user: 'ed' | 'diane' | 'sara' | 'viewer' }>('/me');
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

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      await api.post(`/proofs/${id}/upload`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['proof', viewId] });
    },
  });

  const uploadDocxMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      await api.post(`/proofs/${id}/upload-docx`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['proof', viewId] });
    },
  });

  if (isLoadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-plum animate-pulse font-serif italic text-xl">Identifying user...</p>
      </div>
    );
  }

  if (meError || !me) {
    const errorData = (meError as any)?.response?.data;
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="bg-white/80 backdrop-blur p-8 rounded-lg shadow-xl w-96 text-center border-t-4 border-plum">
          <h1 className="text-3xl font-bold mb-4 text-plum">Access Denied</h1>
          <p className="text-gray-700 mb-2">You do not have permission to access this system.</p>
          <p className="text-sm text-gray-500 mb-6 font-mono bg-black/5 p-2 rounded">Authenticated as: {errorData?.email || 'Unknown'}</p>
          <p className="text-xs text-gray-400">Please contact the administrator to authorize your email.</p>
        </div>
      </div>
    );
  }

  const user = me.user;

  return (
    <div className="min-h-screen bg-paper text-gray-800">
      <header className="bg-plum text-paper shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 
            className="text-2xl font-black tracking-tight cursor-pointer hover:opacity-90 transition" 
            onClick={() => setViewId(null)}
          >
            Plumfield Press <span className="font-light opacity-80 italic">Review System</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="bg-paper/10 px-4 py-1 rounded-full border border-paper/20">
              <span className="text-sm font-medium">Logged in as: <strong className="uppercase">{user}</strong></span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {viewId ? (
          <ProofDetail 
            id={viewId} 
            user={user} 
            onBack={() => setViewId(null)} 
            onUpload={(formData) => uploadVersionMutation.mutate({ id: viewId, formData })}
            onUploadDocx={(formData) => uploadDocxMutation.mutate({ id: viewId, formData })}
          />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-10 border-b border-plum/10 pb-4">
              <h2 className="text-4xl font-black text-plum">Dashboard</h2>
            </div>

            {isLoadingProofs ? (
              <p className="text-center py-20 text-plum/50 font-serif italic">Loading proofs...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StageColumn 
                  title="Ed's Stage" 
                  proofs={proofs?.filter(p => p.current_stage === 'ed') || []} 
                  onView={setViewId}
                  color="plum"
                />
                <StageColumn 
                  title="Diane's Stage" 
                  proofs={proofs?.filter(p => p.current_stage === 'diane') || []} 
                  onView={setViewId}
                  color="plum"
                />
                <StageColumn 
                  title="Sara's Stage" 
                  proofs={proofs?.filter(p => p.current_stage === 'sara') || []} 
                  onView={setViewId}
                  color="plum"
                />
                <StageColumn 
                  title="Done" 
                  proofs={proofs?.filter(p => p.current_stage === 'done') || []} 
                  onView={setViewId}
                  color="plum"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StageColumn({ title, proofs, onView, color }: { title: string, proofs: Proof[], onView: (id: string) => void, color: string }) {
  return (
    <div className="bg-white/40 backdrop-blur-sm border border-plum/10 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <h3 className="font-serif text-xl font-bold mb-4 text-plum border-b border-plum/20 pb-2 flex justify-between items-center">
        <span>{title}</span>
        <span className="text-sm font-normal opacity-60">({proofs.length})</span>
      </h3>
      <div className="space-y-3 flex-grow">
        {proofs.map(proof => (
          <div 
            key={proof.id} 
            onClick={() => onView(proof.id)}
            className="bg-white p-4 rounded-lg border border-plum/5 shadow-sm hover:shadow-md hover:border-plum/20 cursor-pointer transition-all flex justify-between items-center group"
          >
            <div className="min-w-0 flex-1 mr-2">
              <div className="font-bold text-gray-900 text-base group-hover:text-plum transition-colors truncate" title={proof.book_title}>{proof.book_title}</div>
              <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                ID: {proof.id.slice(0, 6)}...
              </div>
            </div>
            <ArrowRight size={16} className="text-plum/30 group-hover:text-plum group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        ))}
        {proofs.length === 0 && (
          <div className="text-plum/30 text-xs text-center py-8 font-serif italic border-2 border-dashed border-plum/10 rounded-lg">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

function ProofDetail({ id, user, onBack, onUpload, onUploadDocx }: { id: string, user: string, onBack: () => void, onUpload: (f: FormData) => void, onUploadDocx: (f: FormData) => void }) {
  const { data: proof, isLoading } = useQuery({
    queryKey: ['proof', id],
    queryFn: async () => {
      const res = await api.get<Proof & { files: any }>(`/proofs/${id}`);
      return res.data;
    },
  });

  if (isLoading || !proof) return <p className="text-center py-20 text-plum font-serif italic">Loading details...</p>;

  const canUpload = proof.current_stage === user;

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-plum/10 overflow-hidden">
      <div className="bg-plum/5 p-4 border-b border-plum/10">
        <button onClick={onBack} className="text-sm font-bold text-plum hover:text-plum-light transition flex items-center gap-2 group">
          <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Dashboard
        </button>
      </div>

      <div className="p-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
          <div>
            <h2 className="text-5xl font-black text-plum mb-4 leading-tight">{proof.book_title}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-plum text-paper rounded-full text-xs font-black uppercase tracking-widest">
                Stage: {proof.current_stage}
              </span>
              <span className="px-4 py-1.5 bg-white border border-plum/10 text-gray-500 rounded-full text-xs font-semibold uppercase tracking-widest">
                Created {new Date(proof.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6 text-plum flex items-center gap-3">
              <Download size={24} className="opacity-50" />
              Manuscript Files
            </h3>
            <div className="space-y-4">
              <DownloadLink id={id} type="original" label="Original Manuscript" exists={proof.files.original} />
              <DownloadLink id={id} type="docx" label="Editorial Notes (Word)" exists={proof.files.docx} isDocx />
              
              {user === 'viewer' ? (
                <>
                  <DownloadLink id={id} type="ed" label="Ed's Edited Version" exists={proof.files.ed} />
                  <DownloadLink id={id} type="diane" label="Diane's Edited Version" exists={proof.files.diane} />
                  <DownloadLink id={id} type="done" label="Final Version" exists={proof.files.done} />
                </>
              ) : (
                <>
                  {user === 'ed' && proof.current_stage === 'ed' && <DownloadLink id={id} type="original" label="Original Manuscript" exists={proof.files.original} />}
                  {user === 'diane' && proof.current_stage === 'diane' && <DownloadLink id={id} type="ed" label="Ed's Edited Version" exists={proof.files.ed} />}
                  {user === 'sara' && proof.current_stage === 'sara' && <DownloadLink id={id} type="diane" label="Diane's Edited Version" exists={proof.files.diane} />}
                  
                  {!canUpload && proof.current_stage !== 'done' && (
                    <div className="text-center py-10 px-6 border border-plum/10 rounded-xl bg-paper/5">
                      <Clock size={40} className="mx-auto text-plum/20 mb-4" />
                      <p className="text-plum/60 font-serif italic text-lg leading-relaxed">
                        Files will be available here when it is your stage ({user}).
                      </p>
                    </div>
                  )}
                  {proof.current_stage === 'done' && (
                    <div className="space-y-4">
                      <DownloadLink id={id} type="ed" label="Ed's Edited Version" exists={proof.files.ed} />
                      <DownloadLink id={id} type="diane" label="Diane's Edited Version" exists={proof.files.diane} />
                      <DownloadLink id={id} type="done" label="Final Version" exists={proof.files.done} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white/80 p-8 rounded-2xl border border-plum/10 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 text-plum flex items-center gap-3">
              <Clock size={24} className="opacity-50" />
              Required Action
            </h3>
            {proof.current_stage === 'done' ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center gap-4 text-green-800">
                <CheckCircle size={32} className="text-green-600" />
                <div>
                  <div className="font-black text-lg uppercase tracking-tight">Review Complete</div>
                  <div className="text-sm opacity-80">The final manuscript has been finalized and archived.</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8 p-4 bg-paper/30 rounded-lg border border-plum/5">
                  <span className="text-xs font-black text-plum/50 uppercase tracking-widest mb-1 block">Status:</span>
                  <div className="font-bold text-plum text-xl flex items-center gap-2 uppercase tracking-tight">
                    Review Required by <span className="underline decoration-plum/30 underline-offset-4 capitalize">{proof.current_stage}</span>
                  </div>
                </div>

                {canUpload ? (
                  <div className="space-y-8">
                    {/* PDF Upload */}
                    <div className="space-y-4">
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept=".pdf"
                          id="file-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fd = new FormData();
                              fd.append('pdf', file);
                              onUpload(fd);
                            }
                          }}
                          className="hidden"
                        />
                        <label 
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full py-10 px-4 bg-white border-2 border-dashed border-plum/20 rounded-xl cursor-pointer hover:bg-plum/5 hover:border-plum transition-all group"
                        >
                          <div className="bg-plum/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <ArrowRight className="text-plum rotate-90" size={24} />
                          </div>
                          <span className="font-bold text-plum text-lg">Click to Upload Revised PDF</span>
                          <span className="text-xs text-gray-400 mt-2 font-medium">Accepts .pdf files only</span>
                        </label>
                      </div>
                      <div className="bg-plum text-paper p-4 rounded-lg text-xs font-medium text-center italic opacity-80 shadow-inner">
                        Uploading will automatically transition this proof to the next stage.
                      </div>
                    </div>

                    {/* DOCX Upload for Ed */}
                    {user === 'ed' && (
                      <div className="pt-6 border-t border-plum/10">
                        <h4 className="text-sm font-black text-plum/60 uppercase tracking-widest mb-4">Editorial Notes (Optional)</h4>
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept=".docx"
                            id="docx-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fd = new FormData();
                                fd.append('docx', file);
                                onUploadDocx(fd);
                              }
                            }}
                            className="hidden"
                          />
                          <label 
                            htmlFor="docx-upload"
                            className="flex items-center justify-center gap-3 w-full py-4 px-4 bg-paper/20 border border-plum/20 rounded-xl cursor-pointer hover:bg-plum/5 hover:border-plum transition-all group"
                          >
                            <FileText className="text-plum/60 group-hover:text-plum" size={20} />
                            <span className="font-bold text-plum/80 text-sm">{proof.files.docx ? 'Update Word Doc' : 'Upload Word Doc'}</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 px-6 border border-plum/10 rounded-xl bg-paper/5">
                    {user === 'viewer' ? <User size={40} className="mx-auto text-plum/20 mb-4" /> : <Clock size={40} className="mx-auto text-plum/20 mb-4" />}
                    <p className="text-plum/60 font-serif italic text-lg leading-relaxed">
                      {user === 'viewer' 
                        ? "You have read-only access to this proof."
                        : `You are in view-only mode. Waiting for ${proof.current_stage} to complete their review.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadLink({ id, type, label, exists, isDocx }: { id: string, type: string, label: string, exists: boolean, isDocx?: boolean }) {
  if (!exists) {
    if (type === 'docx') return null; // Don't show pending for docx if it doesn't exist
    
    return (
      <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-xl border border-gray-100 text-gray-300">
        <Download size={20} />
        <span className="text-sm font-bold uppercase tracking-widest">{label} <span className="text-[10px] font-normal italic opacity-60 ml-2">(Pending)</span></span>
      </div>
    );
  }

  return (
    <a 
      href={`/api/proofs/${id}/download/${type}`} 
      className={`flex items-center justify-between p-5 rounded-xl border transition-all group shadow-sm hover:shadow-md ${isDocx ? 'bg-blue-50/30 border-blue-100 text-blue-900 hover:border-blue-400' : 'bg-white border-plum/10 text-plum hover:border-plum'}`}
      download
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg transition-colors ${isDocx ? 'bg-blue-100 group-hover:bg-blue-600 group-hover:text-white' : 'bg-plum/10 group-hover:bg-plum group-hover:text-paper'}`}>
          {isDocx ? <FileText size={20} /> : <Download size={20} />}
        </div>
        <span className="text-base font-bold tracking-tight">{label}</span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter opacity-30 group-hover:opacity-100 transition-opacity">Download {isDocx ? 'DOCX' : 'PDF'}</span>
    </a>
  );
}

export default App;
