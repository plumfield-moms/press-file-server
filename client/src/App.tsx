import { ProofDetail } from '@/components/ProofDetail';
import { StageColumn } from '@/components/StageColumn';
import { useMe, useProofs, useUploadNotesMutation, useUploadVersionMutation } from '@/hooks/useProofs';
import { isMockEnabled, MOCK_USERS, setMockUser } from '@/lib/mock';
import { caps } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';



const STAGES = ['ed', 'diane', 'sara', 'kristi', 'diane_2', 'done'] as const;

function App() {
  const [viewId, setViewId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();


  // Handle mock user changes reactively
  useEffect(() => {
    const handleMockUserChange = () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
    };
    window.addEventListener('mock-user-changed', handleMockUserChange);
    return () => {
      window.removeEventListener('mock-user-changed', handleMockUserChange);
    };
  }, [queryClient]);

  // Queries
  const { data: me, isLoading: isLoadingMe, error: meError } = useMe();
  const { data: proofs, isLoading: isLoadingProofs } = useProofs(!!me);

  // Mutations
  const uploadVersionMutation = useUploadVersionMutation();
  const uploadNotesMutation = useUploadNotesMutation();

  const handleUploadVersion = (file: File) => {
    if (!viewId) return;
    uploadVersionMutation.mutate(
      { id: viewId, file, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setUploadProgress(null);
          alert('Proof advanced to next stage!');
        },
        onError: (error: any) => {
          setUploadProgress(null);
          console.error('Upload failed:', error);
          const msg = error.response?.data?.detail || error.message;
          alert(`Upload Status: ${msg}`);
        },
      }
    );
  };

  const handleUploadNotes = (file: File) => {
    if (!viewId) return;
    uploadNotesMutation.mutate(
      { id: viewId, file },
      {
        onSuccess: () => {
          alert('Notes updated successfully!');
        },
        onError: (error: any) => {
          console.error('Notes upload failed:', error);
          alert(`Notes upload failed: ${error.response?.data?.detail || error.message}`);
        },
      }
    );
  };

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

  // Look up detail view proof from cached proofs list
  const selectedProof = viewId ? proofs?.find((p) => p.id === viewId) : null;

  return (
    <div className="min-h-screen bg-paper text-gray-800 font-sans">
      {/* Navigation Header */}
      <header className="bg-plum text-paper shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-xl font-black tracking-tighter cursor-pointer hover:opacity-80 transition flex items-center gap-2"
            onClick={() => setViewId(null)}
          >
            PLUMFIELD PRESS <span className="font-light italic opacity-60">Review</span>
          </h1>
          <div className="flex items-center gap-6">
            {isMockEnabled() && (
              <div className="flex items-center gap-2 bg-paper/10 px-3 py-1.5 rounded-md border border-paper/20">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Simulate:</span>
                <select
                  value={me.username}
                  onChange={(e) => setMockUser(e.target.value)}
                  className="bg-plum text-paper font-black text-xs uppercase tracking-widest outline-none border-none cursor-pointer p-0.5 rounded"
                >
                  {MOCK_USERS.map((u) => (
                    <option key={u.username} value={u.username} className="bg-plum text-paper font-sans">
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
              <User size={14} />
              {me.username}
            </div>
            {!isMockEnabled() && (
              <button
                onClick={() => (window.location.href = '/cdn-cgi/access/logout')}
                className="text-[10px] font-black uppercase tracking-widest border border-paper/30 px-3 py-1.5 rounded-md hover:bg-paper hover:text-plum transition-all cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {selectedProof ? (
          <ProofDetail
            proof={selectedProof}
            user={me}
            onBack={() => setViewId(null)}
            onUpload={handleUploadVersion}
            onUploadNotes={handleUploadNotes}
            uploadProgress={uploadProgress}
          />
        ) : (
          <div>
            <h2 className="text-5xl font-black text-plum mb-12 tracking-tighter">Dashboard</h2>
            {isLoadingProofs ? (
              <p className="text-center py-20 text-plum font-serif italic animate-pulse">Loading dashboard proofs...</p>
            ) : (
              <div className="flex flex-wrap gap-8 justify-center">
                {STAGES.map((stage) => (
                  <StageColumn
                    key={stage}
                    title={caps(stage.replace('_', ' '))}
                    proofs={proofs?.filter((p) => p.stage === stage) || []}
                    onView={setViewId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
