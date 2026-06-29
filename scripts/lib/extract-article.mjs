import { extractPost } from './extract-post.mjs';

function inner(re, html) { const m = html.match(re); return m ? m[1].trim() : ''; }

function parseBreadcrumb(html) {
  const ol = inner(/<nav class="breadcrumb"[^>]*>\s*<ol>([\s\S]*?)<\/ol>/, html);
  if (!ol) return [];
  const items = [...ol.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => m[1].trim());
  return items.map(li => {
    const a = li.match(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (a) return { label: a[2].replace(/<[^>]+>/g, '').trim(), href: a[1] };
    return { label: li.replace(/<[^>]+>/g, '').trim(), href: null };
  });
}

function wordCount(htmlFragment) {
  return htmlFragment.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function extractArticle(html, url) {
  const post = extractPost(html, url);
  const headerTitle = inner(/<h1 class="article__title">([\s\S]*?)<\/h1>/, html);
  const subtitle = inner(/<p class="article__subtitle">([\s\S]*?)<\/p>/, html);
  const articleInner = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/) || [, html])[1];
  const contentHtml = inner(/<div class="article__content">([\s\S]*)<\/div>/, articleInner);
  const stepNavHtml = inner(/(<nav class="step-nav-footer">[\s\S]*?<\/nav>)/, html);
  const disc = html.match(/<aside class="disclaimer">[\s\S]*?<p class="disclaimer__text">([\s\S]*?)<\/p>/);
  return {
    url,
    title: post.title,
    description: post.summary,
    headerTitle, subtitle, contentHtml,
    breadcrumb: parseBreadcrumb(html),
    hasDisclaimer: !!disc,
    disclaimerText: disc ? disc[1].replace(/\s+/g, ' ').trim() : '',
    stepNavHtml,
    author: url.startsWith('/gojo/') ? 'Gojo (AI analyst)' : 'Tui Alailima',
    date: post.date, section: post.section, type: post.type, ticker: post.ticker,
    readTime: Math.max(1, Math.round(wordCount(contentHtml) / 220)),
  };
}
