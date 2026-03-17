penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      let tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');
      if (!tokenSet) {
        tokenSet = catalog.addSet({ name: 'Palette Studio' });
      }

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');

      const hasAnyLight = lightColors.length > 0;
      const hasAnyDark = darkColors.length > 0;
      const needsThemes = hasAnyLight && hasAnyDark;

      if (!needsThemes) {
        message.colors.forEach((c) => {
          tokenSet.addToken({
            type: 'color',
            name: c.name,
            value: c.hex
          });
        });
      } else {
        let lightTheme = catalog.themes.find(t => t.name === 'Light');
        if (!lightTheme) {
          lightTheme = catalog.addTheme({ group: '', name: 'Light' });
        }

        let darkTheme = catalog.themes.find(t => t.name === 'Dark');
        if (!darkTheme) {
          darkTheme = catalog.addTheme({ group: '', name: 'Dark' });
        }

        lightColors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
          lightTheme.addSet(tokenSet.name);
          const hasDark = darkColors.some(d => d.name === c.name);
          if (!hasDark) {
            darkTheme.addSet(tokenSet.name);
          }
        });

        darkColors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
          darkTheme.addSet(tokenSet.name);
          const hasLight = lightColors.some(l => l.name === c.name);
          if (!hasLight) {
            lightTheme.addSet(tokenSet.name);
          }
        });
      }

    } else {
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
    }

    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });
  }
});
