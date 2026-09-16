import test from 'node:test';
import assert from 'node:assert/strict';
import { recordings } from '../src/films.mjs';
import { premiumFilmCuts, premiumFilmPolicy, validatePremiumFilmCuts } from '../src/premium-film-cuts.mjs';
import { buildPremiumFilter, ffmpegArgs } from '../scripts/prepare-media.mjs';

const ids = Object.keys(recordings).sort();

test('premium cuts cover exactly the six real recordings',()=>{
  assert.deepEqual(Object.keys(validatePremiumFilmCuts()).sort(), ids);
  assert.equal(ids.length,6);
});

test('cuts stay chronological inside the previously reviewed preview windows',()=>{
  for(const [id,plan] of Object.entries(premiumFilmCuts)){
    const [windowStart,windowEnd]=plan.sourceWindow;
    assert.equal(plan.clips.length,2,id);
    assert.ok(plan.clips[0][0]>=windowStart && plan.clips.at(-1)[1]<=windowEnd,id);
    assert.ok(plan.clips[0][1] <= plan.clips[1][0],id);
    const duration=plan.clips.reduce((sum,[start,end])=>sum+end-start,0);
    assert.equal(duration,12,id);
  }
});

test('editing policy keeps playback speed honest and produces a quiet 16:9 site master',()=>{
  assert.equal(premiumFilmPolicy.speed,1);
  assert.equal(premiumFilmPolicy.audio,false);
  assert.equal(premiumFilmPolicy.width,1280);
  assert.equal(premiumFilmPolicy.height,720);
  assert.equal(premiumFilmPolicy.fps,30);
  assert.ok(premiumFilmPolicy.crf<=20);
  assert.ok(premiumFilmPolicy.startHold>0 && premiumFilmPolicy.endHold>0);
});

test('filter uses hard chronological cuts, containment and dark letterboxing without synthetic overlays',()=>{
  const filter=buildPremiumFilter(premiumFilmCuts.genie);
  assert.match(filter,/trim=start=0:end=5/);
  assert.match(filter,/trim=start=7:end=14/);
  assert.match(filter,/concat=n=2:v=1:a=0/);
  assert.match(filter,/scale=1280:720:force_original_aspect_ratio=decrease/);
  assert.match(filter,/pad=1280:720/);
  assert.match(filter,/color=0x171A17/i);
  assert.match(filter,/tpad=start_mode=clone/);
  assert.equal((filter.match(/setpts=PTS-STARTPTS/g)||[]).length,2);
  assert.doesNotMatch(filter.replaceAll('setpts=PTS-STARTPTS',''),/setpts=/i);
  assert.doesNotMatch(filter,/drawtext|overlay|xfade|zoompan/i);
});

test('ffmpeg command strips audio, preserves normal speed and optimizes MP4 for the web',()=>{
  const args=ffmpegArgs('/tmp/input.mp4','/tmp/output.mp4',premiumFilmCuts['ai-meeting']);
  const joined=args.join(' ');
  assert.match(joined,/-an/);
  assert.match(joined,/libx264/);
  assert.match(joined,/-preset slow/);
  assert.match(joined,/-crf 18/);
  assert.match(joined,/\+faststart/);
  assert.match(joined,/yuv420p/);
  assert.equal((joined.match(/setpts=PTS-STARTPTS/g)||[]).length,2);
  assert.doesNotMatch(joined.replaceAll('setpts=PTS-STARTPTS',''),/setpts=/i);
  assert.doesNotMatch(joined,/-filter:a|-af |atempo|drawtext|overlay|xfade|zoompan/i);
});

test('product film UI discloses the edit instead of implying a continuous full recording',async()=>{
  const js=await (await import('node:fs/promises')).readFile(new URL('../public/assets/product-films.js',import.meta.url),'utf8');
  assert.match(js,/実録画のサイト用編集版/);
  assert.match(js,/再生速度は変えていません/);
  assert.match(js,/expand:'大きく見る'/);
  assert.doesNotMatch(js,/expand:'全編を大きく見る'/);
  for(const id of ids)assert.match(js,new RegExp(`id:'${id}'.*start:0,end:90`));
});
