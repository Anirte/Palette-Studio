penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.2 ===');

// Complete handler for messages from UI
penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS STARTED (STRICT ID MODE) ===');

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // 1. Handle Token Set (Find or Create)
      const setName = 'Palette Studio';
      let tokenSet = penpot.library.local.tokens.sets.find(s => s.name === setName);

      if (!tokenSet) {
        penpot.library.local.tokens.addSet({ name: setName });
        // After adding, we MUST find it again to get the valid Penpot object
        tokenSet = penpot.library.local.tokens.sets.find(s => s.name === setName);
      }

      if (!tokenSet) {
        console.error("Critical: Could not create or find TokenSet");
        return;
      }

      // 2. Add Tokens to the Set
      message.colors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // 3. Handle Themes (Strictly using IDs for RC versions)
      if (needsThemes) {
        // Wait 250ms to ensure Penpot DB is synced
        await new Promise(r => setTimeout(r, 250));

        let lightTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Light') ||
                         penpot.library.local.tokens.addTheme({ group: '', name: 'Light' });

        let darkTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Dark') ||
                        penpot.library.local.tokens.addTheme({ group: '', name: 'Dark' });

        try {
          // CRITICAL FIX: Pass ONLY the ID string, not the whole object
          // This is required for Penpot 2.14.0-RC to pass schema validation
          if (lightTheme) lightTheme.addSet(tokenSet.id);
          if (darkTheme) darkTheme.addSet(tokenSet.id);
          console.log('=== THEMES LINKED SUCCESSFULLY VIA ID ===');
        } catch (e) {
          console.error("Theme linking failed in this version of Penpot:", e);
        }
      }

    // --- MODE: STANDARD COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    // Send confirmation to UI
    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED ===');
  }
});
