import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

interface Skill {
  name: string;
  description: string;
  agents: string[];
  content: string;
}

const skillsDir = path.join(process.cwd(), 'skills');
const skillCache: Map<string, Skill[]> = new Map();

function parseFrontmatter(raw: string): { meta: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, any> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      const val = kv[2].trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        meta[kv[1]] = val.slice(1, -1).split(',').map(s => s.trim());
      } else {
        meta[kv[1]] = val;
      }
    }
  }
  return { meta, body: match[2].trim() };
}

function loadAllSkills(): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(skillsDir)) {
    logger.warn('Skills directory not found, creating it');
    fs.mkdirSync(skillsDir, { recursive: true });
    return skills;
  }

  const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const dir of dirs) {
    const skillFile = path.join(skillsDir, dir.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    try {
      const raw = fs.readFileSync(skillFile, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);

      if (!meta.name || !meta.agents) {
        logger.warn(`Skill ${dir.name} missing name or agents in frontmatter, skipping`);
        continue;
      }

      skills.push({
        name: meta.name,
        description: meta.description || '',
        agents: Array.isArray(meta.agents) ? meta.agents : [meta.agents],
        content: body,
      });

      logger.info(`Loaded skill: ${meta.name} -> [${meta.agents}]`);
    } catch (err) {
      logger.error(`Failed to load skill ${dir.name}: ${err}`);
    }
  }

  return skills;
}

export function getSkillsForAgent(agent: string): string {
  if (skillCache.size === 0) {
    const all = loadAllSkills();
    for (const skill of all) {
      for (const a of skill.agents) {
        const existing = skillCache.get(a) || [];
        existing.push(skill);
        skillCache.set(a, existing);
      }
    }
    logger.info(`Skill loader: ${all.length} skills loaded for ${skillCache.size} agents`);
  }

  const agentSkills = skillCache.get(agent);
  if (!agentSkills?.length) return '';

  const sections = agentSkills.map(s =>
    `\n<skill name="${s.name}">\n${s.content}\n</skill>`
  );

  return `\n\n<available_skills>${sections.join('\n')}\n</available_skills>`;
}

export function reloadSkills(): number {
  skillCache.clear();
  const all = loadAllSkills();
  for (const skill of all) {
    for (const a of skill.agents) {
      const existing = skillCache.get(a) || [];
      existing.push(skill);
      skillCache.set(a, existing);
    }
  }
  return all.length;
}

export function listSkills(): { name: string; agents: string[]; description: string }[] {
  if (skillCache.size === 0) reloadSkills();

  const seen = new Set<string>();
  const result: { name: string; agents: string[]; description: string }[] = [];

  skillCache.forEach((skills) => {
    for (const s of skills) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        result.push({ name: s.name, agents: s.agents, description: s.description });
      }
    }
  });

  return result;
}
