import { createClient } from '@supabase/supabase-js';
import { requireUser, sendError } from '../_lib/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const { user } = await requireUser(request);
    const email = user.email;
    if (!email) return response.status(422).json({ error: 'A verified email is required' });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return response.status(503).json({ error: 'Database is not configured' });

    const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const profile = { id: user.id, email, display_name: user.user_metadata?.full_name || null };
    const { data, error } = await admin.from('profiles').upsert(profile).select('id,email,display_name,role').single();
    if (error) throw error;
    return response.status(200).json(data);
  } catch (error) {
    return sendError(response, error);
  }
}
