// =============================================
// スクリプトプロパティ「SPREADSHEET_ID」から取得
// 設定方法: GASエディタ → プロジェクトの設定 → スクリプトプロパティ
// =============================================
function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('スクリプトプロパティに「SPREADSHEET_ID」が設定されていません');
  }
  return id;
}

/**
 * Web App のエントリポイント
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ペアリング抽選会')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTML テンプレート内で CSS/JS をインクルードするヘルパー
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * スプレッドシートのURLを返す
 */
function getSpreadsheetUrl() {
  return 'https://docs.google.com/spreadsheets/d/' + getSpreadsheetId_();
}

/**
 * スプレッドシートから社員リストを取得
 */
function getEmployeeList() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    const sheet = ss.getSheetByName('Members');
    if (!sheet) {
      throw new Error('シート「Members」が見つかりません');
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    return data
      .filter(row => row[0] === true)
      .map(row => row[1].toString().trim())
      .filter(name => name.length > 0);
  } catch (e) {
    throw new Error('社員リストの取得に失敗しました: ' + e.message);
  }
}
