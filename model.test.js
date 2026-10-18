import test from 'node:test';
import assert from 'node:assert/strict';
import {shiftDate,validateData,dayTotal} from './model.js';
test('date pagination crosses month, leap year and year boundaries',()=>{assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');assert.equal(shiftDate('2024-03-01',-1),'2024-02-29');assert.equal(shiftDate('2026-12-31',1),'2027-01-01');});
const item={id:'1',name:'현미밥',meal:'lunch',calories:300};
test('backup preserves daily records and totals',()=>{const data={goal:2000,days:{'2026-10-18':{items:[item],note:'메모'}}};assert.deepEqual(validateData(JSON.parse(JSON.stringify(data))),data);assert.equal(dayTotal(data.days['2026-10-18']),300);});
test('malformed backup is rejected before replacing records',()=>{for(const input of [{goal:0,days:{}},{goal:2000,days:{'2026-02-30':{items:[],note:''}}},{goal:2000,days:{'2026-10-18':{items:[{...item,calories:-1}],note:''}}},{goal:2000,days:{'2026-10-18':{items:[item,item],note:''}}}])assert.throws(()=>validateData(input));});
