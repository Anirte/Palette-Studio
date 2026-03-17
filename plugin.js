penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    message.colors.forEach((c) => {
      penpot.library.local.colors.create({ 
        name: c.name, 
        color: c.hex 
      });
    });
    penpot.ui.sendMessage({ 
      type: 'COLORS_ADDED', 
      count: message.colors.length 
    });
  }
});