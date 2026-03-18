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

      // Step 1: Create set and themes first
      catalog.addSet({ name: 'Palette Studio' });

      if (needsThemes) {
        catalog.addTheme({ group: '', name: 'Light' });
        catalog.addTheme({ group: '', name: 'Dark' });
      }

      // Step 2: Get fresh references from catalog
      const tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');
      const lightTheme = catalog.themes.find(t => t.name === 'Light');
      const darkTheme = catalog.themes.find(t => t.name === 'Dark');
      const freshSet = catalog.sets.find(s => s.name === 'Palette Studio');

      // Step 3: Add tokens
      lightColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // Step 4: Link set to themes
      if (needsThemes) {
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
