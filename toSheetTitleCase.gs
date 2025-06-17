/**
 * Change the range string values to Sentence Case.
 * @param {SpreadsheetApp.Range} range Range object to perform action
 */
function toSheetTitleCase(range) {
  let values = range.getValues();
  for (i=0; i<values.length; i++) {
    for (j=0; j<values[0].length; j++) {
      let singleton = values[i][j];
      if (typeof singleton === 'string' || singleton instanceof String) {
        values[i][j] = singleton
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  }
  range.setValues(values);
  return values
}
