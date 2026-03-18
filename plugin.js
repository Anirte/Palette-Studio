penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v8.3 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE 1: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      const tokens = penpot.library.local.tokens;
      const setName = 'Palette Studio';

      // 1. Ищем или создаем Сет
      let tokenSet = tokens.sets.find(s => s.name === setName);
      if (!tokenSet) {
         tokenSet = tokens.addSet({ name: setName });
         await new Promise(r => setTimeout(r, 100));
         tokenSet = tokens.sets.find(s => s.name === setName) || tokenSet;
      }

      if (tokenSet) {
        // 2. Очищаем старые токены
        if (tokenSet.tokens && tokenSet.tokens.length > 0) {
           tokenSet.tokens.forEach(t => { if (t.remove) t.remove(); });
        }

        // 3. Создаем Темы
        let lightT = tokens.themes.find(t => t.name === 'Light') || tokens.addTheme({ name: 'Light', group: '' });
        let darkT = tokens.themes.find(t => t.name === 'Dark') || tokens.addTheme({ name: 'Dark', group: '' });

        // 4. ГРУППИРУЕМ ЦВЕТА ПО ИМЕНИ
        // Это самое важное: мы объединяем светлый и темный цвет в одну "папку"
        const groupedColors = {};

        message.colors.forEach(c => {
          let name = c.name;
          let variant = c.variant;

          // Защита: если в index.html не настроен variant, но есть суффиксы в имени (.light / .dark)
          if (!variant) {
            if (name.endsWith('.light')) { variant = 'light'; name = name.replace('.light', ''); }
            else if (name.endsWith('.dark')) { variant = 'dark'; name = name.replace('.dark', ''); }
            else variant = 'light';
          }

          if (!groupedColors[name]) groupedColors[name] = { light: null, dark: null };

          if (variant === 'dark') groupedColors[name].dark = c.hex;
          else groupedColors[name].light = c.hex;
        });

        // 5. СОЗДАЕМ УМНЫЕ ТОКЕНЫ
        Object.keys(groupedColors).forEach(name => {
          const hexLight = groupedColors[name].light;
          const hexDark = groupedColors[name].dark;

          // Базовый цвет (светлый, если есть, иначе темный)
          const baseHex = hexLight || hexDark;

          // Формируем настройки токена
          const tokenPayload = {
            type: 'color',
            name: name,
            value: baseHex
          };

          // Если есть темный цвет и темная тема - сразу прописываем привязку!
          if (hexDark && darkT) {
            tokenPayload.values = {};
            tokenPayload.values[darkT.id] = hexDark;
          }

          // Создаем токен (он автоматически получит оба цвета для разных тем)
          const token = tokenSet.addToken(tokenPayload);

          // Резервный метод для RC5 (на случай если values в payload не сработает)
          if (token && hexDark && darkT && typeof token.setThemeValue === 'function') {
              try { token.setThemeValue(darkT.id, hexDark); } catch(e) {}
          }
        });

        penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: Object.keys(groupedColors).length });
      }

    // --- MODE 2: STANDARD COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
      penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    }
  }
});
