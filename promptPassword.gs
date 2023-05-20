/**
 * Prompt user for password before further execution. Returns `boolean`.
 */
function promptPassword() {
  Logger.log('Waiting for user input: Yes/No');
  let ui = SpreadsheetApp.getUi();
  let response = ui.prompt('Password protected command', 'Please enter password.', ui.ButtonSet.YES_NO);
  let password = '123qwe';

  // Process the user's response.
  let allowUsage;
  let correctPassword = response.getResponseText() == password;
  if (response.getSelectedButton() == ui.Button.YES && correctPassword) {
    allowUsage = true;
  } else if (response.getSelectedButton() == ui.Button.NO) {
    allowUsage = false;
    ui.alert('Thank you', 'Script exited safely.', ui.ButtonSet.OK);
  } else {
    allowUsage = false;
    ui.alert('Access denied', 'Wrong password!', ui.ButtonSet.OK);
  }
  return allowUsage
}
