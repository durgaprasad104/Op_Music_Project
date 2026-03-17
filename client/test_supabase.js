import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxbqnmuobybzpfexpexr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4YnFubXVvYnlienBmZXhwZXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjIzNzIsImV4cCI6MjA4OTE5ODM3Mn0.NUxEvEKKtAAN5KBmW_PKFGwhUSy3AhxqQGJycchtBpI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  console.log('Testing Supabase save...');
  const { data, error } = await supabase.from('library').upsert({
    video_id: 'test_video_123',
    title: 'Test Title',
    channel: 'Test Channel',
    thumbnail: 'https://test.com/img.jpg',
    duration: '3:00'
  }, { onConflict: 'video_id' });
  
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Save successful:', data);
  }
}

testSave();
