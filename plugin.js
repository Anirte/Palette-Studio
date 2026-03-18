penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v12 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // Step 1: Create sets and themes
      catalog.addSet({ name: 'Palette Studio/Light' });
      catalog.addSet({ name: 'Palette Studio/Dark' });

      if (needsThemes) {
        catalog.addTheme({ group: '', name: 'Light' });
        catalog.addTheme({ group: '', name: 'Dark' });
      }

      // Step 2: Wait for Penpot to update its internal state
      await new Promise(r => setTimeout(r, 200));

      // Step 3: Get fresh references after state update
      const lightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
      const darkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');
      console.log('lightSet after wait:', lightSet?.name);
      console.log('darkSet after wait:', darkSet?.name);

      // Step 4: Add tokens
      lightColors.forEach((c) => {
        lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // Step 5: Link sets to themes
      if (needsThemes) {
        const lightTheme = catalog.themes.find(t => t.name === 'Light');
        const darkTheme = catalog.themes.find(t => t.name === 'Dark');
        console.log('lightTheme:', lightTheme?.name);
        console.log('darkTheme:', darkTheme?.name);

        lightTheme.addSet(lightSet);
        darkTheme.addSet(darkSet);
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
