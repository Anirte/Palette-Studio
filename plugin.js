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
        let tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');
        if (!tokenSet) tokenSet = catalog.addSet({ name: 'Palette Studio' });
        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

      } else {
        let lightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
        if (!lightSet) lightSet = catalog.addSet({ name: 'Palette Studio/Light' });

        let darkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');
        if (!darkSet) darkSet = catalog.addSet({ name: 'Palette Studio/Dark' });

        lightColors.forEach((c) => {
          lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!darkColors.some(d => d.name === c.name)) {
            darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        darkColors.forEach((c) => {
          darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
          if (!lightColors.some(l => l.name === c.name)) {
            lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
          }
        });

        let lightTheme = catalog.themes.find(t => t.name === 'Light');
        if (!lightTheme) lightTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Light' });

        let darkTheme = catalog.themes.find(t => t.name === 'Dark');
        if (!darkTheme) darkTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Dark' });

        // Pass the actual set objects, not strings
        const freshLightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
        const freshDarkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');

        if (freshLightSet) lightTheme.addSet(freshLightSet.id);
        if (freshDarkSet) darkTheme.addSet(freshDarkSet.id);
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
