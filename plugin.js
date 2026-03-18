penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v9.2 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {
    console.log('=== EXPORT TOKENS v9.2 STARTED ===');

    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      // 1. РАЗДЕЛЯЕМ ЦВЕТА
      const lightColors = [];
      const darkColors =[];

      message.colors.forEach(c => {
        // Имя токена тоже НЕ ДОЛЖНО содержать пробелов (по правилам Penpot)!
        // Заменяем пробелы на дефисы, убираем .light/.dark
        let cleanName = c.name.replace('.light', '').replace('.dark', '').replace(/\s+/g, '-');

        if (c.name.endsWith('.dark') || c.variant === 'dark') {
          darkColors.push({ name: cleanName, hex: c.hex });
        } else {
          lightColors.push({ name: cleanName, hex: c.hex });
        }
      });

      // 2. СОЗДАЕМ СЕТЫ (Имя СТРОГО по схеме: без пробелов)
      const lightSetName = 'PaletteStudio-Light';
      let lightSet = catalog.sets.find(s => s.name === lightSetName);
      if (!lightSet) lightSet = catalog.addSet({ name: lightSetName });

      const darkSetName = 'PaletteStudio-Dark';
      let darkSet = catalog.sets.find(s => s.name === darkSetName);
      if (!darkSet) darkSet = catalog.addSet({ name: darkSetName });

      // Очистка старых токенов (ИСправлена синтаксическая ошибка здесь)
      [lightSet, darkSet].forEach(set => {
        if (set && set.tokens) set.tokens.forEach(t => t.remove());
      });

      // 3. ДОБАВЛЯЕМ ТОКЕНЫ
      if (lightSet) lightColors.forEach(c => lightSet.addToken({ type: 'color', name: c.name, value: c.hex }));
      if (darkSet) darkColors.forEach(c => darkSet.addToken({ type: 'color', name: c.name, value: c.hex }));

      // 4. СОЗДАЕМ ТЕМЫ (Обязательно group: "")
      let lightTheme = catalog.themes.find(t => t.name === 'Light') || catalog.addTheme({ name: 'Light', group: '' });
      let darkTheme = catalog.themes.find(t => t.name === 'Dark') || catalog.addTheme({ name: 'Dark', group: '' });

      // 5. ПРИВЯЗКА
      try {
        if (lightTheme && lightSet) lightTheme.addSet(lightSet);
        if (darkTheme && darkSet) darkTheme.addSet(darkSet);
        console.log('=== THEMES LINKED SUCCESSFULLY ===');
      } catch (e) {
        console.warn("Linking failed.", e);
      }

    } else {
      // Обычный экспорт (не токены)
      message.colors.forEach((c) => {
        let cleanName = c.name.replace(/\s+/g, '-');
        penpot.library.createColor({ name: cleanName, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED v9.2 ===');
  }
});
