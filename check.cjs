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
console.log(`Country pool: ${COUNTRIES.length}`);
