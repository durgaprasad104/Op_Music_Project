const dns = require('dns');

console.log('Testing DNS resolution for Supabase domain...');

dns.lookup('dxbqnmuobybzpfexpexr.supabase.co', (err, address, family) => {
  if (err) {
    console.error('DNS Lookup failed:', err.message);
  } else {
    console.log(`Resolved IP: ${address} (IPv${family})`);
  }
});

console.log('Testing general internet connection (google.com)...');
dns.lookup('google.com', (err, address, family) => {
  if (err) {
    console.error('DNS Lookup google failed:', err.message);
  } else {
    console.log(`Google Resolved IP: ${address} (IPv${family})`);
  }
});
