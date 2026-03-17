penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {

    if (message.mode === 'tokens') {
      const catalog = penpot.library.local.tokens;

      // Find existing set named "Palette Studio" or create a new one
      let tokenSet = catalog.sets.find(s => s.name === 'Palette Studio');
      if (!tokenSet) {
        tokenSet = catalog.addSet({ name: 'Palette Studio' });
      }

      message.colors.forEach((c) => {
        tokenSet.addToken({
          type: 'color',
          name: c.name,
          value: c.hex
        });
      });

    } else {
      message.colors.forEach((c) => {
        const newColor = penpot.library.local.createColor();
        newColor.name = c.name;
        newColor.color = c.hex;
      });
    }

    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });
  }
});
