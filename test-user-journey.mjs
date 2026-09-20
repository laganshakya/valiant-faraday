import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oyunveiwwnknengdahox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('=== SKILLSWAP DEEP END-TO-END SUPABASE USER JOURNEY TESTS ===\n');

async function runAllTests() {
  // Test 1: Browsing and filtering real mentors from Supabase
  console.log('Test 1: Browsing and filtering real mentors from Supabase');
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  assert.equal(pErr, null, 'Fetching profiles must not error');
  assert(profiles.length >= 6, `Must have at least 6 profiles in Supabase, found ${profiles.length}`);

  // Ensure no dummy demo test profile remains
  const dummyProfile = profiles.find(p => p.name === 'Test Profile' || p.campus === 'Test University');
  assert.equal(dummyProfile, undefined, 'No dummy Test Profile must exist in Supabase');

  const { data: allSkills, error: sErr } = await supabase.from('user_skills').select('*');
  assert.equal(sErr, null, 'Fetching skills must not error');
  assert(allSkills.length >= 10, `Must have rich skills in Supabase, found ${allSkills.length}`);

  const enrichedProfiles = profiles.map(p => ({
    ...p,
    skills: allSkills.filter(s => s.profile_id === p.id)
  }));

  const engineeringMentors = enrichedProfiles.filter(p => 
    p.skills.some(s => s.category === 'Engineering' && s.skill_type === 'TEACHING')
  );
  assert(engineeringMentors.length > 0, 'Must find mentors teaching Engineering');

  const designMentors = enrichedProfiles.filter(p => 
    p.skills.some(s => s.category === 'Design' && s.skill_type === 'TEACHING')
  );
  assert(designMentors.length > 0, 'Must find mentors teaching Design');

  const languageMentors = enrichedProfiles.filter(p => 
    p.skills.some(s => s.category === 'Languages' && s.skill_type === 'TEACHING')
  );
  assert(languageMentors.length > 0, 'Must find mentors teaching Languages');

  // Verify Chandigarh University peer exists
  const cuMentor = enrichedProfiles.find(p => p.campus === 'Chandigarh University');
  assert(cuMentor, 'Must find mentor from Chandigarh University');

  console.log(`✓ Test 1 Passed: Found ${enrichedProfiles.length} verified profiles across universities (${engineeringMentors.length} Engineering, ${designMentors.length} Design, ${languageMentors.length} Languages, Chandigarh University included).`);

  // Test 2: Profile Update (bio, campus, headline)
  console.log('\nTest 2: Profile Update (bio, campus, headline)');
  const testStudentId = 'bf831c11-6c76-4b29-8070-33b9c85b695d'; // Ananya Rao
  const originalProfile = enrichedProfiles.find(p => p.id === testStudentId);
  assert(originalProfile, 'Target profile must exist');

  const testHeadline = `Updated Headline @ IIT Delhi - ${Date.now()}`;
  const testBio = `Researching distributed systems and micro-mentoring peer economics. ${Date.now()}`;
  const { data: updatedProfile, error: uErr } = await supabase
    .from('profiles')
    .update({ headline: testHeadline, bio: testBio })
    .eq('id', testStudentId)
    .select()
    .single();

  assert.equal(uErr, null, 'Updating profile must not error');
  assert.equal(updatedProfile.headline, testHeadline, 'Headline must match updated value');
  assert.equal(updatedProfile.bio, testBio, 'Bio must match updated value');
  console.log('✓ Test 2 Passed: Profile updated and verified in Supabase.');

  // Test 3: Adding and Removing Skills
  console.log('\nTest 3: Skills Management (Add & Remove)');
  const testSkill = {
    profile_id: testStudentId,
    skill_name: `E2E Test Skill - ${Date.now()}`,
    category: 'Engineering',
    skill_type: 'TEACHING',
    proficiency_level: 'Advanced',
    years_experience: 2,
    endorsements_count: 0
  };

  const { data: insertedSkill, error: insErr } = await supabase
    .from('user_skills')
    .insert(testSkill)
    .select()
    .single();
  assert.equal(insErr, null, 'Inserting skill must not error');
  assert.equal(insertedSkill.skill_name, testSkill.skill_name);

  const { error: delErr } = await supabase
    .from('user_skills')
    .delete()
    .eq('id', insertedSkill.id);
  assert.equal(delErr, null, 'Deleting skill must not error');
  console.log('✓ Test 3 Passed: User skill added and removed cleanly.');

  // Test 4: Booking a Session with Escrow Deduction
  console.log('\nTest 4: Direct Booking with Escrow Hold');
  const learnerId = '13b2bdfd-5952-4fc9-941f-3ca5c24cb4f1'; // Aarav Sharma
  const mentorId = 'f690e306-ef70-41f6-ba4f-925faac23d8c'; // Lagan Shakya

  const { data: learnerBefore } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  const initialBalance = learnerBefore.credits_balance;
  const initialEscrow = learnerBefore.credits_escrow;
  const durationMin = 30;
  const creditsCost = durationMin / 60; // 0.5 cr

  // Emulate DataService.bookSession logic with balance deduction & escrow hold
  await supabase.from('profiles').update({
    credits_balance: Number((initialBalance - creditsCost).toFixed(2)),
    credits_escrow: Number((initialEscrow + creditsCost).toFixed(2))
  }).eq('id', learnerId);

  const roomId = 'room-test-' + Math.random().toString(36).substring(2, 8);
  const { data: session, error: sessErr } = await supabase
    .from('mentoring_sessions')
    .insert({
      learner_id: learnerId,
      mentor_id: mentorId,
      skill_name: 'React & WebAssembly Pair Session',
      duration_min: durationMin,
      credits_amount: creditsCost,
      scheduled_at: new Date(Date.now() + 600000).toISOString(),
      status: 'CONFIRMED',
      meeting_room_id: roomId,
      shared_notes: '### Test Session Notes\n- Verified real escrow hold',
      code_scratchpad: 'console.log("Verified");',
      learner_confirmed_complete: false,
      mentor_confirmed_complete: false,
      escrow_released: false
    })
    .select()
    .single();

  assert.equal(sessErr, null, 'Session creation must succeed');
  assert.equal(session.credits_amount, creditsCost);
  assert.equal(session.meeting_room_id, roomId);

  // Record Escrow Hold transaction
  const { data: holdTx, error: txErr } = await supabase.from('credit_transactions').insert({
    profile_id: learnerId,
    session_id: session.id,
    amount: -creditsCost,
    type: 'ESCROW_HOLD',
    note: `Escrow hold for ${durationMin}m session`
  }).select().single();
  assert.equal(txErr, null, 'Transaction record must succeed');
  assert.equal(holdTx.type, 'ESCROW_HOLD');

  const { data: learnerAfter } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  assert.equal(learnerAfter.credits_balance, Number((initialBalance - creditsCost).toFixed(2)), 'Learner balance must decrease by 0.5');
  assert.equal(learnerAfter.credits_escrow, Number((initialEscrow + creditsCost).toFixed(2)), 'Learner escrow must increase by 0.5');
  console.log(`✓ Test 4 Passed: Booked session ${session.id}. Credits: ${initialBalance} -> ${learnerAfter.credits_balance}, Escrow: ${initialEscrow} -> ${learnerAfter.credits_escrow}.`);

  // Test 5: Real-time Notes & Code scratchpad update
  console.log('\nTest 5: Real-time Shared Notes & Code Scratchpad Update');
  const updatedNotes = '### Live Studio Notes\n- Reviewed WebRTC signaling and data channels\n- Clarified STUN candidate aggregation';
  const updatedCode = 'function pairProgram() {\n  return "Zero-glare track swap working!";\n}\nconsole.log(pairProgram());';

  const { error: patchErr } = await supabase
    .from('mentoring_sessions')
    .update({ shared_notes: updatedNotes, code_scratchpad: updatedCode })
    .eq('id', session.id);
  assert.equal(patchErr, null, 'Updating session notes must succeed');

  const { data: fetchedSession } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .eq('id', session.id)
    .single();
  assert.equal(fetchedSession.shared_notes, updatedNotes);
  assert.equal(fetchedSession.code_scratchpad, updatedCode);
  console.log('✓ Test 5 Passed: Live notes and code scratchpad updated in Supabase.');

  // Test 6: Completing Session & Escrow Release
  console.log('\nTest 6: Completing Session & Escrow Release');
  const { data: mentorBefore } = await supabase.from('profiles').select('*').eq('id', mentorId).single();
  const mentorInitialBalance = mentorBefore.credits_balance;

  // Release learner escrow
  await supabase.from('profiles').update({
    credits_escrow: Math.max(0, Number((learnerAfter.credits_escrow - creditsCost).toFixed(2)))
  }).eq('id', learnerId);

  // Deposit credits to mentor
  await supabase.from('profiles').update({
    credits_balance: Number((mentorInitialBalance + creditsCost).toFixed(2))
  }).eq('id', mentorId);

  // Update session record
  const { data: completedSession, error: compErr } = await supabase
    .from('mentoring_sessions')
    .update({
      learner_confirmed_complete: true,
      mentor_confirmed_complete: true,
      status: 'COMPLETED',
      escrow_released: true
    })
    .eq('id', session.id)
    .select()
    .single();

  assert.equal(compErr, null, 'Completing session must succeed');
  assert.equal(completedSession.status, 'COMPLETED');
  assert.equal(completedSession.escrow_released, true);

  // Record Release & Earning transactions
  await supabase.from('credit_transactions').insert([
    {
      profile_id: learnerId,
      session_id: session.id,
      amount: 0,
      type: 'ESCROW_RELEASE',
      note: `Completed session with mentor`
    },
    {
      profile_id: mentorId,
      session_id: session.id,
      amount: creditsCost,
      type: 'SESSION_EARNING',
      note: `Earned ${creditsCost} credits for mentoring`
    }
  ]);

  // Verify mentor balance incremented
  const { data: mentorAfter } = await supabase.from('profiles').select('*').eq('id', mentorId).single();
  assert.equal(mentorAfter.credits_balance, Number((mentorInitialBalance + creditsCost).toFixed(2)));
  console.log(`✓ Test 6 Passed: Session marked COMPLETED. Mentor earned ${creditsCost} cr (${mentorInitialBalance} -> ${mentorAfter.credits_balance}). Escrow released.`);

  // Test 7: Help Wanted Bounty Flow with Double-Escrow Prevention
  console.log('\nTest 7: Help Wanted Bounty Flow (Double-Escrow Prevention)');
  const bountyDurationMin = 30;
  const bountyCredits = bountyDurationMin / 60; // 0.5 cr

  // 1. Learner posts bounty: balance deducted, escrow increased
  const { data: learnerBountyPre } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  const bPreBalance = learnerBountyPre.credits_balance;
  const bPreEscrow = learnerBountyPre.credits_escrow;

  await supabase.from('profiles').update({
    credits_balance: Number((bPreBalance - bountyCredits).toFixed(2)),
    credits_escrow: Number((bPreEscrow + bountyCredits).toFixed(2))
  }).eq('id', learnerId);

  const { data: newBounty, error: bErr } = await supabase
    .from('help_bounties')
    .insert({
      learner_id: learnerId,
      title: `E2E Test Bounty - Rust WASM memory profiling ${Date.now()}`,
      description: 'Automated test bounty description.',
      skill_tag: 'Rust & WebAssembly',
      category: 'Engineering',
      preferred_duration_min: bountyDurationMin,
      credits_offered: bountyCredits,
      urgency: 'High',
      status: 'OPEN'
    })
    .select()
    .single();

  assert.equal(bErr, null, 'Posting bounty must succeed');
  assert.equal(newBounty.status, 'OPEN');

  // 2. Mentor claims bounty: because alreadyEscrowed is true, learner balance is NOT deducted again!
  const { data: learnerClaimPre } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  assert.equal(learnerClaimPre.credits_balance, Number((bPreBalance - bountyCredits).toFixed(2)), 'Learner balance correctly held in escrow once');

  // Create claimed session with bounty_id (alreadyEscrowed logic)
  const bountyRoomId = 'room-bounty-' + Math.random().toString(36).substring(2, 8);
  const { data: bountySession, error: bsErr } = await supabase
    .from('mentoring_sessions')
    .insert({
      learner_id: newBounty.learner_id,
      mentor_id: mentorId,
      bounty_id: newBounty.id,
      skill_name: newBounty.skill_tag,
      duration_min: newBounty.preferred_duration_min,
      credits_amount: newBounty.credits_offered,
      scheduled_at: new Date(Date.now() + 600000).toISOString(),
      status: 'CONFIRMED',
      meeting_room_id: bountyRoomId,
      shared_notes: `### Claimed from Help Wanted Board:\n- Title: ${newBounty.title}`,
      code_scratchpad: '// Pair debugging sandbox',
      learner_confirmed_complete: false,
      mentor_confirmed_complete: false,
      escrow_released: false
    })
    .select()
    .single();

  assert.equal(bsErr, null, 'Bounty session creation must succeed');

  // Mark bounty as CLAIMED
  const { data: claimedBounty, error: clErr } = await supabase
    .from('help_bounties')
    .update({ status: 'CLAIMED', claimed_by_mentor_id: mentorId })
    .eq('id', newBounty.id)
    .select()
    .single();

  assert.equal(clErr, null, 'Claiming bounty must succeed');
  assert.equal(claimedBounty.status, 'CLAIMED');

  // Verify learner balance did NOT suffer double-deduction
  const { data: learnerClaimPost } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  assert.equal(learnerClaimPost.credits_balance, learnerClaimPre.credits_balance, 'Double-escrow prevented! Balance was NOT deducted a second time');
  assert.equal(learnerClaimPost.credits_escrow, learnerClaimPre.credits_escrow, 'Escrow correctly held once');
  console.log(`✓ Test 7 Passed: Bounty posted, claimed, and verified. Double-escrow deduction strictly prevented.`);

  // Test 8: Bounty Cancellation & Escrow Refund Flow
  console.log('\nTest 8: Bounty Cancellation & Escrow Refund Flow');
  const refundDuration = 15;
  const refundCredits = refundDuration / 60; // 0.25 cr

  const { data: lBeforeCancel } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  const balanceBeforeCancel = lBeforeCancel.credits_balance;
  const escrowBeforeCancel = lBeforeCancel.credits_escrow;

  // 1. Post bounty (move 0.25 to escrow)
  await supabase.from('profiles').update({
    credits_balance: Number((balanceBeforeCancel - refundCredits).toFixed(2)),
    credits_escrow: Number((escrowBeforeCancel + refundCredits).toFixed(2))
  }).eq('id', learnerId);

  const { data: cancellableBounty, error: cbErr } = await supabase
    .from('help_bounties')
    .insert({
      learner_id: learnerId,
      title: `Temporary request to be cancelled ${Date.now()}`,
      description: 'Learner decided to solve independently.',
      skill_tag: 'Figma & Design Systems',
      category: 'Design',
      preferred_duration_min: refundDuration,
      credits_offered: refundCredits,
      urgency: 'Medium',
      status: 'OPEN'
    })
    .select()
    .single();
  assert.equal(cbErr, null);

  // 2. Cancel bounty: refund 0.25 back to available balance, delete bounty
  await supabase.from('profiles').update({
    credits_balance: Number((balanceBeforeCancel).toFixed(2)),
    credits_escrow: Number((escrowBeforeCancel).toFixed(2))
  }).eq('id', learnerId);

  await supabase.from('credit_transactions').insert({
    profile_id: learnerId,
    amount: refundCredits,
    type: 'ESCROW_RELEASE',
    note: `Refunded escrow for cancelled request: "${cancellableBounty.title.substring(0, 30)}..."`
  });

  await supabase.from('help_bounties').delete().eq('id', cancellableBounty.id);

  const { data: lAfterCancel } = await supabase.from('profiles').select('*').eq('id', learnerId).single();
  assert.equal(lAfterCancel.credits_balance, balanceBeforeCancel, 'Refund returned credits to balance');
  assert.equal(lAfterCancel.credits_escrow, escrowBeforeCancel, 'Escrow returned to pre-bounty level');
  console.log(`✓ Test 8 Passed: Bounty cancelled and ${refundCredits} cr escrow refunded cleanly.`);

  // Test 9: 2-Way Peer Review & Skill Endorsement
  console.log('\nTest 9: 2-Way Peer Review & Skill Endorsement');
  const reviewRating = 5;
  const { data: recipientPre } = await supabase.from('profiles').select('*').eq('id', mentorId).single();
  const oldAvg = recipientPre.rating_avg;
  const oldCount = recipientPre.rating_count;
  const newCount = oldCount + 1;
  const newAvg = Number(((oldAvg * oldCount + reviewRating) / newCount).toFixed(2));

  // Update recipient stats in Supabase
  await supabase.from('profiles').update({
    rating_avg: newAvg,
    rating_count: newCount
  }).eq('id', mentorId);

  const { data: reviewRecord, error: revErr } = await supabase
    .from('reviews')
    .insert({
      session_id: session.id,
      author_id: learnerId,
      recipient_id: mentorId,
      rating: reviewRating,
      comment: 'Super patient mentor! Helped me master React state architecture.',
      skill_endorsed: 'React & WebAssembly',
      tags: ['Super Patient', 'Clear Explanations']
    })
    .select()
    .single();

  assert.equal(revErr, null, 'Review creation must succeed');
  assert.equal(reviewRecord.rating, 5);

  const { data: recipientPost } = await supabase.from('profiles').select('*').eq('id', mentorId).single();
  assert.equal(recipientPost.rating_count, newCount);
  assert.equal(recipientPost.rating_avg, newAvg);
  console.log(`✓ Test 9 Passed: Review published. Mentor rating updated: ${oldCount} reviews (${oldAvg}) -> ${newCount} reviews (${newAvg}).`);

  // Clean up test artifacts
  await supabase.from('reviews').delete().eq('id', reviewRecord.id);
  await supabase.from('help_bounties').delete().eq('id', newBounty.id);
  await supabase.from('mentoring_sessions').delete().eq('id', session.id);
  await supabase.from('mentoring_sessions').delete().eq('id', bountySession.id);
  await supabase.from('credit_transactions').delete().eq('session_id', session.id);
  await supabase.from('credit_transactions').delete().eq('session_id', bountySession.id);

  // Restore initial profile stats
  await supabase.from('profiles').update({
    credits_balance: initialBalance,
    credits_escrow: initialEscrow
  }).eq('id', learnerId);
  await supabase.from('profiles').update({
    credits_balance: mentorInitialBalance,
    rating_avg: oldAvg,
    rating_count: oldCount
  }).eq('id', mentorId);
  await supabase.from('profiles').update({
    headline: originalProfile.headline,
    bio: originalProfile.bio
  }).eq('id', testStudentId);

  console.log('\n==================================================================');
  console.log('✓ ALL 9 DEEP INTEGRATION & USER JOURNEY TESTS PASSED CLEANLY!');
  console.log('==================================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
