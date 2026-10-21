import {client,ready,escapeHtml,postUrl,coverUrl,dateString} from './common.js';
const el=document.getElementById('blog-preview');
if(el && ready){
 const {data,error}=await client.from('blog_posts').select('slug,title,cover_path,published_at').eq('published',true).order('published_at',{ascending:false}).limit(4);
 if(error){el.innerHTML='<div class="blog-empty">블로그를 불러오지 못했습니다.</div>';console.error(error)}
 else if(data?.length) el.innerHTML=data.map(p=>`<a class="blog-card" href="${postUrl(p)}"><div class="blog-cover">${p.cover_path?`<img src="${coverUrl(p.cover_path)}" alt="" loading="lazy">`:''}</div><div class="blog-card-title">${escapeHtml(p.title)}</div><small>${dateString(p.published_at)}</small></a>`).join('');
}
