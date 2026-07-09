import { Proof, UserProfile } from '@/types';

export const MOCK_USERS: UserProfile[] = [
  { username: 'ed', email: 'ed@plumfieldpress.com', role: 'user' },
  { username: 'diane', email: 'diane@plumfieldpress.com', role: 'user' },
  { username: 'sara', email: 'sara@plumfieldpress.com', role: 'user' },
  { username: 'kristi', email: 'kristi@plumfieldpress.com', role: 'user' },
  { username: 'admin', email: 'admin@plumfieldpress.com', role: 'admin' },
];

const STAGE_OWNERS: Record<string, string | null> = {
  ed: 'ed',
  diane: 'diane',
  sara: 'sara',
  kristi: 'kristi',
  diane_2: 'diane',
  done: null,
};

const STAGES = ['ed', 'diane', 'sara', 'kristi', 'diane_2', 'done'];

export const isMockEnabled = () => {
  return import.meta.env.VITE_MOCK_DATA === 'true';
};

export function getMockUser(): UserProfile {
  const username = localStorage.getItem('mock_user_username') || 'ed';
  return MOCK_USERS.find((u) => u.username === username) || MOCK_USERS[0];
}

export function setMockUser(username: string) {
  localStorage.setItem('mock_user_username', username);
  window.dispatchEvent(new Event('mock-user-changed'));
}

export function getMockProofs(): Proof[] {
  const user = getMockUser();
  const raw = localStorage.getItem('mock_proofs');
  let proofsList: Omit<Proof, 'can_upload' | 'can_download'>[];

  if (!raw) {
    proofsList = [
      {
        id: 'the-secret-garden-review',
        stage: 'ed',
        has_notes: true,
        has_txt: false,
      },
    ];
    localStorage.setItem('mock_proofs', JSON.stringify(proofsList));
  } else {
    proofsList = JSON.parse(raw);
  }

  return proofsList.map((p) => {
    const owner = STAGE_OWNERS[p.stage];
    const can_upload = user.role === 'admin' || (user.username === owner && p.stage !== 'done');
    const can_download = user.role === 'admin' || user.username === owner || p.stage === 'done';
    return {
      ...p,
      can_upload,
      can_download,
    } as Proof;
  });
}

export function advanceMockProof(id: string) {
  const proofs = getMockProofs();
  const index = proofs.findIndex((p) => p.id === id);
  if (index !== -1) {
    const currentStage = proofs[index].stage;
    const stageIdx = STAGES.indexOf(currentStage);
    if (stageIdx !== -1 && stageIdx < STAGES.length - 1) {
      proofs[index].stage = STAGES[stageIdx + 1];
      localStorage.setItem('mock_proofs', JSON.stringify(proofs));
    }
  }
}

export function updateMockNotes(id: string, hasNotes: boolean) {
  const proofs = getMockProofs();
  const index = proofs.findIndex((p) => p.id === id);
  if (index !== -1) {
    proofs[index].has_notes = hasNotes;
    localStorage.setItem('mock_proofs', JSON.stringify(proofs));
  }
}
