penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      if (!needsThemes) {
        if (!catalog.sets.find(s => s.name === 'Palette Studio')) {
          catalog.addSet({ name: 'Palette Studio' });
        }

        await new Promise(r => setTimeout(r, 200));
        const tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');

        const newNames = message.colors.map(c => c.name);
        tokenSet.tokens.filter(t => newNames.includes(t.name)).forEach(t => t.remove());

        message.colors.forEach((c) => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

        penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length, needsThemes: false });

      } else {
        if (!catalog.sets.find(s => s.name === 'Palette Studio/Light')) {
          catalog.addSet({ name: 'Palette Studio/Light' });
        }
        if (!catalog.sets.find(s => s.name === 'Palette Studio/Dark')) {
          catalog.addSet({ name: 'Palette Studio/Dark' });
        }

        const themesExist = !!catalog.themes.find(t => t.name === 'Light' && t.group === 'mode');

        if (!catalog.themes.find(t => t.name === 'Light')) {
          catalog.addTheme({ group: 'mode', name: 'Light' });
        }
        if (!catalog.themes.find(t => t.name === 'Dark')) {
          catalog.addTheme({ group: 'mode', name: 'Dark' });
        }

        await new Promise(r => setTimeout(r, 200));

        const lightSet = catalog.sets.find(s => s.name === 'Palette Studio/Light');
        const darkSet = catalog.sets.find(s => s.name === 'Palette Studio/Dark');
        const lightTheme = catalog.themes.find(t => t.name === 'Light');
        const darkTheme = catalog.themes.find(t => t.name === 'Dark');

        const lightNames = lightColors.map(c => c.name);
        const darkNames = darkColors.map(c => c.name);
        const allNames = [...new Set([...lightNames, ...darkNames])];

        lightSet.tokens.filter(t => allNames.includes(t.name)).forEach(t => t.remove());
        darkSet.tokens.filter(t => allNames.includes(t.name)).forEach(t => t.remove());

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

        lightTheme.addSet(lightSet);
        darkTheme.addSet(darkSet);

        penpot.ui.sendMessage({
          type: 'COLORS_ADDED',
          count: lightColors.length + darkColors.length,
          needsThemes: true,
          themesExist
        });
      }

    } else {
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
      penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length, needsThemes: false });
    }
  }
});
