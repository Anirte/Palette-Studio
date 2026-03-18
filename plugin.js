penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.5 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE 1: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v7.5 STARTED ===');

      const tokens = penpot.library.local.tokens;
      const setName = 'PaletteStudio';

      // 1. УБИРАЕМ СТАРЬЕ (чтобы не путать базу Penpot)
      const existingSet = tokens.sets.find(s => s.name === setName);
      if (existingSet) existingSet.remove();

      // 2. ГОТОВИМ ТЕМЫ ЗАРАНЕЕ
      let lightT = tokens.themes.find(t => t.name === 'Light') || tokens.addTheme({ name: 'Light' });
      let darkT = tokens.themes.find(t => t.name === 'Dark') || tokens.addTheme({ name: 'Dark' });

      // 3. СОЗДАЕМ СЕТ
      const freshSet = tokens.addSet({ name: setName });

      if (freshSet) {
        // --- КРИТИЧЕСКИЙ МОМЕНТ ДЛЯ RC5 ---
        // Привязываем Сет к Темам ПРЯМО СЕЙЧАС, пока он пустой и "валидный"
        try {
          lightT.addSet(freshSet);
          darkT.addSet(freshSet);
          console.log('=== STEP 1: Empty Set successfully linked to Themes ===');
        } catch (e) {
          console.warn("Direct linking failed, trying linking via ID...");
          try {
            lightT.addSet(freshSet.id);
            darkT.addSet(freshSet.id);
          } catch(e2) {
            console.error("Penpot RC5 blocked all linking methods.");
          }
        }

        // 4. НАПОЛНЯЕМ ЦВЕТАМИ
        // Теперь, когда связи созданы, мы можем спокойно добавлять токены
        message.colors.forEach(c => {
          freshSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

        console.log('=== STEP 2: Tokens added to the linked Set ===');
      }

    // --- MODE 2: STANDARD COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    // Отправляем ответ в интерфейс
    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED v7.5 ===');
  }
});
