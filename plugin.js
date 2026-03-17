penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;
      console.log('Colors received:', JSON.stringify(message.colors));
      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // Always one set — "Palette Studio"
      const tokenSet = catalog.addSet({ name: 'Palette Studio' });

      // Add all colors to the single set
      lightColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      if (needsThemes) {
        // Create Light and Dark themes — both linked to the same "Palette Studio" set
        const lightTheme = catalog.addTheme({ group: '', name: 'Light' });
        const darkTheme = catalog.addTheme({ group: '', name: 'Dark' });

        // Get live proxy via getSetById and link to themes
        const liveSet = catalog.getSetById(tokenSet.id);
        if (liveSet) {
          lightTheme.addSet(liveSet);
          darkTheme.addSet(liveSet);
        }
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
