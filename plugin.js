penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v6 ===');

// Store catalog reference at load time
const catalog = penpot.library.local.tokens;

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v6 ===');

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      catalog.addSet({ name: 'Palette Studio' });
      const tokenSet = catalog.sets[catalog.sets.length - 1];
      console.log('tokenSet:', tokenSet?.name, tokenSet?.[Symbol.toStringTag]);

      lightColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      if (needsThemes) {
        catalog.addTheme({ group: '', name: 'Light' });
        catalog.addTheme({ group: '', name: 'Dark' });

        const lightTheme = catalog.themes[catalog.themes.length - 2];
        const darkTheme = catalog.themes[catalog.themes.length - 1];
        const freshSet = catalog.sets[catalog.sets.length - 1];

        console.log('freshSet tag:', freshSet?.[Symbol.toStringTag]);
        console.log('token-set-proxy? check:', freshSet?.[Symbol.toStringTag] === 'TokenSetProxy');

        lightTheme.addSet(freshSet);
        darkTheme.addSet(freshSet);
        console.log('=== DONE ===');
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
