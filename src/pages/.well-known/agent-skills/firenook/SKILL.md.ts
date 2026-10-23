// The Firenook skill: how a coding agent installs, switches to and runs
// Firenook. Listed, with its digest, in ../index.json.

import type { APIRoute } from 'astro';
import skill from '../../../../skills/firenook/SKILL.md?raw';

export const GET: APIRoute = () => new Response(skill, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
