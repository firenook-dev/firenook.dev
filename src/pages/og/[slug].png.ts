// The link preview of each of the site's own pages. The docs draw theirs in
// og/docs/. The home page uses the brand kit's social card,
// public/og/home.png, the same one GitHub and npm show.

import type { APIRoute, GetStaticPaths } from 'astro';
import { drawCard } from '../../lib/og';

const pages: Record<string, { title: string; subtitle: string }> = {
  '404': { title: 'This page isn’t here.', subtitle: 'Firenook, a drop-in replacement for the Firebase Local Emulator Suite.' },
};

export const getStaticPaths: GetStaticPaths = () => Object.keys(pages).map((slug) => ({ params: { slug } }));

export const GET: APIRoute = ({ params }) => drawCard(pages[params.slug as string]);
