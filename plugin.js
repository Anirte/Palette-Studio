penpot.ui.open('Palette Studio', `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

let savedSize = {width: 900, height: 640};

// Token layout, the same as the "Mobile design" system:
//   Universal  - tokens that have the same value in both themes
//   Light/Dark - only the tokens whose value differs per theme
//   themes: Light = [Universal, Light], Dark = [Universal, Dark]
const SHARED_SET = 'Universal';
const LIGHT_SET = 'Light';
const DARK_SET = 'Dark';
const LIGHT_THEME = 'Light';
const DARK_THEME = 'Dark';
const THEME_GROUP = '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

penpot.ui.onMessage(async (message) => {
  if (message.type === 'RESIZE') {
    penpot.ui.resize(message.width, message.height);
  }
  if (message.type === 'GET_SIZE_AND_MINIMIZE') {
    const size = penpot.ui.size;
    if (size) savedSize = {width: size.width, height: size.height};
    penpot.ui.resize(280, 50);
  }
  if (message.type === 'RESTORE_SIZE') {
    penpot.ui.resize(savedSize.width, savedSize.height);
  }
  if (message.type === 'ADD_COLORS') {
    try {
      const result = message.mode === 'tokens' ? await addTokens(message.colors) : addAssets(message.colors);
      penpot.ui.sendMessage({type: 'COLORS_ADDED', mode: message.mode, ...result});
    } catch (e) {
      penpot.ui.sendMessage({type: 'COLORS_ERROR', message: (e && e.message) || String(e)});
    }
  }
});

// ══════════════════════════════════════════ TOKENS
async function addTokens(colors) {
  const catalog = penpot.library && penpot.library.local && penpot.library.local.tokens;
  if (!catalog) throw new Error('Design tokens are not available in this Penpot version');

  const shared = colors.filter((c) => c.variant === 'shared');
  const light = colors.filter((c) => c.variant === 'light');
  const dark = colors.filter((c) => c.variant === 'dark');
  const themed = light.length > 0 && dark.length > 0;

  // 1. create what is missing (new sets start inactive; Dark stays off like in the reference file)
  const findSet = (name) => catalog.sets.find((s) => s.name === name);
  let created = false;
  const ensureSet = (name, active) => {
    if (!findSet(name)) {
      catalog.addSet({name, active});
      created = true;
    }
  };
  ensureSet(SHARED_SET, true);
  if (themed) {
    ensureSet(LIGHT_SET, true);
    ensureSet(DARK_SET, false);
  }
  if (created) await sleep(200);

  const sharedSet = findSet(SHARED_SET);
  const lightSet = findSet(LIGHT_SET);
  const darkSet = findSet(DARK_SET);

  // 2. write tokens. A name lives in exactly one place: the shared set, or Light + Dark.
  //    Copies left in the other sets are removed, otherwise a stale theme value would override the new one.
  const place = (list, target, others) => {
    list.forEach((c) => {
      upsertColorToken(target, c.name, c.hex);
      others.filter(Boolean).forEach((set) => removeToken(set, c.name));
    });
  };
  place(shared, sharedSet, [lightSet, darkSet]);
  place(light, lightSet, [sharedSet]);
  place(dark, darkSet, [sharedSet]);

  // 3. themes: Light = [Universal, Light], Dark = [Universal, Dark]
  const missingLinks = [];
  if (themed) {
    const wanted = [
      {theme: LIGHT_THEME, sets: [sharedSet, lightSet]},
      {theme: DARK_THEME, sets: [sharedSet, darkSet]}
    ];
    const findTheme = (name) => catalog.themes.find((t) => t.name === name && t.group === THEME_GROUP);

    let themesCreated = false;
    wanted.forEach(({theme}) => {
      if (!findTheme(theme)) {
        catalog.addTheme({group: THEME_GROUP, name: theme});
        themesCreated = true;
      }
    });
    if (themesCreated) await sleep(200);

    wanted.forEach(({theme, sets}) => {
      const t = findTheme(theme);
      if (!t) return;
      sets.forEach((set) => {
        if (!t.activeSets.some((s) => s.name === set.name)) t.addSet(set);
      });
    });

    // addSet does not always take effect, so check and tell the user what is left to do by hand
    await sleep(200);
    wanted.forEach(({theme, sets}) => {
      const t = findTheme(theme);
      sets.forEach((set) => {
        if (!t || !t.activeSets.some((s) => s.name === set.name)) missingLinks.push(`${set.name} → ${theme}`);
      });
    });
  }

  return {count: colors.length, themed, missingLinks};
}

function upsertColorToken(set, name, hex) {
  const existing = set.tokens.find((t) => t.name === name);
  if (existing && existing.type === 'color') {
    existing.value = hex; // keep the token (and whatever uses it), only change the value
    return;
  }
  if (existing) existing.remove();
  set.addToken({type: 'color', name, value: hex});
}

function removeToken(set, name) {
  set.tokens.filter((t) => t.name === name).forEach((t) => t.remove());
}

// ══════════════════════════════════════════ LIBRARY COLORS (assets)
function addAssets(colors) {
  const library = penpot.library.local;
  let added = 0;
  let updated = 0;
  colors.forEach((c) => {
    const existing = library.colors.find((x) => x.name === c.name || (x.path ? `${x.path}/${x.name}` : x.name) === c.name);
    if (existing) {
      existing.color = c.hex;
      updated++;
    } else {
      const created = library.createColor();
      created.name = c.name;
      created.color = c.hex;
      added++;
    }
  });
  return {count: colors.length, added, updated};
}
