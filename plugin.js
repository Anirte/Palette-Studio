penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v9.0 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {
    console.log('=== EXPORT TOKENS v9.0 STARTED ===');

    // --- MODE 1: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      // 1. РАЗДЕЛЯЕМ ЦВЕТА И ОЧИЩАЕМ ИМЕНА
      // Токены должны называться одинаково в обоих сетах (например: core.primary)
      const lightColors = [];
      const darkColors =[];

      message.colors.forEach(c => {
        // Убираем суффиксы .light и .dark из имени
        let cleanName = c.name.replace('.light', '').replace('.dark', '');

        if (c.name.endsWith('.dark') || c.variant === 'dark') {
          darkColors.push({ name: cleanName, hex: c.hex });
        } else {
          lightColors.push({ name: cleanName, hex: c.hex });
        }
      });

      // 2. СОЗДАЕМ СЕТЫ (Исправление главного бага: передаем СТРОКУ, а не объект!)
      let lightSet = catalog.sets.find(s => s.name === 'Palette Studio - Light');
      if (!lightSet) {
         // В API Penpot addSet принимает строку!
         lightSet = catalog.addSet('Palette Studio - Light');
      }

      let darkSet = catalog.sets.find(s => s.name === 'Palette Studio - Dark');
      if (!darkSet) {
         darkSet = catalog.addSet('Palette Studio - Dark');
      }

      // Очищаем старые токены внутри сетов (если юзер экспортирует второй раз)
      [lightSet, darkSet].forEach(set => {
        if (set && set.tokens) {
          set.tokens.forEach(t => t.remove());
        }
      });

      // 3. ДОБАВЛЯЕМ ТОКЕНЫ В СЕТЫ
      if (lightSet) {
        lightColors.forEach(c => lightSet.addToken({ type: 'color', name: c.name, value: c.hex }));
      }
      if (darkSet) {
        darkColors.forEach(c => darkSet.addToken({ type: 'color', name: c.name, value: c.hex }));
      }

      // 4. СОЗДАЕМ ТЕМЫ (Здесь передаем объект с обязательным group: "")
      let lightTheme = catalog.themes.find(t => t.name === 'Light Theme') ||
                       catalog.addTheme({ name: 'Light Theme', group: '' });

      let darkTheme = catalog.themes.find(t => t.name === 'Dark Theme') ||
                      catalog.addTheme({ name: 'Dark Theme', group: '' });

      // 5. ПРИВЯЗЫВАЕМ СЕТЫ К ТЕМАМ
      try {
        if (lightTheme && lightSet) lightTheme.addSet(lightSet);
        if (darkTheme && darkSet) darkTheme.addSet(darkSet);
        console.log('=== THEMES LINKED SUCCESSFULLY ===');
      } catch (e) {
        console.warn("Auto-linking failed. You might need to link them manually in Penpot.", e);
      }

    // --- MODE 2: STANDARD COLORS (Старые добрые обычные цвета) ---
    } else {
      message.colors.forEach((c) => {
        // Создаем обычный цвет (передаем объект, как требует этот конкретный метод)
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED v9.0 ===');
  }
});
