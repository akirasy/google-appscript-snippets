/**
 * Delete row that has colour grey in column A
 */
function deleteGreyedRow() {
  let initialTime = new Date();
  let projectVar = getProjectVariables();
  let sheet = SpreadsheetApp.getActiveSheet();
  let allRow = sheet.getRange(1,1,sheet.getLastRow());
  let greyedRowA1Notation = allRow.getBackgrounds().map((item, index) => {
    if (item[0] == '#cccccc') {
      let a1Notation = (index+1).toString() + ':' + (index+1).toString();
      return a1Notation
    };
  });
  greyedRowA1Notation.filter(item => item).reverse().forEach(item => {
    if (isEnoughTime(initialTime, 1)) {
      Logger.log('Delete rowid: ' + item);
      sheetKesPositif.getRange(item).deleteCells(SpreadsheetApp.Dimension.ROWS);
    };
  });
}
