penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v8.0 ===');
// ВАЖНО: Убрали 'async', делаем всё строго последовательно
penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v8.0 STARTED ===');

      const tokens = penpot.library.local.tokens;
      const setName = 'PaletteStudio';

      // 1. ЧИСТКА (Синхронно)
      const existing = tokens.sets.find(s => s.name === setName);
      if (existing) existing.remove();

      // 2. СОЗДАЕМ ТЕМЫ (Явно указываем group, чтобы не было ошибки missing-key)
      let lightT = tokens.themes.find(t => t.name === 'Light') ||
                   tokens.addTheme({ name: 'Light', group: '' });

      let darkT = tokens.themes.find(t => t.name === 'Dark') ||
                  tokens.addTheme({ name: 'Dark', group: '' });

      // 3. СОЗДАЕМ СЕТ И ПРИВЯЗЫВАЕМ МГНОВЕННО
      // Мы не делаем пауз, не вызываем console.log между этими строками
      const tokenSet = tokens.addSet({ name: setName });

      if (tokenSet) {
        try {
          // Привязываем СРАЗУ. Это критично для обхода валидатора RC5
          if (lightT) lightT.addSet(tokenSet);
          if (darkT) darkT.addSet(tokenSet);
          console.log('=== LINKING ATTEMPTED ===');
        } catch (e) {
          console.error("Linking failed in synchronous block:", e);
        }

        // 4. НАПОЛНЯЕМ ЦВЕТАМИ В ПОСЛЕДНЮЮ ОЧЕРЕДЬ
        // Когда связи уже установлены, наполнение не вызовет проблем
        message.colors.forEach(c => {
          tokenSet.addToken({
            type: 'color',
            name: c.name,
            value: c.hex
          });
        });
      }

    } else {
      // Обычный экспорт
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });

    console.log('=== EXPORT FINISHED v8.0 ===');
  }
});
