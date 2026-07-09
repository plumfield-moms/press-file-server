export interface Proof {
  id: string;
  stage: string;
  can_upload: boolean;
  can_download: boolean;
  has_notes: boolean;
  has_txt: boolean;
}

export interface UserProfile {
  email: string;
  username: string;
  role: string;
}
