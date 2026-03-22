// =============================================
// Retrieve SPREADSHEET_ID from script properties
// Setup: GAS Editor → Project Settings → Script Properties
// =============================================
function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('スクリプトプロパティに「SPREADSHEET_ID」が設定されていません');
  }
  return id;
}

/**
 * Web App entry point
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ペアリング抽選会')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Helper to include CSS/JS within HTML templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Return the spreadsheet URL
 */
function getSpreadsheetUrl() {
  return 'https://docs.google.com/spreadsheets/d/' + getSpreadsheetId_();
}

/**
 * Fetch employee list from the spreadsheet
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
    throw new Error('メンバーリストの取得に失敗しました: ' + e.message);
  }
}
