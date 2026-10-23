// Every release as an RSS feed, for readers who follow Firenook.

import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { releases } from '../lib/changelog';
import { site } from '../lib/site';

export const GET: APIRoute = () =>
  rss({
    title: 'Firenook releases',
    description: 'Every Firenook release, newest first: what changed, what it made faster, and what happens to your data.',
    site: `${site.url}/changelog`,
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: releases.map((release) => ({
      title: `${release.version}: ${release.title}`,
      link: `${site.url}${release.path}`,
      pubDate: release.date,
      content: release.highlights.length
        ? `<ul>${release.highlights.map((item) => `<li>${item.html}</li>`).join('')}</ul><p><a href="${site.url}${release.path}">Full notes</a></p>`
        : `<p><a href="${site.url}${release.path}">Full notes</a></p>`,
    })),
    customData: `<language>en</language><atom:link href="${site.url}/changelog.xml" rel="self" type="application/rss+xml"/>`,
  });
