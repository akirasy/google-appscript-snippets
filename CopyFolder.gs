/**
 * Please fill-in config variables here first.
 * Then run prepareCopyFolder() function.
 * After that, run startCopyFolder function.
 * If copy process is not complete, re-run those function again. Use `triggers` every 5 minutes might help.
 */
function userConfigVariables() {
  // Insert your folder ID here
  let sourceFolderId  = '';  // Source folder ID
  let targetFolderId  = '';  // Target folder ID to be copied to
  let sourceFolderResourceKey = '';  // Leave empty if not needed

  let userConfig = {
    sourceFolderId  : sourceFolderId,
    targetFolderId  : targetFolderId,
    sourceFolderResourceKey : sourceFolderResourceKey
  };
  return userConfig
}

/**
 * Start indexing all folders and its subfolders and writes onto spreadsheet CopyFolderLog.
 * Run this function until all is complete first.
 */
function prepareCopyFolder() {
  let initialTime       = new Date();
  let userConfig        = userConfigVariables();
  let sourceFolderId    = userConfig.sourceFolderId;
  let targetFolderId    = userConfig.targetFolderId;
  let sourceResourceKey = userConfig.sourceFolderResourceKey;

  let copyFolderLog = initializeCopyFolderProgress(targetFolderId);
  if (copyFolderLog) {
    // To provide initial value to CopyFolderLog bypassing `Pending' check.
    let runCount = 1
    Logger.log('The prepareCopyFolder() process runCount: ' + runCount + ' times.');
    getFileContinuationToken(copyFolderLog, sourceFolderId, targetFolderId, sourceResourceKey);
    getFolderContinuationToken(copyFolderLog, sourceFolderId, targetFolderId, sourceResourceKey);
    beginIterateAndCreateNewFolder(copyFolderLog, initialTime);

    while (true) {
      runCount += 1;
      Logger.log('The prepareCopyFolder() process runCount: ' + runCount + ' times.');
      let folderPendingList = copyFolderLog.folderContinuationToken.getDataRange().getValues().map(item => item[4]);
      let folderIsPending = folderPendingList.includes('Pending');
      if (folderIsPending && isEnoughTime(initialTime, 120)) {
        getFileContinuationToken(copyFolderLog, sourceFolderId, targetFolderId, sourceResourceKey);
        getFolderContinuationToken(copyFolderLog, sourceFolderId, targetFolderId, sourceResourceKey);
        beginIterateAndCreateNewFolder(copyFolderLog, initialTime);
      } else { break }
    }
  }
}

/**
 * Start copy file from fileIteration found in CopyFolderLog.
 * Run this function only after prepareCopyFolder() has completed indexing all files and folders.
 */
function startCopyFolder() {
  let initialTime     = new Date();
  let userConfig      = userConfigVariables();
  let targetFolderId  = userConfig.targetFolderId;

  let copyFolderLog = initializeCopyFolderProgress(targetFolderId);
  if (copyFolderLog) {
    let filePendingList = copyFolderLog.fileContinuationToken.getDataRange().getValues().map(item => item[4]);
    let fileIsPending = filePendingList.includes('Pending');
    if (fileIsPending && isEnoughTime(initialTime, 210)) {
      beginIterateAndCopyFile(copyFolderLog, initialTime);
    }
  }
}

/**
 * Load copyFolderProgress file as Spreadsheet and returns Sheet object inside dictionary (JSON).
 * @param {String} targetFolderId The targetFolderId as a string value.
 */
