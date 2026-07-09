import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Proof, UserProfile } from '@/types';
import { isMockEnabled, getMockUser, getMockProofs, advanceMockProof, updateMockNotes } from '@/lib/mock';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      if (isMockEnabled()) {
        return getMockUser();
      }
      const res = await api.get<UserProfile>('/me');
      return res.data;
    },
    retry: false,
  });
}

export function useProofs(enabled: boolean = true) {
  return useQuery({
    queryKey: ['proofs'],
    queryFn: async () => {
      if (isMockEnabled()) {
        return getMockProofs();
      }
      const res = await api.get<Proof[]>('/proofs');
      return res.data;
    },
    enabled,
  });
}

export function useUploadVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      file,
      onProgress,
    }: {
      id: string;
      file: File;
      onProgress?: (progress: number | null) => void;
    }) => {
      if (isMockEnabled()) {
        // Simulate upload progress
        if (onProgress) {
          onProgress(10);
          await new Promise((resolve) => setTimeout(resolve, 200));
          onProgress(50);
          await new Promise((resolve) => setTimeout(resolve, 250));
          onProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        advanceMockProof(id);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      if (onProgress) onProgress(0);
      await api.post(`/proofs/${id}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : null;
          if (onProgress) onProgress(progress);
        },
        timeout: 600000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
    },
  });
}

export function useUploadNotesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      if (isMockEnabled()) {
        updateMockNotes(id, true);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/proofs/${id}/notes`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
    },
  });
}
