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
        // Only one variant — no themes needed, just one set
        const existingSet = catalog.sets.find(s => s.name === 'Palette Studio');
        const tokenSet = existingSet ?? catalog.addSet({ name: 'Palette Studio' });
        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

      } else {
        // Both light and dark variants — create two sets and two themes

        // Create the sets (addSet returns a live proxy object)
        const lightSet = catalog.addSet({ name: 'Palette Studio/Light' });
        const darkSet = catalog.addSet({ name: 'Palette Studio/Dark' });

        // Add light colors to the light set
        // If a color has no dark variant, add it to the dark set too
        lightColors.forEach((c) => {
          lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!darkColors.some(d => d.name === c.name)) {
            darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        // Add dark colors to the dark set
        // If a color has no light variant, add it to the light set too
        darkColors.forEach((c) => {
          darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!lightColors.some(l => l.name === c.name)) {
            lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        // Create themes
        // addTheme also returns a live proxy object
        const lightTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Light' });
        const darkTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Dark' });

        // Use getSetById to get live proxies — these are accepted by addSet() of a theme
        const liveLightSet = catalog.getSetById(lightSet.id);
        const liveDarkSet = catalog.getSetById(darkSet.id);

        if (liveLightSet) lightTheme.addSet(liveLightSet);
        if (liveDarkSet) darkTheme.addSet(liveDarkSet);
      }

    } else {
      // ASSETS MODE — add colors to the local library as regular color assets
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
  }
});
