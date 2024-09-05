/**
 * Get rowids that has specific color.
 * @param {String} hexColor Color (in hex) to search for.
 * @param {SpreadsheetApp.Sheet} Sheet to search into.
 */
function getColoredRowids(hexColor, sheet) {
  let dataRange = sheet.getDataRange();
  let backgroundColors = dataRange.getBackgrounds().map((item, index) => {
    if (item[0] == hexColor) {
      return index + 1
    }
  })
  return backgroundColors.filter(item => item)
}
