penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});
console.log('=== PLUGIN LOADED v8.1 ===');

penpot.ui.onMessage(async (message) => {
  if (message.type === 'ADD_COLORS') {

    // --- MODE 1: DESIGN TOKENS ---
    if (message.mode === 'tokens') {
      console.log('=== EXPORT TOKENS v8.1 STARTED ===');

      const tokens = penpot.library.local.tokens;
      const setName = 'Palette Studio'; // Вернули красивое имя

      // 1. ИЩЕМ СЕТ, ВМЕСТО ТОГО ЧТОБЫ УДАЛЯТЬ
      let tokenSet = tokens.sets.find(s => s.name === setName);

      // Если его нет - создаем
      if (!tokenSet) {
         tokenSet = tokens.addSet({ name: setName });
         await new Promise(r => setTimeout(r, 150)); // Ждем фиксации в базе
         tokenSet = tokens.sets.find(s => s.name === setName) || tokenSet;
      }

      if (tokenSet) {
        // 2. ЧИСТИМ СТАРЫЕ ТОКЕНЫ ВНУТРИ СЕТА (чтобы не было дубликатов при повторном экспорте)
        if (tokenSet.tokens && tokenSet.tokens.length > 0) {
           tokenSet.tokens.forEach(t => {
             if (t.remove) t.remove();
           });
        }

        // 3. ДОБАВЛЯЕМ НОВЫЕ ЦВЕТА
        message.colors.forEach(c => {
          tokenSet.addToken({ type: 'color', name: c.name, value: c.hex });
        });

        // 4. ТЕМЫ (Обязательно с group: '')
        let lightT = tokens.themes.find(t => t.name === 'Light') || tokens.addTheme({ name: 'Light', group: '' });
        let darkT = tokens.themes.find(t => t.name === 'Dark') || tokens.addTheme({ name: 'Dark', group: '' });

        // 5. ПРИВЯЗКА К ТЕМАМ
        // Мы вызываем метод, и если баг Penpot RC5 выдаст "Value not valid" в консоль -
        // наш скрипт всё равно пойдет дальше и цвета останутся в библиотеке!
        try {
          if (lightT && lightT.addSet) lightT.addSet(tokenSet);
          if (darkT && darkT.addSet) darkT.addSet(tokenSet);
          console.log('=== THEMES LINK ATTEMPTED ===');
        } catch (e) {
          console.warn("Theme linking handled by Penpot internally");
        }
      } else {
        console.error("Critical: Cannot initialize Token Set");
      }

    // --- MODE 2: STANDARD COLORS ---
    } else {
      message.colors.forEach((c) => {
        penpot.library.createColor({ name: c.name, color: c.hex });
      });
    }

    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
    console.log('=== EXPORT FINISHED v8.1 ===');
  }
});
