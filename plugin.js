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
        // No themes needed — just one set
        const existingSet = catalog.sets.find(s => s.name === 'Palette Studio');
        const tokenSet = existingSet ?? catalog.addSet({ name: 'Palette Studio' });
        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

      } else {
        // Always create fresh sets via addSet — these return live proxies
        // that Penpot accepts in addSet() of a theme
        const lightSet = catalog.addSet({ name: 'Palette Studio/Light' });
        const darkSet = catalog.addSet({ name: 'Palette Studio/Dark' });

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

        // Create themes — always fresh via addTheme which also returns live proxies
        const lightTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Light' });
        const darkTheme = catalog.addTheme({ group: 'Palette Studio', name: 'Dark' });

        // Pass the live proxy objects directly — NOT from find()
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
