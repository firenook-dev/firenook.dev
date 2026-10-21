// The link preview of each of the site's own pages and blog posts. The docs
// draw theirs in og/docs/. The home page uses the brand kit's social card,
// public/og/home.png, the same one GitHub and npm show.

import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { drawCard, type Card } from '../../lib/og';
import { pages, cardSlug } from '../../lib/pages';

export const getStaticPaths: GetStaticPaths = async () => {
  const cards: { slug: string; card: Card }[] = [
    { slug: '404', card: { title: 'This page isn’t here.', subtitle: 'Firenook, a faster drop-in replacement for the Firebase Local Emulator Suite.' } },
    ...Object.entries(pages).map(([path, meta]) => ({ slug: cardSlug(path), card: meta.card })),
  ];
  for (const post of await getCollection('blog')) {
    cards.push({ slug: `blog-${post.id}`, card: { title: post.data.title, subtitle: post.data.description, section: 'Blog' } });
  }
  return cards.map(({ slug, card }) => ({ params: { slug }, props: { card } }));
};

export const GET: APIRoute = ({ props }) => drawCard(props.card as Card);
