# ATLAS — 世界地図クイズ

実際の世界地図の国をクリックして回答するクイズです。

- easy / normal / hard / random
- 15問 / 30問を選択、各回は重複なし、時間制限なし
- 回答後に正解位置を表示し、終了後に全問を振り返り
- 「結果を共有」で端末の共有画面を開く（対応環境）。それ以外は結果とリンクをコピー
- 「結果をコピー」でもコピー可能。自動コピーが利用できない場合は選択できるテキストを表示
- 共有・コピーするテキストに、出題順で各問題の国名・正誤・回答を1行ずつ表示（未回答も明記）
- 共有リンクを開くと難易度・正解数・問題数・正答率を表示。同じ設定で、新しいランダム問題に挑戦可能

## 公開

GitHub Pages: https://fken57.github.io/world-map-quiz/

GitHub の Settings → Pages → Deploy from a branch → `main` / `/ (root)` を使用します。
`.nojekyll` を含む静的サイトで、ビルド・サーバー・ChatGPT ログインは不要です。
画像・地図・スクリプトの参照は相対パスで、GitHub Pages のプロジェクトパスに対応しています。
新しい変更を `main` に push すると GitHub Pages が再配信します。

## ローカル確認

`node server.cjs` を実行し、http://127.0.0.1:4173/world-map-quiz/ を開きます。
`node check.cjs` で4難易度×2問題数、重複、国境データとの対応、共有リンク、共有テキストの15行・30行と正誤・未回答の表記を検証します。

共有スコアはリンク内に保存された自己申告値です。サーバーで検証したランキングではありません。
リンクに個人情報や各問題の回答履歴は含めません。共有機能は投稿先を選択するまで自動投稿しません。

元の Sites 版は保全し、GitHub Pages 版には配信ファイルと確認用のスクリプトのみを移しています。

## 地図とライセンス

Natural Earth 1:50m / world-atlas 2.0.2。地図に収録された193か国を出題対象にしています。
難易度分類は本クイズ独自。国境・収録範囲は取得した地図データに基づきます。
地図: https://github.com/topojson/world-atlas
Natural Earth: https://www.naturalearthdata.com/about/terms-of-use/
D3 7.9.0 と topojson-client 3.1.0 を使用。配布物のライセンスは `assets/` に同梱しています。
