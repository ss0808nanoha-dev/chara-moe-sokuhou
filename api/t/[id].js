// 検索エンジン向けに、スレッド内容を実際のHTMLとして返すサーバー関数。
// index.html側は #t=ID のハッシュ付きURLでスレを表示するが、ハッシュ以降は
// クローラーに別ページとして認識されないため、Googleに個別スレが出ない問題があった。
// /t/ID という(ハッシュを使わない)URLでこの関数を呼び出し、スレ内容を直接HTMLで返す。
//
// 閲覧注意タグが付いているスレだけは、検索に出したくないという要望のため、
// 従来通りハッシュ付きURL(#t=ID)へリダイレクトして、この仕組みの対象から外す。

const SUPABASE_URL = "https://xflcbgsonmvvzbefbreq.supabase.co";
const SUPABASE_KEY = "sb_publishable_in8cVtZwe3SbE0l6Y3Jf2Q_awVX6mJY";
const SITE_URL = "https://chara-moe-sokuhou.com";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function fetchThread(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/threads?id=eq.${id}&select=id,title,work_tag,chara_tag,cat,caution_reason`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await res.json();
  return rows[0] || null;
}

async function fetchPosts(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?thread_id=eq.${id}&deleted=eq.false&select=name,body,ts&order=id.asc&limit=50`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  return res.json();
}

module.exports = async function handler(req, res) {
  try {
  const id = Number(req.query.id);
  if (!id) {
    res.statusCode = 404;
    res.end("Not found: " + JSON.stringify(req.query));
    return;
  }

  const thread = await fetchThread(id);
  if (!thread) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<!doctype html><html><body>スレッドが見つかりません</body></html>");
    return;
  }

  if (thread.caution_reason) {
    res.statusCode = 302;
    res.setHeader("Location", `/#t=${id}`);
    res.end();
    return;
  }

  const posts = await fetchPosts(id);
  const tagLine = [thread.work_tag, thread.chara_tag].filter(Boolean).join(" ");
  const pageTitle = `${thread.title}${tagLine ? `【${tagLine}】` : ""} - キャラ萌え速報`;
  const description = (posts[0] && posts[0].body ? posts[0].body : thread.title || "").slice(0, 120);

  const postsHtml = posts
    .map(
      (p) => `
      <div class="post">
        <div class="pname">${esc(p.name || "萌えてる匿名さん")}</div>
        <div class="pbody">${esc(p.body || "").replace(/\n/g, "<br>")}</div>
      </div>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}/t/${id}">
<link rel="canonical" href="${SITE_URL}/t/${id}">
<style>
*{box-sizing:border-box}
body{font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;background:#fff4f0;color:#222;max-width:680px;margin:0 auto;padding:16px;line-height:1.6}
h1{font-size:19px;color:#c04a00;margin-bottom:4px}
.tags{color:#e05a00;font-size:13px;margin-bottom:14px}
.post{border-bottom:1px solid #ecd2c2;padding:10px 0}
.pname{font-size:12px;color:#888;margin-bottom:2px}
.pbody{font-size:14px;white-space:pre-wrap}
.cta{display:block;margin:16px 0;padding:12px;background:#e05a00;color:#fff;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold}
.back{display:inline-block;margin-top:16px;color:#c04a00}
</style>
</head>
<body>
<h1>${esc(thread.title)}</h1>
${tagLine ? `<div class="tags">${esc(tagLine)}</div>` : ""}
<a class="cta" href="/#t=${id}">このスレッドに返信・いいねする →</a>
<div class="posts">${postsHtml}</div>
<a class="back" href="/">← キャラ萌え速報 トップへ</a>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("DEBUG ERROR: " + (e && e.stack || e));
  }
};
