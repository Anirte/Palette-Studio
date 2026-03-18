penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v5.1 ===');

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS START v5 ===');
      const catalog = penpot.library.local.tokens;

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;
      console.log('needsThemes:', needsThemes);

      catalog.addSet({ name: 'Palette Studio' });

      if (needsThemes) {
        catalog.addTheme({ group: '', name: 'Light' });
        catalog.addTheme({ group: '', name: 'Dark' });
      }

      console.log('sets count:', catalog.sets.length);
      console.log('themes count:', catalog.themes.length);

      const tokenSet = catalog.sets[catalog.sets.length - 1];
      console.log('tokenSet by index:', tokenSet?.name);

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
        console.log('lightTheme:', lightTheme?.name);
        console.log('darkTheme:', darkTheme?.name);
        console.log('freshSet:', freshSet?.name);

        lightTheme.addSet(freshSet.id);
        darkTheme.addSet(freshSet.id);
        console.log('=== THEMES LINKED ===');
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
