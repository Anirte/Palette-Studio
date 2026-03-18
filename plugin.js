penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

console.log('=== PLUGIN LOADED v11 ===');

// Pre-create sets and themes at load time
const catalog = penpot.library.local.tokens;
catalog.addSet({ name: 'Palette Studio/Light' });
catalog.addSet({ name: 'Palette Studio/Dark' });
catalog.addTheme({ group: '', name: 'Light' });
catalog.addTheme({ group: '', name: 'Dark' });

const lightSet = catalog.sets[catalog.sets.length - 2];
const darkSet = catalog.sets[catalog.sets.length - 1];
const lightTheme = catalog.themes[catalog.themes.length - 2];
const darkTheme = catalog.themes[catalog.themes.length - 1];

console.log('lightSet:', lightSet?.name);
console.log('darkSet:', darkSet?.name);

lightTheme.addSet(lightSet);
darkTheme.addSet(darkSet);
console.log('=== THEMES LINKED AT LOAD TIME ===');

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    if (message.mode === 'tokens') {
      const lightColors = message.colors.filter(c => c.variant === 'light');
      const darkColors = message.colors.filter(c => c.variant === 'dark');

      lightColors.forEach((c) => {
        lightSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
      darkColors.forEach((c) => {
        darkSet.addToken({ type: 'color', name: c.name, value: c.hex });
      });
    } else {
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
    }
    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: message.colors.length });
  }
});
