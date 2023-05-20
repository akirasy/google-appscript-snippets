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
