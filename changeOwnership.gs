/**
 * Please fill-in config variables here first.
 * Then run prepareContinuationToken() function.
 * After that, run startChangeOwnership() function.
 * If prepareContinuationToken() or startChangeOwnership() process is not complete, re-run those function again.
 * Use `triggers` every 5 minutes is helpful.
 */
function getUserConfig() {
  Logger.log('Initializing userConfing.');
  let folder = { 
      folderId          : '', 
      folderResourceKey : '' 
    };
  let ownerEmail = {
    original : '',
    target   : ''
  };
  let progressLog =  {fileName : 'ProgressLog' };
  let userConfig = { 
    folder : folder,
    ownerEmail : ownerEmail,
    progressLog: progressLog 
  };
  return userConfig
}

/**
 * Load progressLog file as Spreadsheet and returns Sheet object inside dictionary (JSON).
 * @param {Object} userConfig User defined values from getUserConfig().
 */
function loadProgressLog(userConfig) {
  // Establish folder
  let folder;  
  if (userConfig.folder.folderResourceKey) {
    folder = DriveApp.getFolderByIdAndResourceKey(userConfig.folder.folderId, userConfig.folder.folderResourceKey);
  } else {
    folder = DriveApp.getFolderById(userConfig.folder.folderId);
  };

  // Load progress file
  let progressLog;
  let logFileName = userConfig.progressLog.fileName;

  // Find logfile if it already exist
  let searchLogFile = folder.getFilesByName(logFileName);
  if (searchLogFile.hasNext()) {
    let logFileId = searchLogFile.next().getId();
    if (searchLogFile.hasNext()) {
      // Logfile found but there is duplicate -> return false
      Logger.log('-- Duplicate ' + logFileName + ' found! Aborting process.');
      progressLog = false;
    } else {
      // Logfile found -> use it
      Logger.log('-- Using previous ' + logFileName);
      let spreadsheet = SpreadsheetApp.openById(logFileId);
      progressLog = {
        sheetFilesCt  : spreadsheet.getSheetByName('files'),
        sheetFolderCt : spreadsheet.getSheetByName('folders')
      };
    }
  } else {
    // No logfile found -> create new spreadsheet
    Logger.log('No logfile found. Creating new file: ' + logFileName);
    let spreadsheet = SpreadsheetApp.create(logFileName);

    // Setup sheet for file continuation token
    let sheetFilesCt = spreadsheet.insertSheet('files');
    sheetFilesCt.appendRow(['FOLDER NAME', 'FOLDER ID', 'FILE CONTINUATION TOKEN', 'ITERATION STATUS']);
    sheetFilesCt.deleteColumns(5, sheetFilesCt.getMaxColumns()-4);

    // Setup sheet for folder continuation token
    let sheetFolderCt = spreadsheet.insertSheet('folders');
    sheetFolderCt.appendRow(['FOLDER NAME', 'FOLDER ID', 'FOLDER CONTINUATION TOKEN', 'ITERATION STATUS']);
    sheetFolderCt.deleteColumns(5, sheetFolderCt.getMaxColumns()-4);

    // Remove initial sheet & move to folder
    spreadsheet.deleteSheet(spreadsheet.getSheets()[0]);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);

    progressLog = {
      sheetFilesCt  : sheetFilesCt,
      sheetFolderCt : sheetFolderCt
    };
  }
  return progressLog
}

/**
 * Collect fileContinuationToken from source folder and writes onto progressLog.
 * @param {SpreadsheetApp.Sheet} sheetFilesCt The sheet of `files` from progressLog.
 * @param {Drive.Folder} sourceFolder The source folder.
 */
function getFileContinuationToken(sheetFilesCt, sourceFolder) {
  // Check existing continuation token
  let sourceFolderId = sourceFolder.getId();
  let existingFileIdList = sheetFilesCt.getDataRange().getValues().map(item => item[1]);
  if (!existingFileIdList.includes(sourceFolderId)) {
    // Start collecting file continuation token
    let folderName = sourceFolder.getName();
    let fileIteration = sourceFolder.getFiles();
    let fileCt = fileIteration.getContinuationToken();
    sheetFilesCt.appendRow([folderName, sourceFolderId, fileCt, 'Pending']);
    Logger.log('-- Collect File Continuation Token for folder: ' + folderName);    
  }
}

/**
 * Collect folderContinuationToken from source folder and writes onto progressLog.
 * @param {SpreadsheetApp.Sheet} sheetFolderCt The sheet of `folder` from progressLog.
 * @param {Drive.Folder} sourceFolder The source folder.
 */
