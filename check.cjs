const assert = require('node:assert/strict');
const {COUNTRIES, makeQuestions} = require('./countries.js');
const {parseSharedResult, createResultShare} = require('./share.js');
const topology = require('./assets/world.json');
const mapIds = new Set(topology.objects.countries.geometries.map(g => g.id));
assert.equal(new Set(COUNTRIES.map(c => c.id)).size, COUNTRIES.length);
for (const country of COUNTRIES) assert.ok(mapIds.has(country.id), `Missing geometry: ${country.name}`);
for (const level of ['easy','normal','hard','random']) {
  for (const count of [15,30]) {
  for(let run=0;run<100;run++) {
    const questions=makeQuestions(level,count); assert.equal(questions.length,count);
    assert.equal(new Set(questions.map(c=>c.id)).size,count);
    if(level!=='random') assert.ok(questions.every(c=>c.level===level));
  }
  console.log(`${level}: ${count} unique questions, valid map IDs, 100 runs passed`);
  }
}
for (const level of ['easy','normal','hard','random']) for(const count of [15,30]) for(const score of [0,1,count]) {
  const share = createResultShare('https://fken57.github.io/world-map-quiz/?old=1#old',level,count,score);
  assert.deepEqual(parseSharedResult(new URL(share.url).hash),{mode:level,count,score});
  assert.equal(new URL(share.url).pathname,'/world-map-quiz/');
  assert.equal(new URL(share.url).search,''); assert.ok(share.text.includes(`${score}/${count}`));
}
for(const hash of ['#result=easy.15.16','#result=unknown.30.0','#result=hard.20.2','#result=easy.15.-1','#result=easy.15.1<script>','#result=random.30.NaN','']) assert.equal(parseSharedResult(hash),null);
assert.throws(()=>createResultShare('https://example.com/','easy',15,16));
console.log('Share links: round trips, invalid input, and project subpath passed');
for(const count of [15,30]) {
  const answers = Array.from({length:count},(_,index) => index===0 ? {country:'日本',correct:true,answer:'日本'} : index===1 ? {country:'フランス',correct:false,answer:'ドイツ'} : {country:'カナダ',correct:false,answer:null});
  const share = createResultShare('https://fken57.github.io/world-map-quiz/','easy',count,1,answers);
  const lines = share.text.split('\n').filter(line => /^\d{2}\. /.test(line));
  assert.equal(lines.length,count);
  assert.equal(lines[0],'01. ✓ 日本（正解）');
  assert.equal(lines[1],'02. ✕ フランス（回答：ドイツ）');
  assert.equal(lines[2],'03. − カナダ（未回答）');
  assert.ok(lines.at(-1).startsWith(`${count}. `));
  assert.deepEqual(parseSharedResult(new URL(share.url).hash),{mode:'easy',count,score:1});
}
console.log('Shared breakdown: 15/30 lines, correct/wrong/unanswered, Japanese names, and unchanged score links passed');
console.log(`Country pool: ${COUNTRIES.length}`);
