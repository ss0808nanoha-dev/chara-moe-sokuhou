-- スレッドに付けられるアンケート機能。
-- SNS(Threads/X)のポール投稿と連動して自動生成されるスレや、通常のスレ立てフォームから
-- 任意で質問文+選択肢(2〜4個)を設定でき、匿名で1人1票投票して得票率を見られるようにする。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。

create table if not exists thread_polls (
  id bigint generated always as identity primary key,
  thread_id bigint not null references threads(id) on delete cascade,
  question text,
  created_at timestamptz not null default now(),
  unique (thread_id),
  constraint thread_polls_question_len check (question is null or char_length(question) <= 100)
);
create index if not exists thread_polls_thread_id_idx on thread_polls (thread_id);

create table if not exists thread_poll_options (
  id bigint generated always as identity primary key,
  poll_id bigint not null references thread_polls(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  constraint thread_poll_options_label_len check (char_length(label) between 1 and 40)
);
create index if not exists thread_poll_options_poll_id_idx on thread_poll_options (poll_id);

create table if not exists thread_poll_votes (
  id bigint generated always as identity primary key,
  poll_id bigint not null references thread_polls(id) on delete cascade,
  option_id bigint not null references thread_poll_options(id) on delete cascade,
  uid text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, uid)
);
create index if not exists thread_poll_votes_option_id_idx on thread_poll_votes (option_id);

alter table thread_polls enable row level security;
alter table thread_poll_options enable row level security;
alter table thread_poll_votes enable row level security;

-- 他の投稿系テーブルと同じ公開ポリシー(誰でも閲覧・投稿できる)
drop policy if exists "thread_polls_select_all" on thread_polls;
create policy "thread_polls_select_all" on thread_polls for select using (true);
drop policy if exists "thread_polls_insert_all" on thread_polls;
create policy "thread_polls_insert_all" on thread_polls for insert with check (true);

drop policy if exists "thread_poll_options_select_all" on thread_poll_options;
create policy "thread_poll_options_select_all" on thread_poll_options for select using (true);
drop policy if exists "thread_poll_options_insert_all" on thread_poll_options;
create policy "thread_poll_options_insert_all" on thread_poll_options for insert with check (true);

drop policy if exists "thread_poll_votes_select_all" on thread_poll_votes;
create policy "thread_poll_votes_select_all" on thread_poll_votes for select using (true);
drop policy if exists "thread_poll_votes_insert_all" on thread_poll_votes;
create policy "thread_poll_votes_insert_all" on thread_poll_votes for insert with check (true);
