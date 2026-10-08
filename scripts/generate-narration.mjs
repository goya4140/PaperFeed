import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const clips = JSON.parse(fs.readFileSync('lib/clips.json', 'utf8'));
fs.mkdirSync('public/narration', { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfeed-narration-'));
try {
  for (const clip of clips)
    for (let i = 0; i < clip.scenes.length; i++) {
      const scene = clip.scenes[i];
      const base = `${clip.id}-${i}`;
      const aiff = path.join(temp, base + '.aiff');
      execFileSync('/usr/bin/say', [
        '-v',
        'Tingting',
        '-r',
        '185',
        '-o',
        aiff,
        scene.text,
      ]);
      execFileSync('/usr/bin/afconvert', [
        '-f',
        'm4af',
        '-d',
        'aac',
        aiff,
        `public/narration/${base}.m4a`,
      ]);
      const info = execFileSync(
        '/usr/bin/afinfo',
        [`public/narration/${base}.m4a`],
        { encoding: 'utf8' },
      );
      scene.duration = Number(
        info.match(/estimated duration:\s*([\d.]+)/)?.[1],
      );
      if (!scene.duration) throw new Error('Missing media duration');
      scene.audio = `/narration/${base}.m4a`;
    }
  fs.writeFileSync('lib/clips.json', JSON.stringify(clips, null, 2) + '\n');
  console.log('Generated 15 narrated scenes across 3 explainers.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
