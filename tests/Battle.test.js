const BattleLogsBattle = require('../src/lib/Battle.js');

test('should initialize battle settings', () => {
    console.log(BattleLogsBattle);
    BattleLogsBattle.initialize();
    expect(BattleLogsBattle.Settings).toBeDefined();
});