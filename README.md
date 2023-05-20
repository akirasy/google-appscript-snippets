# Google Appscript Snippets

A collection of multi purpose code for use in Google Appscript.

## CopyFolder.gs

Since Google Drive doesn't provide native way to copy folder to another,
we need a script to do so.
This script copies the contents of folder to other folder recursively,
even if the destination folder is accessible and managed by other GSUITE
organization (if the visibility is set to PUBLIC).

## isEnoughTime.gs

Google Appscript only allow execution of code for a brief period. When execution
time exceeds, script will abort immediately and will cause unexpected results.
This script will check if still enough time to run another process.
Appscript only allow 6 minutes of execution time.

## getHeaderKey.gs

To easily get column number in Google Spreadsheet, create `header_key` on `Row 1`.
This function will scan through `Row 1` and map it into integer begining with `0`.
Get header key index value and return as `name:index` object/dictionary.
Example use:
```
let headerKey = getHeaderKey(Drive.Sheet);
let sheet = SpreadsheetApp.getActiveSheet();

let genActionQue = sheet.getRange(1, headerKey.gen_action+1).getValue();
```

## promptPassword.gs

Prompt user for password before further execution. Returns `boolean`.
Set a password inside the function.
Do notice that password is using plain text and is not a reliable
security measure.

## deleteGreyedRow.gs

Action to delete row that has colour `Grey` in `Column A`. This is often
used in cleaning up empty rows with the colour `Grey` as an indicator.
To change indicator colour, simply change in the function.

## aboutGoogleAppScript.gs

A simple alert message to show about Google Appscript.

# License

This app is licensed under [GNU GPLv3](LICENSE).<br>Feel free to use under the terms of this license.
