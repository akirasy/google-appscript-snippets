/**
 * Move completed/done case to archive Sheet.
 * @param {SpreadsheetApp.Sheet} sheetOrigin Original data sheet to start.
 * @param {SpreadsheetApp.Sheet} sheetDestination Target sheet to be copied into.
 * @param {Number} markerIndex The column number to search for ques.
 * @param {String} markerQue Marker que as string to trigger operation.
 * @param {Range} selectedRange Range to evaluate and move to archive.
 */
function moveToArchive(sheetOrigin, sheetDestination, markerIndex, markerQue, selectedRange) {
  let initialTime = new Date();
  let selectedRowIndex       = selectedRange.getRowIndex();
  let conditionalArray = sheetOrigin.getRange(selectedRowIndex, markerIndex, selectedRange.getNumRows()).getValues();
  let selectedRowid = conditionalArray.map((item, index) => {
    if (item[0] == markerQue) {
      let rowid = index + selectedRowIndex;
      return rowid
    };
  });
  selectedRowid.filter(item => item).forEach(rowid => {
    if (isEnoughTime(initialTime, 10)) {
      Logger.log('-- Move case to archive for rowid: ' + rowid)
      let done = sheetOrigin.getRange(rowid.toString() + ':' + rowid.toString());
      let targetRange = sheetDestination.getRange(sheetDestination.getLastRow()+1, 1);
      done.copyTo(targetRange);
      done.clear();
      done.setBackground('#cccccc');
    };
  });
}