function initializeCopyFolderProgress(targetFolderId) {
  Logger.log('Initializing copyFolderProgress within Spreadsheet');
  let logFileName = 'CopyFolderLog';
  let targetFolder = DriveApp.getFolderById(targetFolderId)

  function createNewLogFile() {
    Logger.log('Creating new file: ' + logFileName);
    let spreadsheet = SpreadsheetApp.create(logFileName);

    let sheetFileContinuationToken = spreadsheet.insertSheet('files');
    sheetFileContinuationToken.appendRow(['FOLDER NAME', 'SOURCE FOLDER ID', 'TARGET FOLDER ID', 'FILE CONTINUATION TOKEN', 'ITERATION STATUS']);
    sheetFileContinuationToken.deleteColumns(6, sheetFileContinuationToken.getMaxColumns()-5);

    let sheetFolderContinuationToken = spreadsheet.insertSheet('folders');
    sheetFolderContinuationToken.appendRow(['FOLDER NAME', 'SOURCE FOLDER ID', 'TARGET FOLDER ID', 'FILE CONTINUATION TOKEN', 'ITERATION STATUS']);
    sheetFolderContinuationToken.deleteColumns(6, sheetFolderContinuationToken.getMaxColumns()-5);

    let sheet1 = spreadsheet.getSheets()[0];
    spreadsheet.deleteSheet(sheet1);

    DriveApp.getFileById(spreadsheet.getId()).moveTo(targetFolder);

    let copyFolderLog = {
      fileContinuationToken   : sheetFileContinuationToken,
      folderContinuationToken : sheetFolderContinuationToken
    }
    return copyFolderLog    
  }

  let copyFolderLog;
  let searchLogFile = targetFolder.getFilesByName(logFileName);
  if (searchLogFile.hasNext()) {
    let logFileId = searchLogFile.next().getId();
    if (searchLogFile.hasNext()) {
      Logger.log('-- Duplicate copyFolderLog found! Aborting process.');
      copyFolderLog = false;
    } else {
      Logger.log('-- Using previous ' + logFileName);
      let spreadsheet = SpreadsheetApp.openById(logFileId);
      copyFolderLog = {
        fileContinuationToken   : spreadsheet.getSheetByName('files'),
        folderContinuationToken : spreadsheet.getSheetByName('folders')
      }
    }
  } else {
    copyFolderLog = createNewLogFile();
  }
  return copyFolderLog
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
 * Collect fileContinuationToken from source folder and writes onto CopyFolderLog.
 * @param {Object} copyFolderLog The return value of initializeCopyFolderProgress() function.
 * @param {String} sourceId The source folder ID as a String.
 * @param {String} targetId The target folder ID as a String.
 */
function getFileContinuationToken(copyFolderLog, sourceId, targetId, sourceResourceKey='') {
  let sheetFileContinuationToken = copyFolderLog.fileContinuationToken;
  let existingIdList = sheetFileContinuationToken.getDataRange().getValues().map(item => item[1]);
  if (!existingIdList.includes(sourceId)) {
    let folder;
    if (sourceResourceKey == '') {
      folder = DriveApp.getFolderById(sourceId);
    } else {
      folder = DriveApp.getFolderByIdAndResourceKey(sourceId, sourceResourceKey);
    }
    let folderName = folder.getName();
    let fileIteration = folder.getFiles();
    let continuationToken = fileIteration.getContinuationToken();
    sheetFileContinuationToken.appendRow([folderName, sourceId, targetId, continuationToken, 'Pending']);
    Logger.log('-- Collect File Continuation Token for folder: ' + folderName);
  }
}

/**
 * Collect folderContinuationToken from source folder and writes onto CopyFolderLog.
 * @param {Object} copyFolderLog The return value of initializeCopyFolderProgress() function.
 * @param {String} sourceId The source folder ID as a String.
 * @param {String} targetId The target folder ID as a String.
 */
function getFolderContinuationToken(copyFolderLog, sourceId, targetId, sourceResourceKey='') {
  let sheetFolderContinuationToken = copyFolderLog.folderContinuationToken;
  let existingIdList = sheetFolderContinuationToken.getDataRange().getValues().map(item => item[1]);
  if (!existingIdList.includes(sourceId)) {
    let folder;
    if (sourceResourceKey == '') {
      folder = DriveApp.getFolderById(sourceId);
    } else {
      folder = DriveApp.getFolderByIdAndResourceKey(sourceId, sourceResourceKey);
    }
    let folderName = folder.getName();
    let folderIteration = folder.getFolders();
    let continuationToken = folderIteration.getContinuationToken();
    sheetFolderContinuationToken.appendRow([folderName, sourceId, targetId, continuationToken, 'Pending']);
    Logger.log('-- Collect Folder Continuation Token for folder: ' + folderName);
  }
}

/**
 * Start creating subfolders into target folder by looping into folderIteration found in CopyFolderLog.
 * @param {Object} copyFolderLog The return value of initializeCopyFolderProgress() function.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 */
function beginIterateAndCreateNewFolder(copyFolderLog, initialTime) {
  let sheetFolderContinuationToken = copyFolderLog.folderContinuationToken;
  let continuationTokenList = sheetFolderContinuationToken.getDataRange().getValues();
  continuationTokenList.forEach((item, index) => {
    if (item[4] == 'Pending' && isEnoughTime(initialTime, 120)) {
      // Begin create new folder
      let folderIteration = DriveApp.continueFolderIterator(item[3]);
      let target = DriveApp.getFolderById(item[2]);
      while (folderIteration.hasNext()) {
        if (isEnoughTime(initialTime, 120)) {
          let folder = folderIteration.next();
          let folderName = folder.getName();
          let newFolder = target.createFolder(folderName);
          Logger.log('-- Creating new folder: ' + folderName);
          getFileContinuationToken(copyFolderLog, folder.getId(), newFolder.getId());
          getFolderContinuationToken(copyFolderLog, folder.getId(), newFolder.getId())
        } else { break }
      }
      // Mark item as done
      sheetFolderContinuationToken.getRange(index+1, 5).setValue('Done');
    }
  })
}

/**
 * Start copying files by looping into fileIteration found in CopyFolderLog.
 * @param {Object} copyFolderLog The return value of initializeCopyFolderProgress() function.
 * @param {Date} initialTime Instance of `new Date()` from the initial execution time.
 */
function beginIterateAndCopyFile(copyFolderLog, initialTime) {
  Logger.log('-- Copying file to target folder...');
  let sheetFileContinuationToken = copyFolderLog.fileContinuationToken;
  let continuationTokenList = sheetFileContinuationToken.getDataRange().getValues();
  continuationTokenList.forEach((item, index) => {
    if (item[4] == 'Pending' && isEnoughTime(initialTime, 120)) {
      // Begin copy loop
      let fileIteration = DriveApp.continueFileIterator(item[3]);
      let target = DriveApp.getFolderById(item[2]);
      while (fileIteration.hasNext()) {
        if (isEnoughTime(initialTime, 120)) {
          let file = fileIteration.next();
          let fileName = file.getName();
          file.makeCopy(fileName, target);
          Logger.log('Copied file: ' + fileName);
        } else { break }
      }
      // Mark item as done
      sheetFileContinuationToken.getRange(index+1, 5).setValue('Done');
    }
  })
}
