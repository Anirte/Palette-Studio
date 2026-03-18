penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.1 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE 1: EXPORT AS DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS STARTED ===');

      // 1. Prepare data
      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // 2. Create or find the Token Set
      const setName = 'Palette Studio';
      let tokenSet = penpot.library.local.tokens.sets.find(s => s.name === setName);
      if (!tokenSet) {
        penpot.library.local.tokens.addSet({ name: setName });
        tokenSet = penpot.library.local.tokens.sets.find(s => s.name === setName);
      }

      // 3. Add tokens to the set
      message.colors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // 4. Handle Themes if we have both variants
      if (needsThemes) {
        // Give Penpot a tiny moment to index new tokens
        await new Promise(r => setTimeout(r, 100));

        // Create or find Light/Dark themes
        let lightTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Light');
        if (!lightTheme) {
            penpot.library.local.tokens.addTheme({ group: '', name: 'Light' });
            lightTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Light');
        }

        let darkTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Dark');
        if (!darkTheme) {
            penpot.library.local.tokens.addTheme({ group: '', name: 'Dark' });
            darkTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Dark');
        }

        // Link the set to themes using the specific object Penpot expects
        try {
          if (lightTheme) lightTheme.addSet(tokenSet);
          if (darkTheme) darkTheme.addSet(tokenSet);
          console.log('=== THEMES LINKED ===');
        } catch (e) {
          console.error("Theme linking failed, but tokens are created:", e);
        }
      }

    // --- MODE 2: EXPORT AS STANDARD LIBRARY COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({
          name: c.name,
          color: c.hex
        });
      });
    }

    // Send success feedback to UI
    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED ===');
  }
});
