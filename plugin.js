penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v10.0 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS' && message.mode === 'tokens') {
    const catalog = penpot.library.local.tokens;
    const setName = 'PaletteStudio';

    // 1. Создаем один общий Сет
    let tokenSet = catalog.sets.find(s => s.name === setName) || catalog.addSet({ name: setName });

    // 2. Получаем или создаем темы
    let lightT = catalog.themes.find(t => t.name === 'Light') || catalog.addTheme({ name: 'Light', group: '' });
    let darkT = catalog.themes.find(t => t.name === 'Dark') || catalog.addTheme({ name: 'Dark', group: '' });

    // 3. Группируем цвета по имени (например: "primary")
    const grouped = {};
    message.colors.forEach(c => {
      let name = c.name.replace('.light', '').replace('.dark', '').replace(/\s+/g, '-');
      if (!grouped[name]) grouped[name] = { light: null, dark: null };
      if (c.variant === 'dark' || c.name.endsWith('.dark')) grouped[name].dark = c.hex;
      else grouped[name].light = c.hex;
    });

    // 4. Заполняем сет умными токенами
    Object.keys(grouped).forEach(name => {
      const data = grouped[name];

      // Создаем токен со светлым значением по умолчанию
      const token = tokenSet.addToken({
        type: 'color',
        name: name,
        value: data.light || data.dark
      });

      // ПРИВЯЗКА К ТЕМАМ (через setThemeValue)
      // В твоем файле tokens.cljs видно, что Penpot ожидает именно такую логику:
      if (token && data.dark) {
         // Привязываем темный цвет к ID темной темы
         token.setThemeValue(darkT.id, data.dark);
      }
      if (token && data.light) {
         // Привязываем светлый цвет к ID светлой темы
         token.setThemeValue(lightT.id, data.light);
      }
    });

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: Object.keys(grouped).length });
  }
});
