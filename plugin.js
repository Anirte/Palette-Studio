penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    message.colors.forEach((c) => {
      penpot.library.createColor(c.name, c.hex);
    });

    penpot.ui.sendMessage({ 
      type: 'COLORS_ADDED', 
      count: message.colors.length 
    });
  }
});
