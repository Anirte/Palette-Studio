penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v6 ===');

// Store catalog reference at load time
const catalog = penpot.library.local.tokens;

// Listen for messages from the UI (index.html)
penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    // MODE 1: Export as Design Tokens
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS STARTED ===');

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');
      const needsThemes = lightColors.length > 0 && darkColors.length > 0;

      // 1. Create a new Token Set
      const setName = 'Palette Studio';
      penpot.library.local.tokens.addSet({ name: setName });

      // Find the set we just created in the list
      const tokenSet = penpot.library.local.tokens.sets.find(s => s.name === setName);

      if (!tokenSet) {
        console.error("Could not find the created TokenSet");
        return;
      }

      // 2. Add color tokens to this set
      message.colors.forEach((c) => {
        tokenSet.addToken({
          type: 'color',
          name: c.name,
          value: c.hex
        });
      });

      // 3. Create Themes and link the Set if we have both variants
      if (needsThemes) {
        // Add themes to the library
        penpot.library.local.tokens.addTheme({ group: '', name: 'Light' });
        penpot.library.local.tokens.addTheme({ group: '', name: 'Dark' });

        // Find themes by name
        const lightTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Light');
        const darkTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Dark');

        if (lightTheme && darkTheme) {
          try {
            // Link the token set to the themes
            // We pass the actual tokenSet object provided by Penpot
            lightTheme.addSet(tokenSet);
            darkTheme.addSet(tokenSet);
            console.log('=== THEMES LINKED ===');
          } catch (e) {
            console.error("Error linking themes:", e);
          }
        }
      }

    // MODE 2: Export as standard Library Colors
    } else {
      message.colors.forEach((c) => {
        // Create standard color in the local library
        penpot.library.createColor({
          name: c.name,
          color: c.hex
        });
      });
    }

    // Send confirmation back to the UI
    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED ===');
  }
});
