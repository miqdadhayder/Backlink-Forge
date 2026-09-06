import { supabase } from '@/lib/supabaseClient';

const entityNames = { Search: 'searches', Opportunity: 'opportunities', SavedOpportunity: 'saved_opportunities', EmailTemplate: 'email_templates', BacklinkGapAnalysis: 'backlink_gap_analyses', BacklinkGap: 'backlink_gaps', Competitor: 'competitors', SavedGapOpportunity: 'saved_gap_opportunities', SitemapAnalysis: 'sitemap_analyses', BacklinkQualityAnalysis: 'backlink_quality_analyses' };
const toSnake = (value) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const toClient = (record) => record ? ({ ...record.data, id: record.id, created_date: record.created_at, updated_date: record.updated_at }) : record;
const toStored = (value) => Object.fromEntries(Object.entries(value).map(([key, item]) => [toSnake(key), item]));

function entity(name) {
  const entityName = entityNames[name];
  if (!entityName) throw new Error(`Unknown entity: ${name}`);
  return {
    async list(order = '-created_date', limit = 100) { const descending = order.startsWith('-'); const { data, error } = await supabase.from('app_records').select('*').eq('entity', entityName).order(order.includes('updated') ? 'updated_at' : 'created_at', { ascending: !descending }).limit(limit); if (error) throw error; return (data || []).map(toClient); },
    async filter(filters) { let query = supabase.from('app_records').select('*').eq('entity', entityName); Object.entries(filters || {}).forEach(([key, value]) => { query = query.eq(`data->>${toSnake(key)}`, String(value)); }); const { data, error } = await query.order('created_at', { ascending: false }); if (error) throw error; return (data || []).map(toClient); },
    async get(id) { const { data, error } = await supabase.from('app_records').select('*').eq('entity', entityName).eq('id', id).single(); if (error) throw error; return toClient(data); },
    async create(value) { const { data, error } = await supabase.from('app_records').insert({ entity: entityName, data: toStored(value) }).select().single(); if (error) throw error; return toClient(data); },
    async bulkCreate(values) { const { data, error } = await supabase.from('app_records').insert((values || []).map((value) => ({ entity: entityName, data: toStored(value) }))).select(); if (error) throw error; return (data || []).map(toClient); },
    async update(id, value) { const current = await this.get(id); const { data, error } = await supabase.from('app_records').update({ data: { ...toStored(current), ...toStored(value) } }).eq('entity', entityName).eq('id', id).select().single(); if (error) throw error; return toClient(data); },
    async delete(id) { const { error } = await supabase.from('app_records').delete().eq('entity', entityName).eq('id', id); if (error) throw error; }
  };
}

export const base44 = { entities: new Proxy({}, { get: (_target, name) => entity(name) }), functions: { async invoke(name, body) { const { data: { session } } = await supabase.auth.getSession(); const response = await fetch(`/api/functions/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed'); return { data }; } } };
