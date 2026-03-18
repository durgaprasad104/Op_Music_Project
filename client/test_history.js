import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxbqnmuobybzpfexperx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4YnFubXVvYnlienBmZXhwZXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjIzNzIsImV4cCI6MjA4OTE5ODM3Mn0.NUxEvEKKtAAN5KBmW_PKFGwhUSy3AhxqQGJycchtBpI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Fetching history table...');
  const { data, error } = await supabase.from('history').select('*').limit(1);
  if (error) {
    console.error('Error with history fetch:', error);
  } else {
    console.log('history table exists!');
  }

  console.log('Fetching recently_played table...');
  const { data: data2, error: error2 } = await supabase.from('recently_played').select('*').limit(1);
  if (error2) {
    console.error('Error with recently_played fetch:', error2);
  } else {
    console.log('recently_played table exists!');
  }
}

checkTables();
