// 検索エンジンのクローラーにだけ、キャラクターごとのページを実際のHTMLとして返すサーバー関数。
// index.html側はキャラ名で検索すると画面内の状態(JS)だけが変わり、
// URLはトップページのままだったため、Googleで「キャラ名」検索しても
// このサイトの該当ページが出てこない問題があった。
//
// api/t/[id].js と同じ Dynamic Rendering 手法:
// - クローラー: このページで直接、キャラの登場回・活躍回ランキングとスレ一覧を返す→検索に出る
// - 人間のブラウザ: 即座にサーバー側で #c=キャラ名 のハッシュ付きURLへリダイレクト
//   →見た目は今まで通りの本物のサイトそのまま(検索結果フィルタ)

const SUPABASE_URL = "https://xflcbgsonmvvzbefbreq.supabase.co";
const SUPABASE_KEY = "sb_publishable_in8cVtZwe3SbE0l6Y3Jf2Q_awVX6mJY";
const SITE_URL = "https://chara-moe-sokuhou.com";

const BOT_UA_RE = /bot|crawl|spider|slurp|inspectiontool|googlebot|google-inspectiontool|adsbot-google|mediapartners-google|google-read-aloud|storebot-google|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|threadsbot|discordbot|slackbot|telegrambot|whatsapp|linkedinbot|pinterest|redditbot|semrushbot|ahrefsbot|mj12bot|dotbot|gptbot|chatgpt-user|oai-searchbot|perplexitybot|ccbot|bytespider|applebot|petalbot|lighthouse|headlesschrome/i;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  try {
    const raw = req.query.name;
    if (!raw) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    let name;
    try {
      name = decodeURIComponent(raw);
    } catch {
      name = raw;
    }

    const threads = await sbGet(
      `threads?chara_tag=eq.${encodeURIComponent(name)}&caution_reason=is.null&select=id,title&order=id.desc&limit=100`
    );

    if (!Array.isArray(threads) || threads.length === 0) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<!doctype html><html><body>キャラクターが見つかりません</body></html>");
      return;
    }

    const ua = req.headers["user-agent"] || "";
    const isBot = BOT_UA_RE.test(ua);

    // 人間のブラウザには、見慣れた本物のサイト画面(検索結果フィルタ)をそのまま見せる
    if (!isBot) {
      res.statusCode = 302;
      res.setHeader("Location", `/#c=${encodeURIComponent(name)}`);
      res.end();
      return;
    }

    // ここから先はクローラー向け：登場回・活躍回ランキングとスレ一覧を直接返す
    const appearances = await sbGet(
      `chara_appearances?chara_tag=eq.${encodeURIComponent(name)}&select=id,label,note&order=id.asc&limit=200`
    );
    const appearanceIds = (appearances || []).map((a) => a.id);
    let voteCount = {};
    if (appearanceIds.length) {
      const votes = await sbGet(
        `chara_appearance_votes?appearance_id=in.(${appearanceIds.join(",")})&select=appearance_id`
      );
      (votes || []).forEach((v) => {
        voteCount[v.appearance_id] = (voteCount[v.appearance_id] || 0) + 1;
      });
    }
    const rankedAppearances = (appearances || [])
      .map((a) => ({ ...a, votes: voteCount[a.id] || 0 }))
      .sort((a, b) => b.votes - a.votes || a.id - b.id);

    const pageTitle = `${name}の登場回・活躍回まとめ - キャラ萌え速報`;
    const description = rankedAppearances.length
      ? `${name}が活躍した回・登場回を、ファンの投票でランキング。${rankedAppearances.slice(0, 3).map((a) => a.label).join("、")}など。`
      : `${name}の関連スレッド・感想一覧。${threads.slice(0, 3).map((t) => t.title).join("、")}など。`;

    const appearancesHtml = rankedAppearances.length
      ? `<h2>登場回・活躍回ランキング</h2>
<ol class="appear-list">${rankedAppearances
          .map(
            (a) => `
  <li><span class="label">${esc(a.label)}</span>${a.note ? `<span class="note"> - ${esc(a.note)}</span>` : ""}<span class="votes">(${a.votes}票)</span></li>`
          )
          .join("")}
</ol>`
      : "";

    const threadsHtml = `<h2>${esc(name)}の関連スレッド</h2>
<ul class="thread-list">${threads
      .map((th) => `
  <li><a href="/t/${th.id}">${esc(th.title)}</a></li>`)
      .join("")}
</ul>`;

    const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}/c/${encodeURIComponent(name)}">
<link rel="canonical" href="${SITE_URL}/c/${encodeURIComponent(name)}">
<style>
*{box-sizing:border-box}
body{font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;background:#fff4f0;color:#222;max-width:680px;margin:0 auto;padding:16px;line-height:1.6}
h1{font-size:19px;color:#c04a00;margin-bottom:4px}
h2{font-size:15px;color:#e05a00;margin-top:24px;border-bottom:2px solid #e05a00;padding-bottom:4px}
.appear-list{padding-left:22px}
.appear-list li{margin-bottom:6px;font-size:14px}
.appear-list .note{color:#888;font-size:13px}
.appear-list .votes{color:#c04a00;font-size:12px;margin-left:4px}
.thread-list{list-style:none;padding:0}
.thread-list li{border-bottom:1px solid #ecd2c2;padding:8px 0}
.thread-list a{color:#222;text-decoration:none;font-size:14px}
.back{display:inline-block;margin-top:16px;color:#c04a00}
</style>
</head>
<body>
<h1>${esc(name)}</h1>
${appearancesHtml}
${threadsHtml}
<a class="back" href="/">← キャラ萌え速報 トップへ</a>
</body>
</html>`;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Vary", "User-Agent");
    res.end(html);
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<!doctype html><html><body>エラーが発生しました</body></html>");
  }
};
