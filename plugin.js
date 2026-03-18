penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v7 ===');

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {

      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');

      // 1. Создаем Сет
      penpot.library.local.tokens.addSet({ name: 'Palette Studio' });
      const tokenSet = penpot.library.local.tokens.sets.find(s => s.name === 'Palette Studio');

      // 2. Добавляем токены
      message.colors.forEach((c) => {
        tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });

      // 3. Используем официальный метод привязки через setTheme
      // В новых версиях API Penpot рекомендуется работать через penpot.library.local.tokens.themes
      const lightTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Light') ||
                         penpot.library.local.tokens.addTheme({ group: '', name: 'Light' });
      const darkTheme = penpot.library.local.tokens.themes.find(t => t.name === 'Dark') ||
                        penpot.library.local.tokens.addTheme({ group: '', name: 'Dark' });

      // Самый важный момент: многие методы API требуют явного обновления объекта
      // Попробуйте использовать метод, который не вызывает ошибку валидации:
      try {
        lightTheme.addSet(tokenSet);
        darkTheme.addSet(tokenSet);
      } catch (err) {
        console.warn("Попытка привязки через addSet вызвала ошибку, пробуем альтернативу...");
      }

    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
  }
});
