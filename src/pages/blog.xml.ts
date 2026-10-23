// The blog as an RSS feed, whole posts included.

import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { site } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', (post) => !post.data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const container = await AstroContainer.create();
  const items = [];
  for (const post of posts) {
    const { Content } = await render(post);
    // Links in the feed must work outside the site.
    const html = (await container.renderToString(Content)).replace(/(href|src)="\//g, `$1="${site.url}/`);
    items.push({
      title: post.data.title,
      description: post.data.description,
      link: `${site.url}/blog/${post.id}`,
      pubDate: post.data.date,
      content: html,
    });
  }
  return rss({
    title: 'The Firenook blog',
    description: 'How Firenook works, what it measures, and what comes next.',
    site: `${site.url}/blog`,
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items,
    customData: `<language>en</language><atom:link href="${site.url}/blog.xml" rel="self" type="application/rss+xml"/>`,
  });
};
