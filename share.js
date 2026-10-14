function parseSharedResult(hash) {
  const match = /^#result=(easy|normal|hard|random)\.(15|30)\.(\d{1,2})$/.exec(hash);
  if (!match || Number(match[3]) > Number(match[2])) return null;
  return {mode:match[1], count:Number(match[2]), score:Number(match[3])};
}
function createResultShare(href, mode, count, score, answers = []) {
  const hash = `#result=${mode}.${count}.${score}`;
  if (!parseSharedResult(hash)) throw new Error('Invalid quiz result');
  const url = new URL(href); url.search = ''; url.hash = hash;
  const breakdown = answers.map((record, index) => {
    const number = String(index + 1).padStart(2, '0');
    if (record.correct) return `${number}. ✓ ${record.country}（正解）`;
    return record.answer ? `${number}. ✕ ${record.country}（回答：${record.answer}）` : `${number}. − ${record.country}（未回答）`;
  }).join('\n');
  const details = breakdown ? `\n\n結果の内訳\n${breakdown}\n` : '';
  return {title:'世界地図クイズ — ATLAS', text:`世界地図クイズに挑戦！\n${mode} · ${score}/${count}問正解（正答率 ${Math.round(score/count*100)}%）${details}\nあなたも挑戦してみよう！ #世界地図クイズ`, url:url.href};
}
if (typeof module !== 'undefined') module.exports = {parseSharedResult, createResultShare};
