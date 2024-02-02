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
  if (!output) {
    Logger.log('The isEnoughTime() function return value is ' + output)
  }
  return output
}
