/**
 * Change the range string values to Sentence Case.
 * @param {SpreadsheetApp.Range} range Range object to perform action
 */
function toSheetSentenceCase(range) {
  let values = range.getValues();
  for (i=0; i<values.length; i++) {
    for (j=0; j<values[0].length; j++) {
      if (typeof values[i][j] === 'string' || values[i][j] instanceof String) {
        let singleton = values[i][j].toLowerCase();
        singleton = singleton.charAt(0).toUpperCase() + singleton.slice(1);
        values[i][j] = singleton;
      }
    }
  }
  range.setValues(values);
  return values
}
