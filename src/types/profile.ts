export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  college_name: string;
  education: string;
  year: string;
  city: string;
  state: string;
  profile_image?: string;
  hobbies: string;
  votes: number;
  created_at: string;
}

export interface Vote {
  id: string;
  voter_id: string;
  voted_for_id: string;
  created_at: string;
}

export interface VoteState {
  lastVoteTime?: number;
  voteCount: number;
} 