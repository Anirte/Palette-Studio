penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    message.colors.forEach((c) => {
      const newColor = penpot.library.local.createColor();
      newColor.name = c.name;
      newColor.color = c.hex;
    });
    penpot.ui.sendMessage({
      type: 'COLORS_ADDED',
      count: message.colors.length
    });
  }
});
