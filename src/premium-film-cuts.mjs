export const PREMIUM_FILM_VERSION = 1;

// These cuts stay inside the already-reviewed preview windows used by the site.
// They remove a short middle wait only; playback speed is never changed.
export const premiumFilmCuts = Object.freeze({
  genie: {
    sourceWindow: [0, 14],
    clips: [[0, 5], [7, 14]],
    label: { ja: '依頼から成果物へ', en: 'Request to artifact' },
  },
  'ai-meeting': {
    sourceWindow: [4, 18],
    clips: [[4, 9], [11, 18]],
    label: { ja: '会話からタスクへ', en: 'Conversation to task' },
  },
  oathra: {
    sourceWindow: [6, 20],
    clips: [[6, 11], [13, 20]],
    label: { ja: '会話から証拠へ', en: 'Conversation to evidence' },
  },
  aisecure: {
    sourceWindow: [0, 14],
    clips: [[0, 5], [7, 14]],
    label: { ja: '兆候から調査へ', en: 'Signal to investigation' },
  },
  'agent-team': {
    sourceWindow: [5, 19],
    clips: [[5, 10], [12, 19]],
    label: { ja: '依頼から成果物へ', en: 'Brief to artifact' },
  },
  launchloom: {
    sourceWindow: [3, 17],
    clips: [[3, 8], [10, 17]],
    label: { ja: '録画から公開素材へ', en: 'Recording to launch assets' },
  },
});

export const premiumFilmPolicy = Object.freeze({
  width: 1280,
  height: 720,
  fps: 30,
  crf: 18,
  preset: 'slow',
  paper: '#171A17',
  startHold: 0.35,
  endHold: 0.55,
  audio: false,
  speed: 1,
});

export function validatePremiumFilmCuts(cuts = premiumFilmCuts) {
  for (const [id, plan] of Object.entries(cuts)) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid premium film ID: ${id}`);
    if (!Array.isArray(plan.sourceWindow) || plan.sourceWindow.length !== 2) throw new Error(`${id}: invalid source window`);
    const [windowStart, windowEnd] = plan.sourceWindow;
    if (!(windowStart >= 0 && windowEnd > windowStart)) throw new Error(`${id}: invalid source window`);
    if (!Array.isArray(plan.clips) || plan.clips.length !== 2) throw new Error(`${id}: expected exactly two honest cuts`);
    let previousEnd = -1;
    for (const clip of plan.clips) {
      if (!Array.isArray(clip) || clip.length !== 2) throw new Error(`${id}: invalid clip`);
      const [start, end] = clip;
      if (!(start >= windowStart && end <= windowEnd && end > start)) throw new Error(`${id}: clip outside reviewed window`);
      if (start < previousEnd) throw new Error(`${id}: clips must stay chronological`);
      previousEnd = end;
    }
    const duration = plan.clips.reduce((sum, [start, end]) => sum + end - start, 0);
    if (duration < 10 || duration > 16) throw new Error(`${id}: website cut must remain concise`);
  }
  return cuts;
}

validatePremiumFilmCuts();
