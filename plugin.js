penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.6 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE 1: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v7.6 STARTED ===');

      const tokens = penpot.library.local.tokens;
      const setName = 'PaletteStudio'; // Без пробелов для надежности

      // 1. ОЧИСТКА (важно для RC5)
      const existingSet = tokens.sets.find(s => s.name === setName);
      if (existingSet) existingSet.remove();

      // 2. СОЗДАЕМ ТЕМЫ (с обязательным параметром group)
      let lightT = tokens.themes.find(t => t.name === 'Light') ||
                   tokens.addTheme({ name: 'Light', group: "" }); // ОБЯЗАТЕЛЬНО ""

      let darkT = tokens.themes.find(t => t.name === 'Dark') ||
                  tokens.addTheme({ name: 'Dark', group: "" });  // ОБЯЗАТЕЛЬНО ""

      // 3. СОЗДАЕМ СЕТ
      const freshSet = tokens.addSet({ name: setName });

      if (freshSet) {
        // 4. ПРИВЯЗЫВАЕМ (Пока сет пустой, это стабильнее в RC5)
        try {
          if (lightT) lightT.addSet(freshSet);
          if (darkT) darkT.addSet(freshSet);
          console.log('=== STEP 1: Linking Successful ===');
        } catch (e) {
          console.warn("Linking failed, Penpot is being difficult...");
        }

        // 5. НАПОЛНЯЕМ ЦВЕТАМИ
        message.colors.forEach(c => {
          freshSet.addToken({
            type: 'color',
            name: c.name,
            value: c.hex
          });
        });

        console.log('=== STEP 2: Tokens added ===');
      }

    // --- MODE 2: STANDARD COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED v7.6 ===');
  }
});
