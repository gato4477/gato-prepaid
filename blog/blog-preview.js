// Load latest published posts from the GitHub-backed blog, not Supabase.
const el=document.getElementById('blog-preview');
if(el){
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 fetch('/blog/posts.json?ts='+Date.now()).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(posts=>{
  const shown=posts.filter(p=>p.published).slice(0,4);
  el.innerHTML=shown.length?shown.map(p=>`<a class="blog-card" href="/blog/post.html?slug=${encodeURIComponent(p.slug)}"><div class="blog-cover">${p.cover_path?`<img src="${encodeURI(p.cover_path)}" alt="" loading="lazy">`:''}</div><div class="blog-card-title">${escape(p.title)}</div><small>${p.published_at?new Date(p.published_at).toLocaleDateString('ko-KR'):''}</small></a>`).join(''):'<div class="blog-empty">게시된 글이 없습니다.</div>';
 }).catch(err=>{console.error('Blog preview failed',err);el.innerHTML='<div class="blog-empty">글을 불러오지 못했습니다.</div>'});
}
