/**
 * Show about Google AppScript.
 */
function aboutGoogleAppScript() {
  let title = 'Google AppScript';
  let subtitle = `
    Google Apps Script is a rapid application development platform that makes it 
    fast and easy to create business applications that integrate with Google Workspace. 
    
    You write code in modern JavaScript and have access to built-in libraries for favorite 
    Google Workspace applications like Gmail, Calendar, Drive, and more. 
    
    There's nothing to install—we give you a code editor right in your browser, 
    and your scripts run on Google's servers.

    Learn more at --> https://developers.google.com/apps-script/overview
  `;
  SpreadsheetApp.getUi().alert(title, subtitle, SpreadsheetApp.getUi().ButtonSet.OK);
}
