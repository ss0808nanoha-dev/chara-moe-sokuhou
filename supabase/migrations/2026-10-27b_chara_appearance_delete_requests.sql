-- 登場回・活躍回の「削除依頼」機能
-- 間違えて投稿した場合などに、理由付きで削除依頼を出し、
-- 依頼者以外の3人が賛成(投票)すると自動的に削除される。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。

create table if not exists chara_appearance_delete_requests (
  id bigint generated always as identity primary key,
  appearance_id bigint not null references chara_appearances(id) on delete cascade,
  reason text not null,
  uid text not null,
  created_at timestamptz not null default now(),
  unique (appearance_id),
  constraint chara_appearance_delete_requests_reason_len check (char_length(reason) between 1 and 200)
);
create index if not exists chara_appearance_delete_requests_appearance_id_idx on chara_appearance_delete_requests (appearance_id);

create table if not exists chara_appearance_delete_votes (
  id bigint generated always as identity primary key,
  request_id bigint not null references chara_appearance_delete_requests(id) on delete cascade,
  uid text not null,
  created_at timestamptz not null default now(),
  unique (request_id, uid)
);
create index if not exists chara_appearance_delete_votes_request_id_idx on chara_appearance_delete_votes (request_id);

alter table chara_appearance_delete_requests enable row level security;
alter table chara_appearance_delete_votes enable row level security;

drop policy if exists "chara_appearance_delete_requests_select_all" on chara_appearance_delete_requests;
create policy "chara_appearance_delete_requests_select_all" on chara_appearance_delete_requests for select using (true);
drop policy if exists "chara_appearance_delete_requests_insert_all" on chara_appearance_delete_requests;
create policy "chara_appearance_delete_requests_insert_all" on chara_appearance_delete_requests for insert with check (true);

drop policy if exists "chara_appearance_delete_votes_select_all" on chara_appearance_delete_votes;
create policy "chara_appearance_delete_votes_select_all" on chara_appearance_delete_votes for select using (true);
-- 依頼した本人は自分の依頼に賛成票を入れられない(「他の誰か3人」を担保する)
drop policy if exists "chara_appearance_delete_votes_insert_not_requester" on chara_appearance_delete_votes;
create policy "chara_appearance_delete_votes_insert_not_requester" on chara_appearance_delete_votes for insert with check (
  uid <> (select r.uid from chara_appearance_delete_requests r where r.id = request_id)
);
