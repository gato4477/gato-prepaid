import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, ready } from './config.js';
export const client = ready ? createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null;
export const escapeHtml = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const slugify = s => String(s).toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,80) || 'post';
export const postUrl = p => '/blog/post.html?slug='+encodeURIComponent(p.slug);
export const coverUrl = path => path ? `${SUPABASE_URL}/storage/v1/object/public/blog-images/${path.split('/').map(encodeURIComponent).join('/')}` : '';
export const dateString = date => new Date(date).toLocaleDateString('ko-KR');
