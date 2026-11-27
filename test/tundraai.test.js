'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const ai=require('../tundraai.js');
test('Qor Malikasi identity',()=>assert.equal(ai.profile.uid,'bot_qor_malikasi'));
test('Unconfigured engine fails without substituting another engine',async()=>{
 const old=process.env.TUNDRA_BRIDGE;
 delete process.env.TUNDRA_BRIDGE;
 try{const r=await new Promise(resolve=>ai.move({board:Array(64).fill(0),side:1,time:1},resolve));assert.equal(r.error,'Tundra adapter not configured');}
 finally{if(old!==undefined)process.env.TUNDRA_BRIDGE=old;}
});
test('Invalid board rejected before launching adapter',async()=>{
 const old=process.env.TUNDRA_BRIDGE;
 process.env.TUNDRA_BRIDGE='/nonexistent-tundra-test';
 try{const r=await new Promise(resolve=>ai.move({board:[],side:1},resolve));assert.equal(r.error,'Invalid position');}
 finally{if(old===undefined)delete process.env.TUNDRA_BRIDGE;else process.env.TUNDRA_BRIDGE=old;}
});
