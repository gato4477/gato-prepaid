const $=id=>document.getElementById(id);let changed=false;
function slugify(s){return s.toLowerCase().trim().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'post'}
$('title').addEventListener('input',()=>{if(!changed)$('slug').value=slugify($('title').value)});
$('slug').addEventListener('input',()=>changed=true);
const toBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)});
$('submit').onclick=async()=>{const btn=$('submit'),msg=$('msg');btn.disabled=true;msg.textContent='저장 중입니다. 창을 닫지 마세요.';try{
const title=$('title').value.trim(),slug=slugify($('slug').value),html=$('html').value.trim(),password=$('password').value;
if(!title||!html||!password)throw Error('비밀번호, 제목, HTML 소스를 입력하세요.');
const files=[...$('images').files];if($('cover').files[0])files.push($('cover').files[0]);
if(files.length>25)throw Error('이미지는 한 번에 25장 이하로 선택해 주세요.');
const images=[];for(const file of files){if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error('JPG, PNG, WEBP, GIF만 가능합니다.');if(file.size>4*1024*1024)throw Error(file.name+' 파일은 4MB 이하여야 합니다.');images.push({name:file.name,content:await toBase64(file),type:file.type});}
const safe=DOMPurify.sanitize(html,{FORBID_TAGS:['script','iframe','object','embed','form','input','button','style','link','meta','base','svg','math'],FORBID_ATTR:['srcdoc'],ALLOW_DATA_ATTR:false});
const res=await fetch('/.netlify/functions/blog-publish',{method:'POST',headers:{'content-type':'application/json','x-admin-password':password},body:JSON.stringify({title,slug,summary:$('summary').value.trim(),html:safe,published:$('published').checked,images,coverName:$('cover').files[0]?.name||null})});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'저장 오류 '+res.status);msg.textContent='저장 완료! GitHub에 반영됐습니다. Netlify 배포가 끝나면 블로그에서 확인할 수 있어요.';if(data.url)msg.textContent+='\n글 주소: '+location.origin+data.url;
}catch(e){msg.textContent='저장 실패: '+e.message}finally{btn.disabled=false}};
