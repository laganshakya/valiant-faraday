import { supabase } from './supabaseClient';
import type { 
  Profile, 
  UserSkill, 
  HelpBounty, 
  MentoringSession, 
  Review, 
  CreditTransaction 
} from '../types';

// Clear legacy mock localStorage if present
if (typeof window !== 'undefined') {
  const legacyKeys = [
    'skillswap_profiles_v1',
    'skillswap_skills_v1',
    'skillswap_bounties_v1',
    'skillswap_sessions_v1',
    'skillswap_reviews_v1',
    'skillswap_transactions_v1',
    'skillswap_active_user_id_v1'
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
}

export const DataService = {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    if (!supabase) return [];
    try {
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileErr || !profiles) {
        console.error('Error fetching profiles:', profileErr);
        return [];
      }

      const { data: skills } = await supabase.from('user_skills').select('*');
      const allSkills: UserSkill[] = skills || [];

      return profiles.map(p => ({
        ...p,
        skills: allSkills.filter(s => s.profile_id === p.id)
      }));
    } catch (err) {
      console.error('getProfiles failed:', err);
      return [];
    }
  },

  async getProfileById(id: string): Promise<Profile | null> {
    if (!supabase) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !profile) return null;

      const { data: skills } = await supabase
        .from('user_skills')
        .select('*')
        .eq('profile_id', id);

      return {
        ...profile,
        skills: skills || []
      };
    } catch (err) {
      console.error('getProfileById failed:', err);
      return null;
    }
  },

  async updateProfile(profileUpdate: Partial<Profile> & { id: string }): Promise<Profile> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileUpdate.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update profile');
    }
    return data;
  },

  // Skills
  async getSkills(profileId?: string): Promise<UserSkill[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('user_skills').select('*');
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('getSkills failed:', err);
      return [];
    }
  },

  async addSkill(skillInput: Omit<UserSkill, 'id'>): Promise<UserSkill> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const newSkill = {
      ...skillInput,
      endorsements_count: skillInput.endorsements_count || 0
    };

    const { data, error } = await supabase
      .from('user_skills')
      .insert(newSkill)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to add skill');
    }
    return data;
  },

  async deleteSkill(skillId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Failed to delete skill:', error);
      return false;
    }
    return true;
  },

  // Bounties
  async getBounties(): Promise<HelpBounty[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('help_bounties')
        .select(`
          *,
          learner:learner_id ( id, name, avatar_url, campus, city ),
          mentor:claimed_by_mentor_id ( id, name, avatar_url, campus, city )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching bounties:', error);
        return [];
      }
      return data as HelpBounty[];
    } catch (err) {
      console.error('getBounties failed:', err);
      return [];
    }
  },

  async createBounty(bountyInput: Omit<HelpBounty, 'id' | 'created_at' | 'status'>): Promise<HelpBounty> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const newBounty = {
      ...bountyInput,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('help_bounties')
      .insert(newBounty)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to post bounty');
    }
    return data as HelpBounty;
  },

  async claimBounty(bountyId: string, mentorId: string): Promise<MentoringSession> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // 1. Fetch bounty
    const { data: bounty, error: bErr } = await supabase
      .from('help_bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (bErr || !bounty) throw new Error('Bounty not found');
    if (bounty.status !== 'OPEN') throw new Error('This request has already been claimed or completed');
    if (bounty.learner_id === mentorId) throw new Error('You cannot claim your own help request');

    // 2. Book session without double-escrow deduction (credits already held in escrow)
    const newSession = await this.bookSession({
      learnerId: bounty.learner_id,
      mentorId: mentorId,
      skillName: bounty.skill_tag,
      durationMin: bounty.preferred_duration_min,
      scheduledAt: new Date(Date.now() + 10 * 60000).toISOString(),
      bountyId: bounty.id,
      alreadyEscrowed: true,
      initialNotes: `### Claimed from Help Wanted Board:\n- Title: ${bounty.title}\n- Description: ${bounty.description}`
    });

    // 3. Mark bounty as CLAIMED
    await supabase
      .from('help_bounties')
      .update({ status: 'CLAIMED', claimed_by_mentor_id: mentorId })
      .eq('id', bountyId);

    return newSession;
  },

  async cancelBounty(bountyId: string, learnerId: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch bounty
    const { data: bounty, error: bErr } = await supabase
      .from('help_bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (bErr || !bounty) throw new Error('Bounty not found');
    if (bounty.learner_id !== learnerId) throw new Error('You can only cancel your own help request');
    if (bounty.status !== 'OPEN') throw new Error('Cannot cancel a request that has already been claimed or completed');

    // 2. Refund escrow credits back to learner balance
    const learner = await this.getProfileById(learnerId);
    if (learner) {
      const refundAmount = bounty.credits_offered;
      await this.updateProfile({
        id: learner.id,
        credits_balance: Number((learner.credits_balance + refundAmount).toFixed(2)),
        credits_escrow: Math.max(0, Number((learner.credits_escrow - refundAmount).toFixed(2)))
      });

      // Record refund transaction
      await this.recordTransaction({
        profile_id: learner.id,
        amount: refundAmount,
        type: 'ESCROW_RELEASE',
        note: `Refunded escrow for cancelled request: "${bounty.title.substring(0, 30)}..."`
      });
    }

    // 3. Delete bounty record
    const { error: delErr } = await supabase
      .from('help_bounties')
      .delete()
      .eq('id', bountyId);

    if (delErr) {
      throw new Error(delErr.message || 'Failed to delete bounty record');
    }

    return true;
  },

  // Sessions
  async getSessions(userId?: string): Promise<MentoringSession[]> {
    if (!supabase) return [];
    try {
      let query = supabase
        .from('mentoring_sessions')
        .select(`
          *,
          learner:learner_id ( id, name, avatar_url, campus, city ),
          mentor:mentor_id ( id, name, avatar_url, campus, city )
        `)
        .order('scheduled_at', { ascending: false });

      if (userId) {
        query = query.or(`learner_id.eq.${userId},mentor_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.error('Error fetching sessions:', error);
        return [];
      }
      return data as MentoringSession[];
    } catch (err) {
      console.error('getSessions failed:', err);
      return [];
    }
  },

  async getSessionById(sessionId: string): Promise<MentoringSession | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .select(`
          *,
          learner:learner_id ( id, name, avatar_url, campus, city ),
          mentor:mentor_id ( id, name, avatar_url, campus, city )
        `)
        .or(`id.eq.${sessionId},meeting_room_id.eq.${sessionId}`)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return data as MentoringSession;
    } catch (err) {
      console.error('getSessionById failed:', err);
      return null;
    }
  },

  async bookSession(params: {
    learnerId: string;
    mentorId: string;
    skillName: string;
    durationMin: 15 | 30 | 45 | 60;
    scheduledAt: string;
    bountyId?: string;
    initialNotes?: string;
    alreadyEscrowed?: boolean;
  }): Promise<MentoringSession> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const creditsCost = params.durationMin / 60;

    // Move credits to Escrow only if not already held in escrow (e.g. at bounty creation)
    if (!params.alreadyEscrowed) {
      // Check learner balance
      const learner = await this.getProfileById(params.learnerId);
      if (!learner) throw new Error('Learner profile not found');
      if (learner.credits_balance < creditsCost) {
        throw new Error(`Insufficient credits. You need ${creditsCost.toFixed(2)} credits, but have ${learner.credits_balance.toFixed(2)}.`);
      }

      await this.updateProfile({
        id: learner.id,
        credits_balance: Number((learner.credits_balance - creditsCost).toFixed(2)),
        credits_escrow: Number((learner.credits_escrow + creditsCost).toFixed(2)),
      });
    }

    const roomId = 'room-' + Math.random().toString(36).substring(2, 9);
    const sessionPayload = {
      learner_id: params.learnerId,
      mentor_id: params.mentorId,
      bounty_id: params.bountyId || null,
      skill_name: params.skillName,
      duration_min: params.durationMin,
      credits_amount: creditsCost,
      scheduled_at: params.scheduledAt,
      status: 'CONFIRMED',
      meeting_room_id: roomId,
      shared_notes: params.initialNotes || `### Session Goals:\n- Topic: ${params.skillName}\n- Notes & takeaways:`,
      code_scratchpad: '',
      learner_confirmed_complete: false,
      mentor_confirmed_complete: false,
      escrow_released: false
    };

    const { data: newSession, error } = await supabase
      .from('mentoring_sessions')
      .insert(sessionPayload)
      .select(`
        *,
        learner:learner_id ( id, name, avatar_url, campus, city ),
        mentor:mentor_id ( id, name, avatar_url, campus, city )
      `)
      .single();

    if (error || !newSession) {
      throw new Error(error?.message || 'Failed to create session record');
    }

    // Record Escrow Hold transaction only if not already recorded during bounty creation
    if (!params.alreadyEscrowed) {
      await this.recordTransaction({
        profile_id: params.learnerId,
        session_id: newSession.id,
        amount: -creditsCost,
        type: 'ESCROW_HOLD',
        note: `Escrow hold for ${params.durationMin}m ${params.skillName} session`
      });
    }

    return newSession as MentoringSession;
  },

  async updateSessionContent(sessionId: string, sharedNotes: string, codeScratchpad: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('mentoring_sessions')
      .update({ shared_notes: sharedNotes, code_scratchpad: codeScratchpad })
      .eq('id', sessionId);
  },

  async confirmSessionCompletion(sessionId: string, userId: string): Promise<{ session: MentoringSession; escrowReleased: boolean }> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');

    const isLearner = session.learner_id === userId;
    const isMentor = session.mentor_id === userId;
    if (!isLearner && !isMentor) throw new Error('Unauthorized for this session');

    const learnerConfirmed = isLearner ? true : session.learner_confirmed_complete;
    const mentorConfirmed = isMentor ? true : session.mentor_confirmed_complete;

    const shouldReleaseEscrow = !session.escrow_released && (learnerConfirmed || (learnerConfirmed && mentorConfirmed));

    let updatedStatus = session.status;
    let escrowReleased = session.escrow_released;

    if (shouldReleaseEscrow) {
      updatedStatus = 'COMPLETED';
      escrowReleased = true;

      // 1. Release learner escrow
      const learner = await this.getProfileById(session.learner_id);
      if (learner) {
        await this.updateProfile({
          id: learner.id,
          credits_escrow: Math.max(0, Number((learner.credits_escrow - session.credits_amount).toFixed(2)))
        });
        await this.recordTransaction({
          profile_id: learner.id,
          session_id: session.id,
          amount: 0,
          type: 'ESCROW_RELEASE',
          note: `Completed session with ${session.mentor?.name || 'mentor'}`
        });
      }

      // 2. Deposit credits to mentor
      const mentor = await this.getProfileById(session.mentor_id);
      if (mentor) {
        await this.updateProfile({
          id: mentor.id,
          credits_balance: Number((mentor.credits_balance + session.credits_amount).toFixed(2))
        });
        await this.recordTransaction({
          profile_id: mentor.id,
          session_id: session.id,
          amount: session.credits_amount,
          type: 'SESSION_EARNING',
          note: `Earned ${session.credits_amount} credits for mentoring ${session.skill_name}`
        });
      }
    }

    const { data: updatedSession, error } = await supabase
      .from('mentoring_sessions')
      .update({
        learner_confirmed_complete: learnerConfirmed,
        mentor_confirmed_complete: mentorConfirmed,
        status: updatedStatus,
        escrow_released: escrowReleased
      })
      .eq('id', sessionId)
      .select(`
        *,
        learner:learner_id ( id, name, avatar_url, campus, city ),
        mentor:mentor_id ( id, name, avatar_url, campus, city )
      `)
      .single();

    if (error || !updatedSession) {
      throw new Error(error?.message || 'Failed to update session completion');
    }

    return { session: updatedSession as MentoringSession, escrowReleased: shouldReleaseEscrow };
  },

  // Reviews
  async getReviews(recipientId?: string): Promise<Review[]> {
    if (!supabase) return [];
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          author:author_id ( id, name, avatar_url, campus, city ),
          recipient:recipient_id ( id, name, avatar_url, campus, city )
        `)
        .order('created_at', { ascending: false });

      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Review[];
    } catch (err) {
      console.error('getReviews failed:', err);
      return [];
    }
  },

  async createReview(reviewInput: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Update recipient profile average rating and rating count
    const recipient = await this.getProfileById(reviewInput.recipient_id);
    if (recipient) {
      const newCount = recipient.rating_count + 1;
      const newAvg = Number(((recipient.rating_avg * recipient.rating_count + reviewInput.rating) / newCount).toFixed(2));
      await this.updateProfile({
        id: recipient.id,
        rating_count: newCount,
        rating_avg: newAvg
      });
    }

    // If skill endorsed, increment endorsement count
    if (reviewInput.skill_endorsed) {
      const { data: matchingSkills } = await supabase
        .from('user_skills')
        .select('*')
        .eq('profile_id', reviewInput.recipient_id)
        .ilike('skill_name', reviewInput.skill_endorsed);

      if (matchingSkills && matchingSkills.length > 0) {
        await supabase
          .from('user_skills')
          .update({ endorsements_count: matchingSkills[0].endorsements_count + 1 })
          .eq('id', matchingSkills[0].id);
      }
    }

    const { data: newReview, error } = await supabase
      .from('reviews')
      .insert({
        ...reviewInput,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        author:author_id ( id, name, avatar_url, campus, city ),
        recipient:recipient_id ( id, name, avatar_url, campus, city )
      `)
      .single();

    if (error || !newReview) {
      throw new Error(error?.message || 'Failed to submit review');
    }
    return newReview as Review;
  },

  // Transactions
  async getTransactions(profileId: string): Promise<CreditTransaction[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as CreditTransaction[];
    } catch (err) {
      console.error('getTransactions failed:', err);
      return [];
    }
  },

  async recordTransaction(txInput: Omit<CreditTransaction, 'id' | 'created_at'>): Promise<CreditTransaction> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        ...txInput,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to record transaction');
    }
    return data as CreditTransaction;
  }
};
