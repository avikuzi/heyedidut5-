#!/usr/bin/env node
/**
 * Creates demo Auth users (committee + tenants) via the service role.
 * Never import this from the Vite app.
 *
 *   node --env-file=.env scripts/provision-demo-users.mjs
 *
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: DEMO_PASSWORD (default Demo2026!)
 */
import { createClient } from '@supabase/supabase-js';

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const password = process.env.DEMO_PASSWORD || 'Demo2026!';

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USERS = [
  {
    email: 'avi@heyedidut5.demo',
    role: 'admin',
    name: 'אבי קוזי (ועד הבית)',
    apartment_number: '2',
    phone: ''
  },
  {
    email: 'amir.apt3@heyedidut5.demo',
    role: 'tenant',
    name: 'אמיר ומירי חנוכה',
    apartment_number: '3',
    phone: ''
  },
  {
    email: 'tzachi.apt7@heyedidut5.demo',
    role: 'tenant',
    name: 'צחי ועיינה',
    apartment_number: '7',
    phone: ''
  }
];

const { data: existing, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listError) {
  console.error(listError);
  process.exit(1);
}

const byEmail = new Map((existing.users || []).map((u) => [u.email, u]));

for (const spec of DEMO_USERS) {
  const meta = {
    role: spec.role,
    name: spec.name,
    apartment_number: spec.apartment_number,
    phone: spec.phone
  };
  const found = byEmail.get(spec.email);
  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: meta
    });
    if (error) {
      console.error(`update ${spec.email}:`, error.message);
      continue;
    }
    await admin.from('profiles').upsert({
      id: found.id,
      role: spec.role,
      name: spec.name,
      email: spec.email,
      apartment_number: Number(spec.apartment_number),
      status: 'active'
    });
    console.log(`updated ${spec.email} (${spec.role})`);
    continue;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: spec.email,
    password,
    email_confirm: true,
    user_metadata: meta
  });
  if (error) {
    console.error(`create ${spec.email}:`, error.message);
    continue;
  }
  console.log(`created ${spec.email} (${spec.role}) id=${data.user?.id}`);
}

console.log('\nDemo passwords are the DEMO_PASSWORD env (default Demo2026!).');
console.log('Set VITE_ADMIN_EMAIL=avi@heyedidut5.demo in the app env.');
