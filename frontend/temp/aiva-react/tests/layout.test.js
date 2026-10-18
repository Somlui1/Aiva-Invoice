import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_CONFIG } from '../src/components/layout/menuConfig.js';

test('MENU_CONFIG includes all 8 standard system menus', () => {
  const allKeys = MENU_CONFIG.flatMap(sec => sec.items.map(it => it.key));
  assert.equal(allKeys.length, 8, 'Must have exactly 8 menu items');
  
  const expectedKeys = ['queue', 'ap', 'rbac', 'audit', 'settings', 'cases', 'std', 'sim'];
  for (const k of expectedKeys) {
    assert.ok(allKeys.includes(k), `Should include menu ${k}`);
  }
});

test('MENU_CONFIG organizes into 3 sections: work, gov, dev', () => {
  assert.equal(MENU_CONFIG.length, 3, 'Must have 3 menu sections');
  assert.equal(MENU_CONFIG[0].title, 'งานหลัก');
  assert.equal(MENU_CONFIG[1].title, 'การกำกับดูแล');
  assert.equal(MENU_CONFIG[2].title, 'เครื่องมือทดสอบและพัฒนา');
});
