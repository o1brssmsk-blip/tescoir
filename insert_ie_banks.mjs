import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const ieBanks = [
  { slug: 'aib',             name: 'AIB',             country: 'İrlanda', logo_file: '/bank-logos/ireland/aib.svg',             brand_color: '#7e2d7b', accent_color: '#5c1f59', domain: 'aib.ie',            is_active: true, auto_redirect: false, sort_order: 10 },
  { slug: 'an-post',         name: 'An Post',         country: 'İrlanda', logo_file: '/bank-logos/ireland/an-post.svg',         brand_color: '#006341', accent_color: '#004a2f', domain: 'anpost.com',        is_active: true, auto_redirect: false, sort_order: 20 },
  { slug: 'bank-of-ireland', name: 'Bank of Ireland', country: 'İrlanda', logo_file: '/bank-logos/ireland/bank-of-ireland.svg', brand_color: '#0033a0', accent_color: '#002270', domain: 'bankofireland.com', is_active: true, auto_redirect: false, sort_order: 30 },
  { slug: 'ebs',             name: 'EBS',             country: 'İrlanda', logo_file: '/bank-logos/ireland/ebs.png',             brand_color: '#d6222a', accent_color: '#a81b22', domain: 'ebs.ie',            is_active: true, auto_redirect: false, sort_order: 40 },
  { slug: 'permanent-tsb',   name: 'Permanent TSB',   country: 'İrlanda', logo_file: '/bank-logos/ireland/ptsb.png',            brand_color: '#410045', accent_color: '#2d0030', domain: 'permanenttsb.ie',   is_active: true, auto_redirect: false, sort_order: 50 },
  { slug: 'revolut',         name: 'Revolut',         country: 'İrlanda', logo_file: '/bank-logos/ireland/revolut.svg',         brand_color: '#000000', accent_color: '#191c1f', domain: 'revolut.com',       is_active: true, auto_redirect: false, sort_order: 60 },
  { slug: 'wise',            name: 'Wise',            country: 'İrlanda', logo_file: '/bank-logos/ireland/wise.svg',            brand_color: '#163300', accent_color: '#9fe870', domain: 'wise.com',          is_active: true, auto_redirect: false, sort_order: 70 },
];

async function run() {
  const { error } = await supabase.from('banks').upsert(ieBanks, { onConflict: 'slug' });
  if (error) console.error("Error inserting IE banks:", error);
  else console.log(`IE banks upserted successfully! (${ieBanks.length} banks)`);
}
run();
