-- 登場回の媒体に「その他」(単行本のおまけ・雑誌での紹介など)を追加する。
-- 「その他」のときは volume 列を「出典」(例: 単行本18巻おまけ / 週刊少年マガジン2026年10号)として使う。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。

alter table chara_appearances drop constraint if exists chara_appearances_media_type_check;
alter table chara_appearances add constraint chara_appearances_media_type_check
  check (media_type is null or media_type in ('anime','manga','other'));
