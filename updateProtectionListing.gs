/**
 * Update sheet or range protection with the given user listing.
 * @param {Object} sheetOrRange Sheet object (SpreadsheetApp.Sheet) or Range object (SpreadsheetApp.Range)
 * @param {Array} userListing List of users
 */
function updateProtectionListing(sheetOrRange, userListing) {
  let protector = sheetOrRange.protect();
  let existingUsers = protector.getEditors().map(editor => editor.getEmail());

  let userToAdd = userListing.map(user => (!existingUsers.includes(user)) ? user : null).filter(user => user);
  let userToRemove = existingUsers.map(user => (!userListing.includes(user)) ? user : null).filter(user => user);

  if (userToAdd.length != 0) {
    protector.addEditors(userToAdd);
  };
  if (userToRemove.length != 0) {
    protector.removeEditors(userToRemove);
  };
}
