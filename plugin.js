penpot.ui.open("Palette Studio", `?theme=${penpot.theme}`, {
  width: 900,
  height: 640
});

// Test immediately on open
const catalog = penpot.library.local.tokens;
console.log('=== TOKEN API TEST ===');
console.log('catalog:', catalog);
console.log('catalog.sets:', catalog.sets);
console.log('catalog.themes:', catalog.themes);
console.log('addSet fn:', catalog.addSet);
console.log('addTheme fn:', catalog.addTheme);

const testSet = catalog.addSet({ name: 'TestSet' });
console.log('testSet created:', testSet);
console.log('testSet.id:', testSet.id);
console.log('testSet.addToken fn:', testSet.addToken);

const testTheme = catalog.addTheme({ group: '', name: 'TestTheme' });
console.log('testTheme created:', testTheme);
console.log('testTheme.addSet fn:', testTheme.addSet);
console.log('testTheme.addSet fn source:', testTheme.addSet.toString());

console.log('catalog.sets after addSet:', catalog.sets);
console.log('first set in catalog:', catalog.sets[0]);
console.log('is same as testSet?', catalog.sets[0] === testSet);

console.log('trying theme.addSet with catalog.sets[0]...');
try {
  testTheme.addSet(catalog.sets[0]);
  console.log('SUCCESS with catalog.sets[0]!');
} catch(e) {
  console.log('FAILED with catalog.sets[0]:', e.message);
}

penpot.ui.onMessage((message) => {
  if (message.type === 'ADD_COLORS') {
    penpot.ui.sendMessage({ type: 'COLORS_ADDED', count: 0 });
  }
});
