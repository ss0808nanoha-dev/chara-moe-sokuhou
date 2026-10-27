// Googleがスレッド一覧・キャラ一覧を発見できるよう、閲覧注意タグの付いていないスレッドの
// /t/ID と、そのスレッドが持つキャラ名タグの /c/名前 一覧をサイトマップとして返す
// （閲覧注意スレ・そこにしか出てこないキャラは意図的に含めない＝検索に出さない）

const SUPABASE_URL = "https://xflcbgsonmvvzbefbreq.supabase.co";
const SUPABASE_KEY = "sb_publishable_in8cVtZwe3SbE0l6Y3Jf2Q_awVX6mJY";
const SITE_URL = "https://chara-moe-sokuhou.com";

module.exports = async function handler(req, res) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/threads?caution_reason=is.null&select=id,chara_tag&order=id.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const threads = await r.json();

  const threadUrls = threads
    .map((t) => `  <url><loc>${SITE_URL}/t/${t.id}</loc></url>`)
    .join("\n");

  const charaNames = Array.from(
    new Set(threads.map((t) => t.chara_tag).filter(Boolean))
  );
  const charaUrls = charaNames
    .map((name) => `  <url><loc>${SITE_URL}/c/${encodeURIComponent(name)}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc></url>
${threadUrls}
${charaUrls}
</urlset>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.end(xml);
};
