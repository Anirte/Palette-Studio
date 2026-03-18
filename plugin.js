penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.3 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS STARTED (CLEAN RECREATE MODE) ===');

      const setName = 'Palette Studio';
      const tokensRef = penpot.library.local.tokens;

      // 1. Удаляем старый сет, если он есть, чтобы получить "свежий" объект
      const existingSet = tokensRef.sets.find(s => s.name === setName);
      if (existingSet) {
        existingSet.remove();
        console.log('Old set removed');
      }

      // 2. Создаем НОВЫЙ сет и СРАЗУ сохраняем его в переменную
      // Этот объект - "чистый" прокси, который Penpot примет
      const tokenSet = tokensRef.addSet({ name: setName });

      if (!tokenSet) {
        console.error("Failed to create TokenSet");
        return;
      }

      // 3. Добавляем токены
      message.colors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // 4. Темы
      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');

      if (lightColors.length > 0 && darkColors.length > 0) {
        // Микро-пауза для синхронизации базы RC-версии
        await new Promise(r => setTimeout(r, 150));

        let lightTheme = tokensRef.themes.find(t => t.name === 'Light') ||
                         tokensRef.addTheme({ group: '', name: 'Light' });

        let darkTheme = tokensRef.themes.find(t => t.name === 'Dark') ||
                        tokensRef.addTheme({ group: '', name: 'Dark' });

        try {
          // ВАЖНО: Передаем именно свежесозданный объект tokenSet
          if (lightTheme) lightTheme.addSet(tokenSet);
          if (darkTheme) darkTheme.addSet(tokenSet);
          console.log('=== THEMES LINKED SUCCESSFULLY ===');
        } catch (e) {
          console.error("Penpot RC Validation Error:", e);
          // Если addSet(tokenSet) не сработал, пробуем последний шанс - addSet(tokenSet.id)
          try {
            lightTheme.addSet(tokenSet.id);
            darkTheme.addSet(tokenSet.id);
            console.log('=== THEMES LINKED VIA ID (FALLBACK) ===');
          } catch (e2) {
             console.error("All linking methods failed in this Penpot RC version.");
          }
        }
      }

    } else {
      // Обычный экспорт цветов (не токены)
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED ===');
  }
});
