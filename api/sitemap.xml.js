// Googleがスレッド一覧を発見できるよう、閲覧注意タグの付いていないスレッドの
// /t/ID 一覧をサイトマップとして返す（閲覧注意スレは意図的に含めない＝検索に出さない）

const SUPABASE_URL = "https://xflcbgsonmvvzbefbreq.supabase.co";
const SUPABASE_KEY = "sb_publishable_in8cVtZwe3SbE0l6Y3Jf2Q_awVX6mJY";
const SITE_URL = "https://chara-moe-sokuhou.com";

module.exports = async function handler(req, res) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/threads?caution_reason=is.null&select=id&order=id.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const threads = await r.json();

  const urls = threads
    .map((t) => `  <url><loc>${SITE_URL}/t/${t.id}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc></url>
${urls}
</urlset>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.end(xml);
};
