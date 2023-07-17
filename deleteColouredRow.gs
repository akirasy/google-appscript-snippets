/**
 * Delete row that has colour in selected column
 * @param {SpreadsheetApp.Sheet} sheetObj The sheet to read from.
 * @param {Number} indexColumnMarker The column number to search for.
 * @param {String} hexColour The hex colour. eg. `#cccccc`
 */
function deleteColouredRow(sheetObj, indexColumnMarker, hexColour) {
  let initialTime = new Date();
  let allRow = sheetObj.getRange(1, indexColumnMarker, sheetObj.getLastRow());
  let colouredRowA1Notation = allRow.getBackgrounds().map((item, index) => {
    if (item[0] == hexColour) {
      let a1Notation = (index+1).toString() + ':' + (index+1).toString();
      return a1Notation
    };
  });
  colouredRowA1Notation.filter(item => item).reverse().forEach(item => {
    if (isEnoughTime(initialTime, 10)) {
      Logger.log('Delete rowid: ' + item);
      sheetObj.getRange(item).deleteCells(SpreadsheetApp.Dimension.ROWS);
    };
  });
}
