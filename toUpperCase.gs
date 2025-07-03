/**
 * Convert selection to UPPERCASE value.
 */
function toUpperCase() {
  let selectedRange = SpreadsheetApp.getActiveRange();
  let dataList = selectedRange.getValues();
  for (let i=0; i<dataList.length; i++) {
    for (let j=0; j<dataList[i].length; j++) {
      let value = dataList[i][j];
      if (!(value instanceof Date)) {
        value = value.toString().toUpperCase();
        dataList[i][j] = value;
      };
    };
  };
  selectedRange.setValues(dataList);
}
