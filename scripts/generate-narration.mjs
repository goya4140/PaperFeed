import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const clips = JSON.parse(fs.readFileSync('lib/clips.json', 'utf8'));
fs.mkdirSync('public/narration', { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfeed-narration-'));
try {
  for (const clip of clips) {
    const parts = [];
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
      const info = execFileSync('/usr/bin/afinfo', [aiff], {
        encoding: 'utf8',
      });
      scene.duration = Number(
        info.match(/estimated duration:\s*([\d.]+)/)?.[1],
      );
      if (!scene.duration) throw new Error('Missing media duration');
      scene.audio = `/narration/${base}.m4a`;
      const wav = path.join(temp, base + '.wav');
      execFileSync('/usr/bin/afconvert', [
        '-f',
        'WAVE',
        '-d',
        'LEI16',
        aiff,
        wav,
      ]);
      parts.push(wav);
    }
    const joined = path.join(temp, clip.id + '-joined.wav');
    execFileSync('/usr/bin/python3', [
      'scripts/join-narration.py',
      joined,
      ...parts,
    ]);
    execFileSync('/usr/bin/afconvert', [
      '-f',
      'm4af',
      '-d',
      'aac',
      joined,
      `public/narration/${clip.id}.m4a`,
    ]);
    clip.audio = `/narration/${clip.id}.m4a`;
  }
  fs.writeFileSync('lib/clips.json', JSON.stringify(clips, null, 2) + '\n');
  console.log('Generated 15 narrated scenes across 3 explainers.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
