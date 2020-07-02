/* Main functions */

function click() {
  // Set SpreadSheet for AssignCode script and initialize variables
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Perf");
  var showLogs = false;
  if (sheet.getRange("F1").getValue() === "yes") showLogs = true;
  run(SpreadsheetApp.getActiveSpreadsheet().getId(), showLogs); // google sheets id | do we use the api to solve ? | do we show logs ?
}

// Only with "no api"
function finish(response) {
  displayResponse(response);
}
 
// Clear background and datas of the array
function clearArray() {
  var arraypos = { 'i' : 14, 'j' : 2}; // Set shifts of the wish table position
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datas");
  //sheet.getRange(arraypos['i'], arraypos['j'], 100,100).setValue(""); // Set value
  sheet.getRange(arraypos['i'], arraypos['j'], 100,100).setBackground(null); // Clear background color
}

/* ================ */