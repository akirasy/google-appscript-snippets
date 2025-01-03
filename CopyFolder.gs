/**
 * Please fill-in config variables here first.
 * This script requires 3 steps.
 * First step: Fill in source folder and target folder id
 * Second step: Run collectContinuationTokens() function until all folders are properly indexed.
 * Third step: Run startCopyFolder() function until all files are marked as done.
 * If the progress is not complete, re-run those function again. Use `triggers` every 5 minutes might help.
 */
function getUserConfig() {
  // Insert your folder ID here
  let sourceFolderId  = '';  // Source folder ID
  let targetFolderId  = '';  // Target folder ID to be copied to
  let sourceFolderResourceKey = '';  // Leave empty if not needed

  let userConfig = {
    sourceFolderId          : sourceFolderId,
    targetFolderId          : targetFolderId,
    sourceFolderResourceKey : sourceFolderResourceKey
  };
  return userConfig
}

/**
 * Start collecting continuation tokens and save it into progressFile.
 */
function collectContinuationTokens() {
  let initialTime = new Date();
  let userConfig = getUserConfig();  
  let targetFolder = DriveApp.getFolderById(userConfig.targetFolderId);
  let sourceFolder;

  let progressSheet = initializeCopyFolderProgress(userConfig.targetFolderId);
  if (progressSheet) {
    let isFirstRun = progressSheet.getDataRange().getNumRows() == 1;
    if (isFirstRun) {
      // Instantiate source folder from DriveApp
      if (userConfig.sourceFolderResourceKey == '') {
        sourceFolder = DriveApp.getFolderById(userConfig.sourceFolderId);
      } else {
        sourceFolder = DriveApp.getFolderByIdAndResourceKey(userConfig.sourceFolderId, userConfig.sourceFolderResourceKey);
      };
      getContinuationTokens(sourceFolder, targetFolder, progressSheet);
      collectContinuationTokens();
    } else {
      // Continue from last progress until all is done
      let progressSheetValues;
      let pendingRowid;
      while (isEnoughTime(initialTime, 30)) {
        progressSheetValues = progressSheet.getDataRange().getValues();
        pendingRowid = progressSheetValues.map((item, index) => {
          if (item[5] == 'PENDING') { return index };
        }).filter(item => item);

        if (pendingRowid.length != 0) {
          pendingRowid.forEach(item => {
            if (isEnoughTime(initialTime, 30)) {
              let rowid = item + 1;
              let targetFolderId = progressSheetValues[item][2];
              let folderContinuationToken = progressSheetValues[item][4];
              let targetFolder = DriveApp.getFolderById(targetFolderId);
              let iterationDone = copyFolder(initialTime, folderContinuationToken, targetFolder, progressSheet);
              if (iterationDone) { 
                progressSheet.getRange(rowid, 6).setValue('DONE');
                SpreadsheetApp.flush();
              };
            };
          });
        } else { return true };
      };
    };
  };
}

/**
 * Start copying files from continuation token found in progressFile.
 */
function startCopyFolder() {
  let initialTime = new Date();
  let userConfig = getUserConfig();
  let progressSheet = initializeCopyFolderProgress(userConfig.targetFolderId);

  let progressSheetValues;
  let pendingRowid;
  while (isEnoughTime(initialTime, 30)) {
    progressSheetValues = progressSheet.getDataRange().getValues();
    pendingRowid = progressSheetValues.map((item, index) => {
      if (item[6] == 'PENDING') { return index };
    }).filter(item => item);
  
    if (pendingRowid.length != 0) {
      pendingRowid.forEach(item => {
        if (isEnoughTime(initialTime, 30)) {
          let rowid = item + 1;
          let targetFolderId = progressSheetValues[item][2];
          let fileContinuationToken = progressSheetValues[item][3];
          let targetFolder = DriveApp.getFolderById(targetFolderId);
          let iterationDone = copyFiles(initialTime, fileContinuationToken, targetFolder);
          if (iterationDone) {
            progressSheet.getRange(rowid, 7).setValue('DONE');
            SpreadsheetApp.flush();
          };
        };
      });
    } else { return true };
  };
}

/**
 * Create new copyFolder progressFile.
 * @param {DriveApp.Folder} targetFolder The targetFolder as DriveApp.Folder object.
 */
function createNewProgressFile(targetFolder) {
  Logger.log('Creating new progress file.');

  // Create new Spreadsheet file
  let progressSpreadsheet = SpreadsheetApp.create('copyFolderProgress');

  // Setup spreadsheet structure
  let progressSheet = progressSpreadsheet.getSheets()[0];
  progressSheet.setName('progress');
  progressSheet.appendRow([
    'SOURCE FOLDER NAME', 'SOURCE FOLDER ID', 'TARGET FOLDER ID', 
    'FILE CONTINUATION TOKEN', 'FOLDER CONTINUATION TOKEN', 
    'FOLDER CT ITERATION STATUS', 'FILE CT ITERATION STATUS'
    ]);
  progressSheet.deleteColumns(8, progressSheet.getMaxColumns()-7);

  // Move file into source folder
  DriveApp.getFileById(progressSpreadsheet.getId()).moveTo(targetFolder);

  return progressSheet
}

