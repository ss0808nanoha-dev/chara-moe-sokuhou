-- 「登場回・活躍回」機能: キャラクタータブに紐づく投稿式エピソード帳 + 投票ランキング
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。
-- (このリポジトリの frontend は anon/publishable key で直接このテーブルを読み書きします)

create table if not exists chara_appearances (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  chara_tag text not null,
  label text not null,
  note text,
  uid text not null,
  constraint chara_appearances_label_len check (char_length(label) between 1 and 60),
  constraint chara_appearances_note_len check (note is null or char_length(note) <= 200)
);
create index if not exists chara_appearances_chara_tag_idx on chara_appearances (chara_tag);

create table if not exists chara_appearance_votes (
  id bigint generated always as identity primary key,
  appearance_id bigint not null references chara_appearances(id) on delete cascade,
  uid text not null,
  created_at timestamptz not null default now(),
  unique (appearance_id, uid)
);
create index if not exists chara_appearance_votes_appearance_id_idx on chara_appearance_votes (appearance_id);

alter table chara_appearances enable row level security;
alter table chara_appearance_votes enable row level security;

-- 誰でも閲覧・投稿できる(他の投稿系テーブルと同じ公開ポリシー)。
-- 削除はフロント側で管理者モードのみに絞っているが、DBレベルでは制限していない
-- (threads/posts など既存テーブルと同じ運用に合わせている)。
drop policy if exists "chara_appearances_select_all" on chara_appearances;
create policy "chara_appearances_select_all" on chara_appearances for select using (true);
drop policy if exists "chara_appearances_insert_all" on chara_appearances;
create policy "chara_appearances_insert_all" on chara_appearances for insert with check (true);
drop policy if exists "chara_appearances_delete_all" on chara_appearances;
create policy "chara_appearances_delete_all" on chara_appearances for delete using (true);

drop policy if exists "chara_appearance_votes_select_all" on chara_appearance_votes;
create policy "chara_appearance_votes_select_all" on chara_appearance_votes for select using (true);
drop policy if exists "chara_appearance_votes_insert_all" on chara_appearance_votes;
create policy "chara_appearance_votes_insert_all" on chara_appearance_votes for insert with check (true);
