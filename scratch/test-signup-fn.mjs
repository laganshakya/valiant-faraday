import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyunveiwwnknengdahox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g'
);

async function testEdgeSignup() {
  try {
    console.log('Testing Edge Function signup...');
    const res = await fetch('https://oyunveiwwnknengdahox.supabase.co/functions/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g'
      },
      body: JSON.stringify({
        email: 'lagan.test@cu.edu',
        password: 'Password123!',
        name: 'Lagan Shakya',
        campus: 'Chandigarh University'
      })
    });

    const json = await res.json();
    console.log('Edge Function response:', res.status, json);

    if (json.error) {
      throw new Error(json.error);
    }

    console.log('Now testing signInWithPassword directly...');
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: 'lagan.test@cu.edu',
      password: 'Password123!'
    });

    if (signInErr) throw signInErr;
    console.log('SIGN IN SUCCEEDED! User ID:', signInData.user?.id);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).single();
    console.log('Profile loaded! Name:', profile.name, 'Credits:', profile.credits_balance, 'Campus:', profile.campus);

    console.log('SUCCESS! Email rate limit completely bypassed and auto-confirmed!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    process.exit(0);
  }
}

testEdgeSignup();