/**
 * Load copyFolderProgress file and returns Sheet object.
 * @param {String} targetFolderId The targetFolderId as a string value.
 */
function initializeCopyFolderProgress(targetFolderId) {
  Logger.log('Initializing copyFolderProgress within Spreadsheet');
  let targetFolder = DriveApp.getFolderById(targetFolderId);
  let progressSheet;

  // Search for existing progress file
  let searchProgressFile = targetFolder.getFilesByName('copyFolderProgress');
  if (searchProgressFile.hasNext()) {
    let progressFileId = searchProgressFile.next().getId();

    // Abort if multiple progress file found
    if (searchProgressFile.hasNext()) {
      Logger.log('-- Duplicate copyFolderLog found! Aborting process.');
      copyFolderProgress = false;
    } else {
      Logger.log('-- Using existing progress file');
      progressSheet = SpreadsheetApp.openById(progressFileId).getSheetByName('progress');
    };
  } else {
    // No existing progress file found
    progressSheet = createNewProgressFile(targetFolder);
  };

  return progressSheet
}

/**
 * Check if still enough time to run another process. Appscript only allow 6 minutes of execution time.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 * @param {Number} processDuration Estimated time (in seconds) for the process to complete
 */
function isEnoughTime(initialTime, processDuration) {
  let currentTime = new Date();
  let milisecondsDifference = currentTime.getTime() - initialTime.getTime();
  let secondsLeft = 360 - (milisecondsDifference / 1000);
  // Uncomment line below for more verbose output.
  // Logger.log('**-- ' + secondsLeft + ' seconds left --**');
  let output = secondsLeft > processDuration;
  if (!output) { Logger.log('The isEnoughTime() function return value is ' + output) }
  return output
}

/**
 * Collect continuationToken for files and folder from source and writes onto progressSheet.
 * @param {DriveApp.Folder} sourceFolder The sourceFolder as DriveApp.Folder object.
 * @param {DriveApp.Folder} targetFolder The targetFolder as DriveApp.Folder object.
 * @param {SpreadsheetApp.Sheet} progressSheet The progressSheet
 */
function getContinuationTokens(sourceFolder, targetFolder, progressSheet) {
  // Collect common information
  let sourceFolderId = sourceFolder.getId();
  let targetFolderId = targetFolder.getId();
  let folderName = sourceFolder.getName();
  Logger.log('Examine folder: ' + folderName);

  // Collect continuation token and write to progressSheet
  let fileContinuationToken = sourceFolder.getFiles().getContinuationToken();
  let folderContinuationToken = sourceFolder.getFolders().getContinuationToken();

  // Write to continuation token to progressSheet
  progressSheet.appendRow([
    folderName, sourceFolderId, targetFolderId,
    fileContinuationToken, folderContinuationToken,
    'PENDING', 'PENDING'
  ]);
  Logger.log('-- Write continuation token complete.');
}

/**
 * Start copy files using continuation token. Will return true if continuation token is done and return false if not enough time.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 * @param {String} fileContinuationToken The fileContinuationToken.
 * @param {DriveApp.Folder} targetFolder The targetFolder as DriveApp.Folder object.
 */
function copyFiles(initialTime, fileContinuationToken, targetFolder) {
  let iteration = DriveApp.continueFileIterator(fileContinuationToken);

  // Loop through file iteration and copy files
  while (iteration.hasNext()) {
    if (isEnoughTime(initialTime, 30)) {
      let sourceFile = iteration.next();
      let fileName = sourceFile.getName();
      sourceFile.makeCopy(fileName, targetFolder);
      Logger.log('---- File copied: ' + fileName);
    } else {
      // Not enough time to copy file. Stop the iteration and continue later.
      return false
    };
  };

  // While loop is at the end of file iteration
  Logger.log('---- Continuation token iteration complete!');
  return true
}

/**
 * Start process folders by creating new folder at target folder and collect its continuation tokens.
 * This function will return true if continuation token is done and return false if not enough time.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 * @param {String} folderContinuationToken The folderContinuationToken.
 * @param {DriveApp.Folder} targetFolder The targetFolder as DriveApp.Folder object.
 * @param {SpreadsheetApp.Sheet} progressSheet The progressSheet
 */
function copyFolder(initialTime, folderContinuationToken, targetFolder, progressSheet) {
  let iteration = DriveApp.continueFolderIterator(folderContinuationToken);

  // Loop through folder iteration to create new folder and collect continuation token
  while (iteration.hasNext()) {
    if (isEnoughTime(initialTime, 30)) {
      let sourceFolder = iteration.next();
      let folderName = sourceFolder.getName()
      let newFolder = targetFolder.createFolder(folderName);
      getContinuationTokens(sourceFolder, newFolder, progressSheet);
    } else {
      // Not enough time to process folder. Stop the iteration and continue later.
      return false
    };
  }
  // While loop is at the end of folder iteration
  Logger.log('---- Continuation token iteration complete!');
  return true
}
