const $ = id => document.getElementById(id);
const countryById = new Map(COUNTRIES.map(c => [c.id, c]));
let mode = 'easy', questionLimit = 30, phase = 'home', questions = [], index = 0, score = 0, selected = null, history = [];
let features, mapGroup, paths, markers, projection, geoPath, zoom;
const svg = d3.select('#map');
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
}));
document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
  questionLimit = Number(button.dataset.count);
  document.querySelectorAll('[data-count]').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
  if (!$('start').disabled) $('start').textContent = `${questionLimit}問の旅をはじめる →`;
}));
function show(id, visible) { $(id).hidden = !visible; }
function setPhase(value) {
  phase = value; show('intro', value === 'home'); show('game', value === 'question' || value === 'answered');
  show('results', value === 'results'); show('how', value === 'home');
  show('shared-result', value === 'home' && Boolean(parseSharedResult(location.hash)));
  document.querySelector('.map-card').classList.toggle('playing', value === 'question');
  paths?.attr('tabindex', value === 'question' ? 0 : null);
  markers?.attr('tabindex', value === 'question' ? 0 : null);
}
function clearMap() { paths.attr('class', 'country'); markers.attr('class', 'tiny'); }
function highlight(id, state) {
  paths.filter(d => d.id === id).classed(state, true); markers.filter(d => d.id === id).classed(state, true);
}
function selectCountry(event, feature) {
  if (phase !== 'question' || event.defaultPrevented) return;
  selected = feature; clearMap(); highlight(feature.id, 'selected');
  $('answer').disabled = false; $('feedback').textContent = '選択しました。黄色の国で回答しますか？';
}
function keyboardSelect(event, feature) {
  if (event.key === 'Enter' || event.key === ' ') {selectCountry(event, feature); event.preventDefault();}
}
function resetMap() { svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); }
function ask() {
  selected = null; clearMap(); resetMap(); setPhase('question');
  $('mode-badge').textContent = mode; $('country-name').textContent = questions[index].name;
  $('question-count').textContent = `QUESTION ${String(index + 1).padStart(2, '0')} / ${questions.length}`;
  $('score-total').textContent = ` / ${questions.length}`;
  $('score').textContent = score; $('progress-bar').style.width = `${index / questions.length * 100}%`;
  $('feedback').textContent = '地図上の国を選んでください。'; $('feedback').style.color = ''; $('answer').disabled = true;
  show('answer', true); show('skip', true); show('next', false);
  $('map-note').textContent = '小さな国は拡大、または点をクリック';
  paths.attr('aria-label', (_, i) => `地図上の国・地域 ${i + 1}`);
  markers.attr('aria-label', (_, i) => `小さな国の目印 ${i + 1}`);
}
function start() {
  questions = makeQuestions(mode, questionLimit); index = 0; score = 0; history = []; $('review-details').open = false;
  $('share-status').textContent = ''; show('share-fallback', false);
  ask(); window.scrollTo({top:0, behavior:'smooth'});
}
function reveal(skip = false) {
  if (phase !== 'question' || (!skip && !selected)) return;
  const target = questions[index]; const correct = !skip && selected.id === target.id;
  if (correct) score++;
  history.push({target, selected: skip ? null : selected, correct});
  clearMap(); if (!skip && !correct) highlight(selected.id, 'wrong'); highlight(target.id, 'correct');
  setPhase('answered'); $('score').textContent = score;
  const selectionName = selected ? countryById.get(selected.id)?.name || selected.properties.name : '';
  $('feedback').textContent = correct ? `✓ 正解！ ${target.name}を見つけました。` : skip ? `答えは ${target.name}。緑色の国を確認しよう。` : `✕ 選んだのは ${selectionName}。正解の ${target.name} は緑色です。`;
  $('feedback').style.color = correct ? '#246b54' : '#9d5849';
  $('progress-bar').style.width = `${(index + 1) / questions.length * 100}%`;
  show('answer', false); show('skip', false); show('next', true);
  $('next').textContent = index === questions.length - 1 ? '結果を見る →' : '次の国へ →';
  paths.attr('aria-label', d => countryById.get(d.id)?.name || d.properties.name);
  markers.attr('aria-label', d => countryById.get(d.id)?.name || d.properties.name);
  focusCountry(target.id);
}
function focusCountry(id) {
  const feature = features.find(f => f.id === id && f.properties.name !== 'Ashmore and Cartier Is.');
  if (!feature) return;
  // Focus the largest land mass; overseas islands must not pull the view away.
  let main = feature;
  if (feature.geometry.type === 'MultiPolygon') {
    main = feature.geometry.coordinates.map(coordinates => ({type:'Feature', geometry:{type:'Polygon', coordinates}})).sort((a,b) => geoPath.area(b) - geoPath.area(a))[0];
  }
  const [[x0,y0],[x1,y1]] = geoPath.bounds(main); const scale = Math.max(1, Math.min(14, .7 / Math.max((x1-x0)/1100, (y1-y0)/540)));
  const center = [(x0+x1)/2, (y0+y1)/2];
  svg.transition().duration(650).call(zoom.transform, d3.zoomIdentity.translate(550,270).scale(scale).translate(-center[0],-center[1]));
}
function results() {
  setPhase('results'); resetMap(); clearMap(); $('final-score').textContent = score;
  $('result-heading').textContent = `${questions.length}問、おつかれさま。`; $('final-total').textContent = ` / ${questions.length}`;
  const ratio = score / questions.length;
  $('result-message').textContent = ratio === 1 ? '全問正解！ 世界の地図が、しっかり頭に入っていますね。' : ratio >= .8 ? '世界に詳しいですね。次はもっと難しい国にも挑戦しよう。' : ratio >= .5 ? 'いい旅でした。振り返ると、次はもっと見つけられるはず。' : '新しい国に出会えましたね。場所を見直して、もう一度旅へ。';
  $('review-count').textContent = `${mode} · ${questions.length}問 · 正答率 ${Math.round(ratio*100)}%`;
  $('review').replaceChildren();
  history.forEach((record, i) => {
    const row = document.createElement('div'); row.className = 'review-row';
    const number = document.createElement('span'); number.textContent = String(i+1).padStart(2,'0');
    const button = document.createElement('button'); button.textContent = `${record.correct ? '✓' : '✕'} ${record.target.name}`; if(!record.correct) button.classList.add('bad');
    button.addEventListener('click', () => {clearMap(); highlight(record.target.id, 'correct'); focusCountry(record.target.id); $('map-note').textContent = `正解の位置：${record.target.name}`; document.querySelector('.map-card').scrollIntoView({behavior:'smooth',block:'center'});});
    const answer = document.createElement('span'); answer.textContent = record.correct ? '正解' : record.selected ? `回答：${countryById.get(record.selected.id)?.name || record.selected.properties.name}` : '未回答';
    row.append(number, button, answer); $('review').append(row);
  });
  $('map-note').textContent = '振り返りの国名を押すと位置を確認できます';
  $('results').scrollIntoView({behavior:'smooth'});
}
function home() {setPhase('home'); clearMap(); resetMap(); $('map-note').textContent='世界地図をクリックして回答'; window.scrollTo({top:0,behavior:'smooth'});}
$('start').addEventListener('click', start); $('retry').addEventListener('click', start); $('home').addEventListener('click', home);
$('answer').addEventListener('click', () => reveal()); $('skip').addEventListener('click', () => reveal(true));
$('next').addEventListener('click', () => {if(phase !== 'answered') return; index++; $('feedback').style.color=''; if(index === questions.length) results(); else ask();});
$('quit').addEventListener('click', () => {if(confirm('クイズを終了して難易度選択に戻りますか？ 今回の進捗はリセットされます。')) home();});
$('zoom-in').addEventListener('click', () => svg.transition().duration(250).call(zoom.scaleBy, 1.7));
$('zoom-out').addEventListener('click', () => svg.transition().duration(250).call(zoom.scaleBy, 1/1.7));
$('reset-map').addEventListener('click', resetMap);
function renderSharedResult() {
  const shared = parseSharedResult(location.hash);
  if (shared) $('shared-result-text').textContent = `${shared.mode} · ${shared.score} / ${shared.count}問正解 · 正答率 ${Math.round(shared.score/shared.count*100)}%`;
  show('shared-result', phase === 'home' && Boolean(shared));
}
$('shared-challenge').addEventListener('click', () => {
  const shared = parseSharedResult(location.hash); if (!shared) return;
  document.querySelector(`[data-mode="${shared.mode}"]`).click(); document.querySelector(`[data-count="${shared.count}"]`).click();
  $('intro').scrollIntoView({behavior:'smooth'}); if (!$('start').disabled) start();
});
window.addEventListener('hashchange', () => {if (features && parseSharedResult(location.hash)) home(); renderSharedResult();}); renderSharedResult();
async function shareResult(copyOnly = false) {
  if (phase !== 'results') return;
  const shared = createResultShare(location.href, mode, questions.length, score);
  $('share-status').textContent = ''; show('share-fallback', false);
  if (!copyOnly && typeof navigator.share === 'function') {
    try {await navigator.share(shared); $('share-status').textContent = '結果を共有しました。'; return;}
    catch(error) {if (error.name === 'AbortError') return;}
  }
  const text = `${shared.text}\n${shared.url}`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text); $('share-status').textContent = '結果とリンクをコピーしました。好きな場所に貼り付けて共有できます。';
  } catch {
    $('share-fallback').value = text; show('share-fallback', true); $('share-fallback').focus(); $('share-fallback').select();
    $('share-status').textContent = '自動コピーを利用できません。下の結果を選択してコピーしてください。';
  }
}
$('share-result').addEventListener('click', () => shareResult()); $('copy-result').addEventListener('click', () => shareResult(true));
async function loadMap() {
  try {
    const response = await fetch('assets/world.json'); if(!response.ok) throw new Error('Map unavailable');
    const world = await response.json(); features = topojson.feature(world, world.objects.countries).features.filter(f => f.id !== '010');
    const available = new Set(features.map(f => f.id)); if(COUNTRIES.some(c => !available.has(c.id))) throw new Error('Country missing');
    projection = d3.geoEqualEarth().fitExtent([[25,20],[1075,520]], {type:'Sphere'}); geoPath = d3.geoPath(projection);
    mapGroup = svg.append('g'); mapGroup.append('path').datum(d3.geoGraticule10()).attr('d',geoPath).attr('class','graticule');
    paths = mapGroup.append('g').selectAll('path').data(features).join('path').attr('d',geoPath).attr('class','country').attr('role','button').attr('data-id',d=>d.id || '').on('click',selectCountry).on('keydown', keyboardSelect);
    const small = features.filter(f => countryById.has(f.id) && geoPath.area(f) < 14);
    markers = mapGroup.append('g').selectAll('circle').data(small).join('circle').attr('class','tiny').attr('role','button').attr('data-id',d=>d.id).attr('cx',d=>geoPath.centroid(d)[0]).attr('cy',d=>geoPath.centroid(d)[1]).attr('r',3.3).on('click',selectCountry).on('keydown', keyboardSelect);
    zoom = d3.zoom().scaleExtent([1,40]).extent([[0,0],[1100,540]]).translateExtent([[-1100,-540],[2200,1080]]).on('zoom',event => {mapGroup.attr('transform',event.transform); markers.attr('r',3.3/event.transform.k).attr('stroke-width',1/event.transform.k);});
    svg.call(zoom).on('dblclick.zoom',null);
    $('start').disabled = false; $('start').textContent = `${questionLimit}問の旅をはじめる →`; setPhase('home');
    document.querySelector('.map-info p').textContent = `Natural Earth の国境データを使用しています。国境と名称は地図データに基づき、領土に関する立場を表すものではありません。出題は地図に収録された${COUNTRIES.length}か国から難易度別に選んでいます（一部の極小国は地図データの収録対象外）。難易度は本クイズ独自の分類です。点の目印は小さな国を選びやすくするためのものです。`;
  } catch(error) {
    $('start').textContent='地図を再読み込み'; $('start').disabled=false; $('start').replaceWith($('start').cloneNode(true));
    $('start').addEventListener('click',()=>location.reload()); $('load-status').textContent='地図を読み込めませんでした。再読み込みしてください。'; console.error(error);
  }
}
loadMap();
