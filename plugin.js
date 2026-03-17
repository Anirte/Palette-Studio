// This runs immediately when plugin opens — tests addSet on theme
const catalog = penpot.library.local.tokens;
const testSet = catalog.addSet({ name: 'DebugTest' });
const theme = catalog.addTheme({ group: '', name: 'DebugTheme' });

try {
  theme.addSet(testSet);
  penpot.ui.sendMessage({ type: 'DEBUG', result: 'SUCCESS', activeSets: theme.activeSets.length });
} catch(e) {
  penpot.ui.sendMessage({ type: 'DEBUG', result: 'ERROR', error: e.message });
}

penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // Always one set — "Palette Studio"
      const tokenSet = catalog.addSet({ name: 'Palette Studio' });
      console.log('tokenSet type tag:', tokenSet[Symbol.toStringTag]);
      console.log('tokenSet proto:', Object.getPrototypeOf(tokenSet));

      const liveSet = catalog.getSetById(tokenSet.id);
      console.log('liveSet type tag:', liveSet?.[Symbol.toStringTag]);
      console.log('are they same?', tokenSet === liveSet);

      // Add all colors to the single set
      lightColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      if (needsThemes) {
        const lightTheme = catalog.addTheme({ group: '', name: 'Light' });
        const darkTheme = catalog.addTheme({ group: '', name: 'Dark' });

        const liveSet = catalog.getSetById(tokenSet.id);
        if (liveSet) {
          lightTheme.addSet(liveSet);
          darkTheme.addSet(liveSet);
        }
      }

    } else {
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
  }
});
