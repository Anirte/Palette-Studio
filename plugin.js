penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7.7 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v7.7 STARTED ===');

      const tokens = penpot.library.local.tokens;
      const setName = 'PaletteStudio';

      // 1. УДАЛЯЕМ СТАРЫЙ СЕТ
      // Это критично для RC5, чтобы избежать конфликтов ID в памяти
      const existing = tokens.sets.find(s => s.name === setName);
      if (existing) existing.remove();

      // 2. СОЗДАЕМ ТЕМЫ С ОБЯЗАТЕЛЬНЫМ ПОЛЕМ GROUP
      // Лог v7.5 четко показал: без group: "" Penpot выдает ошибку валидации
      let lightT = tokens.themes.find(t => t.name === 'Light') ||
                   tokens.addTheme({ name: 'Light', group: "" });

      let darkT = tokens.themes.find(t => t.name === 'Dark') ||
                  tokens.addTheme({ name: 'Dark', group: "" });

      // 3. СОЗДАЕМ СЕТ
      // Мы берем тот объект, который вернула функция - это "живой" прокси
      const freshSet = tokens.addSet({ name: setName });

      if (freshSet) {
        // 4. ДОБАВЛЯЕМ ТОКЕНЫ
        message.colors.forEach(c => {
          freshSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

        // 5. ПРИВЯЗЫВАЕМ К ТЕМАМ
        // Мы используем ПРЯМОЙ вызов addSet(freshSet)
        try {
          if (lightT) lightT.addSet(freshSet);
          if (darkT) darkT.addSet(freshSet);
          console.log('=== SUCCESS: Linking completed ===');
        } catch (e) {
          console.warn("Proxy linking failed, trying to refetch...");
          // Если прямой объект не прошел, пробуем заново найти его в базе
          // Иногда в RC5 это "освежает" прокси
          const refetchedSet = tokens.sets.find(s => s.name === setName);
          try {
            if (lightT) lightT.addSet(refetchedSet);
            if (darkT) darkT.addSet(refetchedSet);
            console.log('=== SUCCESS: Linking completed with refetched set ===');
          } catch (e2) {
            console.error("Penpot RC5 is blocking programmatic linking.");
          }
        }
      }

    } else {
      // Стандартный экспорт цветов
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED v7.7 ===');
  }
});
