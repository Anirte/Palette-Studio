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

      catalog.addSet({ name: 'Palette Studio' });

      if (needsThemes) {
        catalog.addTheme({ group: '', name: 'Light' });
        catalog.addTheme({ group: '', name: 'Dark' });
      }

      // Use index directly like in the working test
      const tokenSet = catalog.sets[catalog.sets.length - 1];

      lightColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      if (needsThemes) {
        const lightTheme = catalog.themes[catalog.themes.length - 2];
        const darkTheme = catalog.themes[catalog.themes.length - 1];
        const freshSet = catalog.sets[catalog.sets.length - 1];

        lightTheme.addSet(freshSet);
        darkTheme.addSet(freshSet);
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