function getFolderContinuationToken(sheetFolderCt, sourceFolder) {
  // Check existing continuation token
  let sourceFolderId = sourceFolder.getId();
  let existingFolderIdList = sheetFolderCt.getDataRange().getValues().map(item => item[1]);
  if (!existingFolderIdList.includes(sourceFolderId)) {
    // Start collecting file continuation token
    let folderName = sourceFolder.getName();
    let folderIteration = sourceFolder.getFolders();
    let folderCt = folderIteration.getContinuationToken();
    sheetFolderCt.appendRow([folderName, sourceFolderId, folderCt, 'Pending']);
    Logger.log('-- Collect Folder Continuation Token for folder: ' + folderName);
  }
}

/**
 * Collect subFolderContinuationToken from source folder and writes onto progressLog.
 * @param {SpreadsheetApp.Sheet} sheetFilesCt The sheet of `files` from progressLog.
 * @param {SpreadsheetApp.Sheet} sheetFolderCt The sheet of `folder` from progressLog.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 */
function getSubFolderContinuationToken(sheetFilesCt, sheetFolderCt, initialTime) {
  let folderListing = sheetFolderCt.getDataRange().getValues();
  folderListing.forEach((item, index) => {
    if (item[3] == 'Pending') {
      let folderIteration = DriveApp.continueFolderIterator(item[2]);
      while (folderIteration.hasNext()) {
        if (isEnoughTime(initialTime)) {
          let folder = folderIteration.next();
          getFileContinuationToken(sheetFilesCt, folder);
          getFolderContinuationToken(sheetFolderCt, folder);
        } else {
          return
        }
      }
      sheetFolderCt.getRange(index+1, 4).setValue('Done');
    }
  })
}

/**
 * Start indexing all folders and its subfolders and writes onto spreadsheet progressLogFile.
 * Run this function until all is complete first.
 */
function prepareContinuationToken() {
  let initialTime       = new Date();
  let userConfig        = getUserConfig();
  let sourceId          = userConfig.folder.folderId;
  let sourceResourceKey = userConfig.folder.folderResourceKey;
  let progressLog       = loadProgressLog(userConfig);

  if (progressLog) {
    let sourceFolder;
    if (!sourceResourceKey == '') {
      sourceFolder = DriveApp.getFolderById(sourceId);
    } else {
      sourceFolder = DriveApp.getFolderByIdAndResourceKey(sourceId, sourceResourceKey);
    }
    // Begin folder and subfolder iteration
    getFileContinuationToken(progressLog.sheetFilesCt, sourceFolder);
    getFolderContinuationToken(progressLog.sheetFolderCt, sourceFolder);
    getSubFolderContinuationToken(progressLog.sheetFilesCt, progressLog.sheetFolderCt, initialTime);
  } else {
    Logger.log('Aborting script.')
  }
}

/**
 * Start change file ownership to target owner.
 * @param {SpreadsheetApp.Sheet} sheetFilesCt The sheet of `files` from progressLog.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 * @param {Object} userConfig User defined values from getUserConfig().
 */
function changeFileOwnership(sheetFilesCt, initialTime, userConfig) {
  let fileListing = sheetFilesCt.getDataRange().getValues();
  fileListing.forEach((item, index) => {
    if (item[3] == 'Pending') {
      let fileIteration = DriveApp.continueFileIterator(item[2]);
      while (fileIteration.hasNext()) {
        if (isEnoughTime(initialTime)) {
          let file = fileIteration.next();
          if (file.getOwner().getEmail() == userConfig.ownerEmail.original) {
            file.setOwner(userConfig.ownerEmail.target);
            Logger.log('Change file owner: ' + file.getName());
          }
        } else {
          return
        }
      }
      sheetFilesCt.getRange(index+1, 4).setValue('Done');
    }
  })
}

/**
 * Check if still enough time to run another process. Appscript only allow certain minutes of execution time.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 * @param {Number} processDuration Estimated time (in seconds) for the process to complete.
 * @param {Number} timeLimit Maximum allowed execution time.
 */
function isEnoughTime(initialTime, processDuration=120, timeLimit=360) {
  let currentTime = new Date();
  let milisecondsDifference = currentTime.getTime() - initialTime.getTime();
  let secondsLeft = timeLimit - (milisecondsDifference / 1000);
  // Uncomment line below for more verbose output.
  // Logger.log('**-- ' + secondsLeft + ' seconds left --**');
  let output = secondsLeft > processDuration;
  if (!output) { Logger.log('The isEnoughTime() function return value is ' + output) }
  return output
}
