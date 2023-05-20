/**
 * Please fill-in config variables here first. Then run startCopy() function.
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
 * Start copying folder to target.
 */
function startCopy() {
  let initialTime     = new Date();
  let userConfig      = userConfigVariables();
  let sourceFolderId  = userConfig.sourceFolderId;
  let sourceFolderResourceKey = userConfig.sourceFolderResourceKey;
  let targetFolderId  = userConfig.targetFolderId;

  let sourceFolder;
  if (sourceFolderResourceKey == '') {
    sourceFolder = DriveApp.getFolderById(sourceFolderId);
  } else {
    sourceFolder = DriveApp.getFolderByIdAndResourceKey(sourceFolderId, sourceFolderResourceKey);
  };

  // Implements copyFolder function below
  let targetFolder = DriveApp.getFolderById(targetFolderId);
  let progressSheet = initializeCopyFolderProgress(targetFolder);
  if (progressSheet) {
    copyFolder(sourceFolder, targetFolder, progressSheet, initialTime);
  }
}

/**
 * Load copyFolderProgress file as Spreadsheet and returns Sheet object.
 * @param {Drive.Folder} targetFolder The targetFolder as a Folder object.
 */
function initializeCopyFolderProgress(targetFolder) {
  Logger.log('Initializing copyFolderProgress within Spreadsheet');
  let logFileName = 'CopyFolderLog';

  function createNewLogFile() {
    Logger.log('Creating new file: ' + logFileName);
    let spreadsheet = SpreadsheetApp.create(logFileName);
    let sheet = spreadsheet.getSheets()[0];
    sheet.deleteColumns(4, sheet.getMaxColumns()-3);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(targetFolder);
    return sheet    
  }

  let sheet;
  let searchLogFile = targetFolder.getFilesByName(logFileName);
  if (searchLogFile.hasNext()) {
    let logFileId = searchLogFile.next().getId();
    if (searchLogFile.hasNext()) {
      Logger.log('-- Duplicate copyFolderLog found! Aborting process.');
      sheet = false;
    } else {
      Logger.log('-- Using previous ' + logFileName);
      sheet = SpreadsheetApp.openById(logFileId).getSheets()[0];
    }
  } else {
    sheet = createNewLogFile();
  }

  return sheet
}

/**
 * Write fileName and fileId to progressSheet.
 * @param {SpreadsheetApp.sheet} sheet The sheet object of CopyFolderProgress.
 * @param {String} fileName The fileName in string.
 * @param {String} sourceFileId The fileId of source file in string
 * @param {String} targetFileId The fileId of target file in string
 */
function setCopyFolderProgress(sheet, fileName, sourceFileId, targetFileId) {
  let newDataRange = sheet.getRange(sheet.getLastRow()+1, 1, 1, 3);
  newDataRange.setValues([[fileName, sourceFileId, targetFileId]]);
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
  return secondsLeft > processDuration ? true : false;
}

/**
 * This script copies the contents of folder to other folder recursively,
 * even if the destination folder is accessible and managed by other GSUITE
 * organization (if the visibility is set to PUBLIC).
 * @param {DriveApp.Folder} source The source folder.
 * @param {DriveApp.Folder} target The target folder.
 * @param {DriveApp.Sheet} progressSheet The progress CopyFolder
 * @param {Date} initialTime initial time of code execution
 */
function copyFolder(source, target, progressSheet, initialTime) {
  let progressValues = progressSheet.getRange(1, 1, progressSheet.getLastRow()+1, 3).getValues();
  let completedId = progressValues.map(item => item[1]);  
  let folders = source.getFolders();
  let files = source.getFiles();

  Logger.log('Starting CopyFolder process...');
  while (files.hasNext()) {
    if (isEnoughTime(initialTime, 25)) {
      let file = files.next();
      let fileId = file.getId();
      if (!completedId.includes(fileId)) {  
        let fileName = file.getName();
        let copiedFile = file.makeCopy(fileName, target);
        setCopyFolderProgress(progressSheet, fileName, fileId, copiedFile.getId());
        Logger.log('-- Copy complete: ' + fileName);
      }
    } else {
      Logger.log('Not enough time. Exiting...');
      break;
    }
  }
  while (folders.hasNext()) {
    Logger.log('== Another subFolder found!! ==');
    if (isEnoughTime(initialTime, 25)) {
      let subFolder = folders.next();
      let folderId = subFolder.getId();
      let folderName = subFolder.getName();

      let targetFolder;
      if (!completedId.includes(folderId)) {
        Logger.log('== SubFolder name: ' + folderName + ' ==');
        targetFolder = target.createFolder(folderName);
        setCopyFolderProgress(progressSheet, folderName, folderId, targetFolder.getId());
      } else {
        Logger.log('== Resume copying SubFolder: ' + folderName + ' ==');
        let indexOfFoundId = completedId.indexOf(folderId);
        targetFolder = DriveApp.getFolderById(progressValues[indexOfFoundId][2]);
      }

      copyFolder(subFolder, targetFolder, progressSheet, initialTime);
    
    } else {
      break;      
    }
  }
  Logger.log('No more file or folder to copy. Exiting...');
}
