const BattleLogsBattle = require('../src/lib/Battle.js');

test('should initialize battle settings', () => {
    console.log(BattleLogsBattle);
    BattleLogsBattle.initialize();
    expect(BattleLogsBattle.Settings).toBeDefined();
});

test('__internal__updateAttribute updates the attribute correctly', () => {
    const user = { name: 'User', famName: 'UserFam', tour: 0 };
    const opponent = { name: 'Opponent', famName: 'OpponentFam', dmg: 80 };
    BattleLogsBattle.__internal__updateAttribute('User', user, opponent, 'tour', 1);
    BattleLogsBattle.__internal__updateAttribute('Opponent', user, opponent, 'dmg', 1000);
    expect(user.tour).toBe(1);
    expect(opponent.dmg).toBe(1080);
});