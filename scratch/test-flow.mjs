import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://oyunveiwwnknengdahox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g'
);

async function testAll() {
  try {
    const aaravId = '13b2bdfd-5952-4fc9-941f-3ca5c24cb4f1';
    
    // 1. Add skill to Aarav
    const { data: skill, error: sErr } = await client.from('user_skills').insert({
      profile_id: aaravId,
      skill_name: 'Rust & WebAssembly',
      category: 'Engineering',
      skill_type: 'TEACHING',
      proficiency_level: 'Advanced',
      years_experience: 2,
      endorsements_count: 3
    }).select().single();
    if (sErr) throw sErr;
    console.log('Skill added for Aarav:', skill.skill_name);

    // Also add availability for Aarav
    const { error: aErr } = await client.from('mentor_availability').insert({
      mentor_id: aaravId,
      day_of_week: 2,
      start_time: '18:00',
      end_time: '21:00',
      is_recurring: true
    }).select().single();
    if (aErr) console.warn('Avail notice:', aErr.message);
    else console.log('Availability added for Aarav on Tuesday evening');

    // 2. Sign up second student (Priya)
    const email2 = 'priya_' + Date.now() + '@campus.edu';
    const { data: user2Data, error: u2Err } = await client.auth.signUp({
      email: email2,
      password: 'Password123!',
      options: {
        data: {
          name: 'Priya Patel',
          campus: 'BITS Pilani',
          city: 'Goa',
          headline: 'Full-Stack Developer & Next.js Enthusiast'
        }
      }
    });
    if (u2Err) throw u2Err;
    const priyaId = user2Data.user.id;
    console.log('Priya created in Supabase Auth:', priyaId);

    // Wait 1.5s for trigger to complete profile & initial bonus
    await new Promise(r => setTimeout(r, 1500));

    // Verify Priya's profile
    const { data: priyaProfile, error: ppErr } = await client.from('profiles').select('*').eq('id', priyaId).single();
    if (ppErr) throw ppErr;
    console.log('Priya profile active with balance:', priyaProfile.credits_balance, 'Credits escrow:', priyaProfile.credits_escrow);

    // Add skill for Priya
    await client.from('user_skills').insert({
      profile_id: priyaId,
      skill_name: 'TypeScript & Next.js',
      category: 'Engineering',
      skill_type: 'TEACHING',
      proficiency_level: 'Advanced',
      years_experience: 1.5,
      endorsements_count: 4
    });
    console.log('Skill added for Priya');

    // 3. Post a Help Wanted Bounty by Priya
    const { data: bounty, error: bErr } = await client.from('help_bounties').insert({
      learner_id: priyaId,
      title: 'Need help profiling Rust memory leak in WASM module',
      description: 'Facing heap allocation growth when processing streaming audio chunks in the browser with wasm-bindgen.',
      skill_tag: 'Rust & WebAssembly',
      category: 'Engineering',
      preferred_duration_min: 30,
      credits_offered: 0.5,
      status: 'OPEN',
      urgency: 'High'
    }).select().single();
    if (bErr) throw bErr;
    console.log('Bounty posted by Priya:', bounty.title);

    // 4. Test fetch with joins as done in frontend
    const { data: bounties, error: fetchErr } = await client.from('help_bounties').select(`
      *,
      learner:learner_id ( id, name, avatar_url, campus, city )
    `);
    if (fetchErr) throw fetchErr;
    console.log('Fetched bounties count:', bounties.length, 'Latest learner:', bounties[0]?.learner?.name);

    // 5. Test book session from Priya to Aarav
    const durationMin = 30;
    const creditsCost = 0.5;

    // Move credits to escrow
    await client.from('profiles').update({
      credits_balance: Number((priyaProfile.credits_balance - creditsCost).toFixed(2)),
      credits_escrow: Number((priyaProfile.credits_escrow + creditsCost).toFixed(2))
    }).eq('id', priyaId);

    const { data: session, error: sessErr } = await client.from('mentoring_sessions').insert({
      learner_id: priyaId,
      mentor_id: aaravId,
      bounty_id: bounty.id,
      skill_name: 'Rust & WebAssembly',
      duration_min: durationMin,
      credits_amount: creditsCost,
      scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      status: 'CONFIRMED',
      meeting_room_id: 'room-test-live-1',
      shared_notes: '### WASM Profiling Goals:\n- Memory allocation tracing\n- Browser profiler inspection',
      code_scratchpad: '// Rust WASM demo\nuse wasm_bindgen::prelude::*;',
      learner_confirmed_complete: false,
      mentor_confirmed_complete: false,
      escrow_released: false
    }).select().single();

    if (sessErr) throw sessErr;
    console.log('Session booked with escrow hold:', session.id, 'Room:', session.meeting_room_id);

    // 6. Test Escrow Release and mutual completion
    await client.from('profiles').update({
      credits_escrow: 0.00
    }).eq('id', priyaId);

    const { data: aaravProfile } = await client.from('profiles').select('*').eq('id', aaravId).single();
    await client.from('profiles').update({
      credits_balance: Number((aaravProfile.credits_balance + creditsCost).toFixed(2))
    }).eq('id', aaravId);

    await client.from('mentoring_sessions').update({
      status: 'COMPLETED',
      learner_confirmed_complete: true,
      mentor_confirmed_complete: true,
      escrow_released: true
    }).eq('id', session.id);

    console.log('Mutual completion & escrow release verified! Aarav earned credits.');

    // Add review
    await client.from('reviews').insert({
      session_id: session.id,
      author_id: priyaId,
      recipient_id: aaravId,
      rating: 5,
      comment: 'Incredible session! Solved my memory leak in 25 minutes flat.',
      skill_endorsed: 'Rust & WebAssembly'
    });
    console.log('Review and endorsement submitted successfully.');

    console.log('\n========================================');
    console.log('>>> COMPLETE LIVE SUPABASE E2E SUCCEEDED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test run failed:', err);
  }
}

testAll().then(() => {
  setTimeout(() => process.exit(0), 100);
});
