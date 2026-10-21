// Gives each docs page what the rest of the site has: links to pages at their
// one address, its own link preview, structured data for search engines, and
// a link to the page as Markdown.

import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { site } from './site';
import { breadcrumbs, graph, jsonLd, organization, website } from './schema';

type Route = App.Locals['starlightRoute'];

/** A docs page's link preview, drawn by /og/docs/[...slug].png. */
export const ogImagePath = (id: string) => (id === 'docs' ? '/og/docs/index.png' : `/og/${id}.png`);

/** Pages are built as files (docs/install.html) and served at /docs/install. */
const clean = (href: string) => href.replace(/\.html(?=$|[#?])/, '');

function cleanSidebar(entries: Route['sidebar']) {
  for (const entry of entries) {
    if (entry.type === 'link') entry.href = clean(entry.href);
    else cleanSidebar(entry.entries);
  }
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const { entry, head, lastUpdated, pagination } = route;

  cleanSidebar(route.sidebar);
  if (pagination.prev) pagination.prev.href = clean(pagination.prev.href);
  if (pagination.next) pagination.next.href = clean(pagination.next.href);

  const { title, description } = entry.data;
  const url = `${site.url}/${entry.id}`;
  const image = `${site.url}${ogImagePath(entry.id)}`;

  for (const tag of head) {
    if (tag.tag === 'link' && tag.attrs?.rel === 'canonical') tag.attrs.href = url;
    if (tag.tag === 'meta' && tag.attrs?.property === 'og:url') tag.attrs.content = url;
  }

  const crumbs = [
    { name: 'Firenook', path: '/' },
    { name: 'Docs', path: '/docs' },
    ...(entry.id === 'docs' ? [] : [{ name: title, path: `/${entry.id}` }]),
  ];
  const article = {
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: title,
    description,
    url,
    image,
    inLanguage: 'en',
    isPartOf: { '@id': `${site.url}/#website` },
    publisher: { '@id': `${site.url}/#organization` },
    about: { '@id': `${site.url}/#software` },
    ...(lastUpdated ? { dateModified: lastUpdated.toISOString() } : {}),
  };

  head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: `/${entry.id}.md` } },
    { tag: 'script', attrs: { type: 'application/ld+json' }, content: jsonLd(graph(organization, website, article, breadcrumbs(crumbs))) },
  );
});
