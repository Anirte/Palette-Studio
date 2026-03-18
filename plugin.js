penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.4 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS STARTED (SWISS ARMY KNIFE MODE) ===');

      const setName = 'PaletteStudio'; // Убрали пробел на всякий случай для RC-версии
      const tokensRef = penpot.library.local.tokens;

      // 1. Очистка старого
      const existingSet = tokensRef.sets.find(s => s.name === setName || s.name === 'Palette Studio');
      if (existingSet) existingSet.remove();

      // 2. Умное создание сета (пробуем 3 способа для RC5)
      let tokenSet = null;

      console.log('Attempting to create set...');
      try {
        // Способ А: Стандартный объект
        tokenSet = tokensRef.addSet({ name: setName });
      } catch (e) {
        try {
          // Способ Б: Прямая строка (иногда в RC это работает именно так)
          tokenSet = tokensRef.addSet(setName);
        } catch (e2) {
          console.warn('Direct methods failed, trying to find after silent creation...');
        }
      }

      // Если методы выше не вернули объект сразу, ищем его в списке
      if (!tokenSet) {
        tokenSet = tokensRef.sets.find(s => s.name === setName);
      }

      if (!tokenSet) {
        console.error("Penpot RC5 rejected all set creation methods.");
        penpot.ui.sendMessage({ type: 'ERROR', message: 'Penpot RC5 API Error: Could not create Token Set' });
        return;
      }

      // 3. Добавление токенов
      console.log('Set created, adding tokens...');
      message.colors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // 4. Темы (только если есть оба варианта)
      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');

      if (lightColors.length > 0 && darkColors.length > 0) {
        await new Promise(r => setTimeout(r, 200));

        let lightTheme = tokensRef.themes.find(t => t.name === 'LightTheme') ||
                         tokensRef.addTheme({ group: '', name: 'LightTheme' });

        let darkTheme = tokensRef.themes.find(t => t.name === 'DarkTheme') ||
                        tokensRef.addTheme({ group: '', name: 'DarkTheme' });

        try {
          // Пробуем привязать по ID (самый безопасный путь для RC)
          if (lightTheme) lightTheme.addSet(tokenSet.id);
          if (darkTheme) darkTheme.addSet(tokenSet.id);
          console.log('Themes linked via ID');
        } catch (e) {
          console.warn("Final linking failed, Penpot RC5 is strictly validating the schema.");
        }
      }

    } else {
      // Обычный экспорт (не токены)
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED ===');
  }
});
