import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret missing', { status: 400 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid webhook signature', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, username } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    const { error } = await supabase.from('users').insert({
      id,
      clerk_id: id,
      email,
      username: username || `user_${id.slice(-8)}`,
      badge: 'member',
      trust_level: 0,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify(error), { status: 500 });
    }
  }

  if (evt.type === 'user.updated') {
    const { id, username } = evt.data;
    await supabase.from('users').update({ username }).eq('clerk_id', id);
  }

  return new Response('OK', { status: 200 });
}