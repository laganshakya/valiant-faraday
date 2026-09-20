import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyunveiwwnknengdahox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g'
);

async function testAlreadyExists() {
  try {
    console.log('Testing Edge Function with existing user hariomshakya1080@gmail.com...');
    const { data: fnData, error: fnError } = await supabase.functions.invoke('signup', {
      body: {
        email: 'hariomshakya1080@gmail.com',
        password: 'Password123!',
        name: 'Lagan Shakya',
        campus: 'Chandigarh University'
      }
    });

    console.log('fnData:', fnData);
    console.log('fnError:', fnError);

    if (fnData?.alreadyExists) {
      console.log('Handling alreadyExists: attempting direct sign in...');
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: 'hariomshakya1080@gmail.com',
        password: 'Password123!'
      });

      if (signInErr) throw signInErr;
      console.log('DIRECT SIGN IN SUCCEEDED! User ID:', signInData.user.id);
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    process.exit(0);
  }
}
testAlreadyExists();
