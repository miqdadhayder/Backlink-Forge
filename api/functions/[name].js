import { createClient } from '@supabase/supabase-js';
import { generateOpportunities } from '../../base44/shared/backlinkService.ts';
import { analyzeBacklink } from '../../base44/shared/backlinkQualityService.ts';
import { safeUrl } from '../../base44/shared/sitemap/urlNormalizer.ts';
import { requireUser, sendError } from '../_lib/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const name = request.query?.name;
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    let user = null;
    try { user = (await requireUser(request)).user; } catch (error) { if (!['generateOpportunities', 'analyzeBacklinkQuality'].includes(name)) throw error; }
    if (name === 'generateOpportunities') {
      const result = await generateOpportunities(body);
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const search = await admin.from('app_records').insert({ user_id: user.id, entity: 'searches', data: { website_url: body.website_url, keyword: body.keyword, country: body.country || 'Global', backlink_type: body.backlink_type || 'All Opportunities', opportunities_found: result.opportunities.length, is_demo: result.is_demo } }).select('id').single();
        if (!search.error && result.opportunities.length) await admin.from('app_records').insert(result.opportunities.map((opportunity) => ({ user_id: user.id, entity: 'opportunities', data: { ...opportunity, search_id: search.data.id } })));
      }
      return response.status(200).json({ ...result, search_id: null });
    }
    if (name !== 'analyzeBacklinkQuality') return response.status(404).json({ error: 'Function not migrated yet' });
    const backlinkUrl = body.backlink_url && (body.backlink_url.startsWith('http') ? body.backlink_url : `https://${body.backlink_url}`);
    if (!backlinkUrl || !safeUrl(backlinkUrl)) return response.status(400).json({ error: 'Please enter a valid backlink URL.' });
    const result = { report: await analyzeBacklink({ website_url: body.website_url || '', backlink_url: backlinkUrl, target_url: body.target_url || null, anchor_text: body.anchor_text || null }) };
    if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await admin.from('app_records').insert({ user_id: user.id, entity: 'backlink_quality_analyses', data: { ...body, overall_score: result.report.overall_score, report_json: result.report } });
    }
    return response.status(200).json(result);
  } catch (error) {
    return sendError(response, error);
  }
}
