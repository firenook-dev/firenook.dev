// The skills this site publishes, for agents that discover them
// (Agent Skills Discovery 0.2.0). The digest is of the file as served.

import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import skill from '../../../skills/firenook/SKILL.md?raw';

const description = skill.match(/^description: (.+)$/m)![1];

export const GET: APIRoute = () =>
  Response.json({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'firenook',
        type: 'skill-md',
        description,
        url: '/.well-known/agent-skills/firenook/SKILL.md',
        digest: `sha256:${createHash('sha256').update(skill, 'utf8').digest('hex')}`,
      },
    ],
  });
