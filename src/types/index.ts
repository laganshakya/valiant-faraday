export type SkillCategory = 
  | 'Engineering'
  | 'Design'
  | 'Data Science'
  | 'Languages'
  | 'Career & Interviews'
  | 'Academics'
  | 'Music & Creative';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type SkillType = 'TEACHING' | 'LEARNING';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'SOS';

export type BountyStatus = 'OPEN' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED';

export type SessionStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type TransactionType = 
  | 'SIGNUP_BONUS'
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE'
  | 'SESSION_EARNING'
  | 'ESCROW_REFUND';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  twitter?: string;
}

export interface UserSkill {
  id: string;
  profile_id: string;
  skill_name: string;
  category: SkillCategory;
  skill_type: SkillType;
  proficiency_level: ProficiencyLevel;
  endorsements_count: number;
  years_experience: number;
  description?: string;
}

export interface Profile {
  id: string;
  auth_user_id?: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  headline: string;
  campus: string;
  city: string;
  credits_balance: number;
  credits_escrow: number;
  rating_avg: number;
  rating_count: number;
  badges: string[];
  social_links?: SocialLinks;
  skills?: UserSkill[];
  created_at?: string;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week?: number; // 0 (Sun) - 6 (Sat)
  start_time: string; // "14:00"
  end_time: string; // "18:00"
  is_recurring: boolean;
  specific_date?: string;
}

export interface HelpBounty {
  id: string;
  learner_id: string;
  learner?: Profile;
  title: string;
  description: string;
  skill_tag: string;
  category: SkillCategory;
  preferred_duration_min: 15 | 30 | 45 | 60;
  credits_offered: number;
  urgency: UrgencyLevel;
  status: BountyStatus;
  claimed_by_mentor_id?: string;
  mentor?: Profile;
  created_at: string;
}

export interface MentoringSession {
  id: string;
  learner_id: string;
  learner?: Profile;
  mentor_id: string;
  mentor?: Profile;
  bounty_id?: string;
  skill_name: string;
  duration_min: 15 | 30 | 45 | 60;
  credits_amount: number;
  scheduled_at: string;
  status: SessionStatus;
  meeting_room_id: string;
  shared_notes: string;
  code_scratchpad: string;
  learner_confirmed_complete: boolean;
  mentor_confirmed_complete: boolean;
  escrow_released: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  session_id: string;
  author_id: string;
  author?: Profile;
  recipient_id: string;
  recipient?: Profile;
  rating: number; // 1 - 5
  comment: string;
  skill_endorsed: string;
  tags: string[];
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  profile_id: string;
  session_id?: string;
  amount: number;
  type: TransactionType;
  note: string;
  created_at: string;
}
