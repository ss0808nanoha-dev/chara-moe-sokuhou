-- 登場回・活躍回の「編集用合言葉」
-- 投稿した本人が、別の端末からでも合言葉を入力すれば編集できるようにする
-- (スレ立てのときの「スレ主合言葉」と同じ仕組み)。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。

alter table chara_appearances add column if not exists edit_password text;

-- これまでUPDATE用のポリシーが無かったので、編集(label/noteの書き換え)ができるように追加。
-- 誰が編集できるかはフロント側で絞っている(本人の端末・合言葉で確認済みの端末・管理者のみ)。
-- 他の列と同じ公開ポリシーに合わせている。
drop policy if exists "chara_appearances_update_all" on chara_appearances;
create policy "chara_appearances_update_all" on chara_appearances for update using (true) with check (true);

