-- Supabase SQL Editor에서 전체 실행. 아래 관리자 이메일을 실제 Supabase Auth 이메일로 변경하세요.
create table if not exists public.blog_posts (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique, title text not null, summary text not null default '',
 body_html text not null, cover_path text, published boolean not null default false,
 published_at timestamptz, created_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
create policy "public reads published posts" on public.blog_posts for select to anon using (published = true);
create policy "admin manages blog posts" on public.blog_posts for all to authenticated
 using ((auth.jwt() ->> 'email') = 'CHANGE_ME@example.com')
 with check ((auth.jwt() ->> 'email') = 'CHANGE_ME@example.com');
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('blog-images','blog-images',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
 on conflict (id) do nothing;
create policy "public reads blog images" on storage.objects for select to anon using (bucket_id = 'blog-images');
create policy "admin uploads blog images" on storage.objects for insert to authenticated
 with check (bucket_id = 'blog-images' and (auth.jwt() ->> 'email') = 'CHANGE_ME@example.com');
