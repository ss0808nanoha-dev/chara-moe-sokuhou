-- 登場回・活躍回に「媒体(アニメ/漫画)」と「単行本の巻数」を記録できるようにする。
-- アニメと漫画で話数の数え方が違う、漫画だけでは何巻か分からない、という問題への対応。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容をそのまま実行してください。

alter table chara_appearances add column if not exists media_type text;
alter table chara_appearances add column if not exists volume text;

alter table chara_appearances drop constraint if exists chara_appearances_media_type_check;
alter table chara_appearances add constraint chara_appearances_media_type_check
  check (media_type is null or media_type in ('anime','manga'));
