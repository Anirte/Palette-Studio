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

      if (!needsThemes) {
        // No themes needed — one set for everything
        let tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');
        if (!tokenSet) tokenSet = catalog.addSet({ name: 'Palette Studio' });

        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

      } else {
        // Create separate sets for Light and Dark
        let lightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
        if (!lightSet) lightSet = catalog.addSet({ name: 'Palette Studio/Light' });

        let darkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');
        if (!darkSet) darkSet = catalog.addSet({ name: 'Palette Studio/Dark' });

        // Add colors to their sets
        lightColors.forEach((c) => {
          lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          // If no dark variant — add to dark set too
          if (!darkColors.some(d => d.name === c.name)) {
            darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        darkColors.forEach((c) => {
          darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          // If no light variant — add to light set too
          if (!lightColors.some(l => l.name === c.name)) {
            lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        // Find or create Light and Dark themes
        let lightTheme = catalog.themes.find(t => t.name === 'Light');
        if (!lightTheme) lightTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Light' });

        let darkTheme = catalog.themes.find(t => t.name === 'Dark');
        if (!darkTheme) darkTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Dark' });

        // Assign sets to themes — pass the set object, not its name
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
