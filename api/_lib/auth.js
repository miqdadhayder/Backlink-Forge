import { createServerClient } from './supabase.js';

export async function requireUser(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  const supabase = createServerClient(request);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error('Authentication required');
    authError.statusCode = 401;
    throw authError;
  }
  return { user: data.user };
}

export function sendError(response, error) {
  const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  response.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
}
