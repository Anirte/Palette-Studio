penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v12.2 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      if (!needsThemes) {
        // All colors are same variant — one set, no themes
        catalog.addSet({ name: 'Palette Studio' });
        await new Promise(r => setTimeout(r, 200));
        const tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');

        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

      } else {
        // Mix of light and dark — two sets and two themes
        catalog.addSet({ name: 'Palette Studio/Light' });
        catalog.addSet({ name: 'Palette Studio/Dark' });
        catalog.addTheme({ group: 'mode', name: 'Light' });
        catalog.addTheme({ group: 'mode', name: 'Dark' });

        await new Promise(r => setTimeout(r, 200));

        const lightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
        const darkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');
        const lightTheme = catalog.themes.find(t => t.name === 'Light');
        const darkTheme = catalog.themes.find(t => t.name === 'Dark');

        // Add light colors to light set
        // If no dark variant exists — add to dark set too
        lightColors.forEach((c) => {
          lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!darkColors.some(d => d.name === c.name)) {
            darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        // Add dark colors to dark set
        // If no light variant exists — add to light set too
        darkColors.forEach((c) => {
          darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!lightColors.some(l => l.name === c.name)) {
            lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        // Link sets to themes (known bug in Penpot RC5 — addSet fails silently)
        // User will need to link manually in Penpot UI
        lightTheme.addSet(lightSet);
        darkTheme.addSet(darkSet);
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
