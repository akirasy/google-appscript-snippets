/**
 * Get header key index value and return as `name:index` object/dictionary.
 * @param {Object} sheetObj The spreadsheet object to read from.
 */
function getHeaderKey(sheetObj) {
  let output = new Object();
  let headerKey = sheetObj.getRange(1, 1, 1, sheetObj.getMaxColumns()).getValues();
  headerKey[0].forEach((item, index) => { output[item] = index });
  return output
}
