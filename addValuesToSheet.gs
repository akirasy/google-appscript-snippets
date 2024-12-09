/**
 * Add 2-dimension values to sheet.
 * @param {SpreadsheetApp.Sheet} sheet Sheet object to perform action
 * @param {Array^2} values 2-dimension values
 * @param {Number} startRow Start row number
 * @param {Number} startColumn Start column number
 */
function addValuesToSheet(sheet, values, startRow, startColumn) {
  if (values.length != 0) {
    sheet
      .getRange(startRow, startColumn, values.length, values[0].length)
      .setValues(values);
  };
}
