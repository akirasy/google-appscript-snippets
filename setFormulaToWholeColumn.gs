/**
 * Set formula to column till the end of rows.
 * @param {SpreadsheetApp.Sheet} sheet Sheet object to perform action
 * @param {String} columnAlphabet Column alphabet
 * @param {Number} startRow Start row number
 * @param {Number} formula Formula to set in cell
 */
function setFormulaToWholeColumn(sheet, columnAlphabet, startRow, formula) {
  let templateA1Notation = columnAlphabet + startRow.toString();
  let template = sheet.getRange(templateA1Notation);
  template.setFormula(formula);
  template.copyTo(sheet.getRange(templateA1Notation + ':' + columnAlphabet), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
}
