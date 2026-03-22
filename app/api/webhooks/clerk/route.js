 import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { supabase } from '../../../../lib/supabase';

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
    return new Response('Invalid webhook signature', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, username } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    await supabase.from('users').insert({
      clerk_id: id,
      email,
      username: username || `user_${id.slice(-8)}`,
      badge: 'larva',
      trust_level: 0,
    });
  }

  if (evt.type === 'user.updated') {
    const { id, username } = evt.data;
    await supabase.from('users').update({ username }).eq('clerk_id', id);
  }

  return new Response('OK', { status: 200 });
}
