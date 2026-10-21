// The block flame as a file of its own, drawn from the same cells the site
// and Firenook's terminal draw it with: each cell four fifths of its square.

import type { APIRoute } from 'astro';
import { cells, paths } from '../../lib/pixels';

export const GET: APIRoute = () => {
  const flame = cells('flame');
  const unit = 10;
  const body = paths(flame.cells, 0.8, 0.1)
    .map((group) => `<path d="${group.d}" fill="${group.fill}"${group.opacity !== undefined ? ` fill-opacity="${group.opacity}"` : ''}/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${flame.width} ${flame.height}" width="${flame.width * unit}" height="${flame.height * unit}" shape-rendering="crispEdges"><title>Firenook block flame</title>${body}</svg>\n`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
