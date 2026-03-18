penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      catalog.addSet({ name: 'Debug' });
      const freshSet = catalog.sets.find(s => s.name === 'Debug');
      console.log('freshSet in sendMessage:', freshSet);

      catalog.addTheme({ group: '', name: 'DebugTheme' });
      const theme = catalog.themes.find(t => t.name === 'DebugTheme');
      console.log('theme in sendMessage:', theme);

      try {
        theme.addSet(freshSet);
        console.log('SUCCESS in sendMessage!');
      } catch(e) {
        console.log('FAILED in sendMessage:', e.message);
      }
    }
    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: 0 });
  }
});
