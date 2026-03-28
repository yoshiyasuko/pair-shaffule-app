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
  return HtmlService.createTemplateFromFile('client/Index')
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
/**
 * Export pair results to a new spreadsheet copied from template
 */
function exportPairsToSpreadsheet(pairsData) {
  try {
    var templateId = PropertiesService.getScriptProperties().getProperty('EXPORT_TEMPLATE_SPREADSHEET_ID');
    if (!templateId) {
      throw new Error('スクリプトプロパティに「EXPORT_TEMPLATE_SPREADSHEET_ID」が設定されていません');
    }

    // Determine fiscal year and period (8月決算: 9-2月=上期, 3-8月=下期)
    var now = new Date();
    var month = now.getMonth() + 1; // 1-based
    var year = now.getFullYear();
    var fiscalYear, period;
    if (month >= 9) {
      fiscalYear = year;
      period = '上';
    } else if (month <= 2) {
      fiscalYear = year - 1;
      period = '上';
    } else {
      fiscalYear = year - 1;
      period = '下';
    }
    var yy = String(fiscalYear).slice(-2);

    // Build title from template name
    var templateFile = DriveApp.getFileById(templateId);
    var baseTitle = templateFile.getName()
      .replace('【テンプレ】', '')
      .replace('{YY}', yy)
      .replace('{上/下}', period)
      .trim();

    // Check for duplicates in the GAS project's folder
    var scriptFile = DriveApp.getFileById(ScriptApp.getScriptId());
    var folders = scriptFile.getParents();
    var folder = folders.hasNext() ? folders.next() : null;
    var finalTitle = baseTitle;
    if (folder) {
      var suffix = 2;
      while (folder.getFilesByName(finalTitle).hasNext()) {
        finalTitle = baseTitle + '-' + suffix;
        suffix++;
      }
    }

    // Copy template into the GAS project's folder
    var copiedFile = folder
      ? templateFile.makeCopy(finalTitle, folder)
      : templateFile.makeCopy(finalTitle);

    // Share with organization as editor
    copiedFile.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.EDIT);

    // Open copied spreadsheet and find 管理 sheet
    var ss = SpreadsheetApp.openById(copiedFile.getId());
    var sheet = ss.getSheetByName('管理');
    if (!sheet) {
      throw new Error('コピー先スプレッドシートに「管理」シートが見つかりません');
    }

    // Find メンバー header column in row 1
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var memberCol = -1;
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'メンバー') {
        memberCol = i + 1; // 1-based
        break;
      }
    }
    if (memberCol === -1) {
      throw new Error('「管理」シートに「メンバー」ヘッダーが見つかりません');
    }

    // Build flat list of names from pairs
    var names = [];
    for (var j = 0; j < pairsData.length; j++) {
      var pair = pairsData[j];
      for (var k = 0; k < pair.names.length; k++) {
        names.push([pair.names[k]]);
      }
      if (pair.solo) {
        names.push(['-']);
      }
    }

    // Write names below header
    if (names.length > 0) {
      sheet.getRange(2, memberCol, names.length, 1).setValues(names);
    }

    return ss.getUrl();
  } catch (e) {
    throw new Error('スプレッドシートへの出力に失敗しました: ' + e.message);
  }
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
