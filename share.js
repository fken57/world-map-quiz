function parseSharedResult(hash) {
  const match = /^#result=(easy|normal|hard|random)\.(15|30)\.(\d{1,2})$/.exec(hash);
  if (!match || Number(match[3]) > Number(match[2])) return null;
  return {mode:match[1], count:Number(match[2]), score:Number(match[3])};
}
function createResultShare(href, mode, count, score) {
  const hash = `#result=${mode}.${count}.${score}`;
  if (!parseSharedResult(hash)) throw new Error('Invalid quiz result');
  const url = new URL(href); url.search = ''; url.hash = hash;
  return {title:'世界地図クイズ — ATLAS', text:`世界地図クイズに挑戦！\n${mode} · ${score}/${count}問正解（正答率 ${Math.round(score/count*100)}%）\nあなたも挑戦してみよう！ #世界地図クイズ`, url:url.href};
}
if (typeof module !== 'undefined') module.exports = {parseSharedResult, createResultShare};
