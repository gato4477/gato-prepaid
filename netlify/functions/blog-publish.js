const crypto=require('crypto');
const owner='gato4477',repo='gato-prepaid';
const json=(status,obj)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(obj)});
const valid=(v)=>typeof v==='string'&&v.length>0;
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
exports.handler=async(event)=>{
if(event.httpMethod!=='POST')return json(405,{error:'POST만 허용합니다.'});
const token=process.env.GITHUB_BLOG_TOKEN,pass=process.env.BLOG_ADMIN_PASSWORD;
if(!token||!pass)return json(503,{error:'Netlify 환경 변수 GITHUB_BLOG_TOKEN, BLOG_ADMIN_PASSWORD 설정이 필요합니다.'});
const a=Buffer.from(event.headers['x-admin-password']||''),b=Buffer.from(pass);
if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return json(401,{error:'관리자 비밀번호가 틀렸습니다.'});
let data;try{data=JSON.parse(event.body||'{}')}catch{return json(400,{error:'입력 형식 오류'})}
const {title,slug,summary,html,published,images=[],coverName}=data;
if(!valid(title)||!valid(html)||!valid(slug)||!/^[a-z0-9가-힣-]{1,80}$/.test(slug)||title.length>200||html.length>250000||!Array.isArray(images)||images.length>25)return json(400,{error:'제목, 주소, HTML 또는 이미지 수를 확인하세요.'});
const api=async(path,method='GET',body)=>{const res=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+enc(path),{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'gato-blog-admin','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(res.status===404&&method==='GET')return null;const value=await res.json();if(!res.ok)throw Error('GitHub '+res.status+': '+(value.message||'오류'));return value};
const put=async(path,content,message)=>{const old=await api(path);return api(path,'PUT',{message,content:Buffer.from(content).toString('base64'),...(old?{sha:old.sha}:{})})};
try{
const oldPost=await api('blog/posts/'+slug+'.json');if(oldPost)return json(409,{error:'이미 사용 중인 글 주소입니다. 다른 주소를 입력하세요.'});
const folder='blog/images/'+slug;const uploaded=new Map();let cover=null;
for(let i=0;i<images.length;i++){const img=images[i];if(!valid(img.name)||!valid(img.content)||!/^image\/(png|jpeg|webp|gif)$/.test(img.type))return json(400,{error:'이미지 형식이 올바르지 않습니다.'});const bytes=Buffer.from(img.content,'base64');if(bytes.length>4*1024*1024)return json(413,{error:'이미지는 장당 4MB 이하만 가능합니다.'});const ext=({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[img.type];const name=String(i+1).padStart(2,'0')+'.'+ext;const path=folder+'/'+name;await api(path,'PUT',{message:'Add blog image '+slug,content:img.content});const url='/'+path;uploaded.set(img.name,url);if(img.name===coverName)cover=url;}
let body=html;const used=new Set();body=body.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2/gi,(full,start,q,src)=>{const key=decodeURIComponent(src.split('/').pop().split('?')[0]);if(uploaded.has(key)){used.add(key);return start+q+uploaded.get(key)+q}return full});
for(const [name,url] of uploaded){if(name===coverName||used.has(name))continue;body+='\n<figure><img src="'+url+'" alt="본문 이미지" loading="lazy" style="max-width:100%;height:auto"></figure>'}
const now=new Date().toISOString(),post={title,slug,summary:String(summary||'').slice(0,500),body_html:body,cover_path:cover||[...uploaded.values()][0]||null,published:!!published,published_at:published?now:null,created_at:now};
await put('blog/posts/'+slug+'.json',JSON.stringify(post,null,2),'Publish blog post '+slug);
const listFile=await api('blog/posts.json');let list=[];if(listFile){try{list=JSON.parse(Buffer.from(listFile.content.replace(/\n/g,''),'base64').toString('utf8'))}catch{throw Error('기존 글 목록 파일을 읽지 못했습니다.')}}
list.unshift({slug,title,summary:post.summary,cover_path:post.cover_path,published:post.published,published_at:post.published_at});await put('blog/posts.json',JSON.stringify(list,null,2),'Update blog listing '+slug);
return json(200,{ok:true,url:'/blog/post.html?slug='+encodeURIComponent(slug)});
}catch(e){return json(500,{error:e.message+' (일부 파일은 이미 저장되었을 수 있습니다.)'})}
};
