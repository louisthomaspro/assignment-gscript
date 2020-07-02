/* http://patorjk.com/software/taag/#p=display&f=Big&t=Assign%20Code
                   _                _____          _      
     /\           (_)              / ____|        | |     
    /  \   ___ ___ _  __ _ _ __   | |     ___   __| | ___ 
   / /\ \ / __/ __| |/ _` | '_ \  | |    / _ \ / _` |/ _ \
  / ____ \\__ \__ \ | (_| | | | | | |___| (_) | (_| |  __/
 /_/    \_\___/___/_|\__, |_| |_|  \_____\___/ \__,_|\___|
                      __/ |                               
                     |___/                                
*/



/**
 * Get variables in cache and return a JSON value
 *
 * @name getJsonCache
 * @function
 * @param key {string} Google Sheets api key
 * @return {JSON.parse(string)} Object or string
 */
function getJsonCache(key) {
  return JSON.parse(CacheService.getUserCache().get(key));
}

/**
 * Log a JSON.stringify message if log is enable
 *
 * @name log
 * @function
 * @param msg {string} Message
 */
function log(msg) {
  if (getJsonCache('log')) Logger.log(JSON.stringify(msg));
}

/**
 * Log a JSON.stringify error message and show a dialog
 *
 * @name displayError
 * @function
 * @param msg {string} Error message
 */
function displayError(msg) {
  log('Erreur : ' + msg);
  var output = HtmlService.createHtmlOutput('<div>Failed ! Check your datas or contact an administrator.</div><br><p>Error : ' + msg + '</p>');
  SpreadsheetApp.getUi().showModalDialog(output, 'Error');
  clearCache();
}

/**
 * Include a script (css or js). Function called in html an file
 *
 * @name include
 * @function
 * @param filename {string} Filename to include
 * @return {string} Script of the file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Return row number of the first empty cell in a column given
 *
 * @name getLastRowInColumn
 * @function
 * @param range {string} Google Sheets range
 * @return {number} Row number
 */
function getLastRowInColumn(column) {
  var spr = SpreadsheetApp.openById(getJsonCache('sheet_id')).getSheetByName('Perf');
  return spr.getRange(column + ':' + column) // range ex : A:A
  .getValues().filter (String).length;
}

/**
 * Initializes logs using BetterLog add-on if log is enable
 *
 * @name initLogs
 * @function
 */
function initLogs() {
  if (getJsonCache('log')) Logger = BetterLog.useSpreadsheet(getJsonCache('sheet_id')); // Get Datas Spreadsheet
}

/**
 * Clear used keys cache
 *
 * @name clearCache
 * @function
 */
function clearCache() {
  CacheService.getUserCache().removeAll(['log', 'sheet_id', 'arraypos', 'params', 'array', 'priority', 'ts_begin']); // Clear cache
}







/**
 * Clear back ground colors and initializes global variables and stores them in cache
 * arraypos, sheet, params, array, priority
 *
 * @name initialization
 * @function
 */
function initialization() {
  
  initLogs();
  
  log('Initializes variables');
  
  var arraypos = { 'i' : 14, 'j' : 2}; // Set shifts of the wish table position
  var sheet = SpreadsheetApp.openById(getJsonCache('sheet_id')).getSheetByName('Datas'); // SpreadSheet where datas are
  
  sheet.getRange(arraypos['i'], arraypos['j'], 100,100).setBackground(null); // Clear background color
  
  // Object with all parameters
  var params = {
    'nbStudents' : sheet.getRange("D5").getValue(),
    'nbProjects' : sheet.getRange("D6").getValue(),
    'maxStudentsPerProjects' : sheet.getRange("D7").getValue(),
    'ProjectsPerStudents' : sheet.getRange("D8").getValue()
  };
  
  /* Array of wishes
  ex : [ [ 7, 1, 8, 4, 12, 13, 11, 2, 10, 9, 3, 5, 6 ],
      [ 5, 1, 3, 13, 4, 6, 7, 12, 11, 2, 8, 9, 10 ],
      [ 6, 7, 5, 4, 3, 2, 8, 1, 9, 10, 11, 12, 13 ],
      [ 13, 1, 12, 2, 4, 11, 3, 10, 5, 7, 8, 9, 6 ],
      [ 2, 1, 6, 3, 7, 8, 13, 4, 9, 10, 11, 12, 5 ] ]
  */
  var array = sheet.getRange(arraypos['i'], arraypos['j'], params.nbStudents, params.nbProjects).getValues(); 
 
  /* Array of mandatory projects
  ex : [ ["","","","","oui","","","","","","oui","",""] ]
  */
  var priority = sheet.getRange(arraypos['i'] - 2, arraypos['j'], 1, params.nbProjects + arraypos['j'] - 2).getValues();
  
  // Set global variables in cache
  var toAdd = {
    'arraypos': JSON.stringify(arraypos),
    'params' : JSON.stringify(params),
    'array' : JSON.stringify(array),
    'priority' : JSON.stringify(priority)
  };
  CacheService.getUserCache().putAll(toAdd);
  
  log('log:' + getJsonCache('log') + ' || sheet_id' + getJsonCache('sheet_id') + ' || arraypos' + JSON.stringify(getJsonCache('arraypos')) + ' || params' + JSON.stringify(getJsonCache('params')) + ' || array' + JSON.stringify(getJsonCache('array')) + ' || priority' + JSON.stringify(getJsonCache('priority')));
  
}





/**
 * Interpret the response returned by glpk and display colors on the google Sheets
 *
 * @name displayResponse
 * @function
 * @param response {object} Result of glpk if it was a success - { error : true/false, result : [0,0,0,1,1,0,0,...] }
 */
function displayResponse(response) {
  
  initLogs();
  
  log('error : ' + JSON.stringify(response.error) + ', result : ' + JSON.stringify(response.result));
  if (response.error) {
    displayError(response.result);
    return 0;
  }
  
  var parseResults = [];
  
  // Parse the response to "[[1,11],[2,10],...]". The fist array is student 1 for the project 11
  var params = getJsonCache('params');
  
  var index=0;
  for (var i=1;i<=params.nbStudents;i++) {
    for (var j=1;j<=params.nbProjects;j++) {
      if (response.result[index]==1){
        parseResults.push([i,j]);
      }
      index++;
    }
  }
  
  log('ParseResults of glpk = '+ JSON.stringify(parseResults));
  
  if (parseResults.length === 0) {
    SpreadsheetApp.getUi().alert('Impossible assignment. Please, verify your datas.');
    return 0;
  }
  
  
  // Set colors for an assignment on Google Sheets
  log('Set colors');
  var arraypos = getJsonCache('arraypos');
  var sheet = SpreadsheetApp.openById(getJsonCache('sheet_id')).getSheetByName('Datas'); // Get Spreadsheet
  for (var i in parseResults){
    sheet.getRange(parseResults[i][0]+arraypos['i']-1,parseResults[i][1]+arraypos['j']-1).setBackground("green");
  }
  
  // Calculation of the execution time of the function
  var ts_begin = getJsonCache('ts_begin');
  var ts_end = new Date().getTime();
  log('ts_begin = ' + JSON.stringify(ts_begin));
  log('ts_end = ' + JSON.stringify(ts_end));
  var time = (ts_end - ts_begin) / 1000;
  log('time = ' + JSON.stringify(time));

  // Show the execution time and close the showing dialog
  var output = HtmlService.createHtmlOutput('<script>google.script.host.close();</script>');
  SpreadsheetApp.getUi().showModalDialog(output, 'Done in ' + JSON.stringify(time) + ' seconds !');
  
  // Write performance value in sheet in the corresponding column
  log('Write perf value');
  var perf = SpreadsheetApp.openById(getJsonCache('sheet_id')).getSheetByName('Perf'); // Get perf Spreadsheet
  var column;
  if (getJsonCache('log')) {
    column = 'B';
  } else {
    column = 'C';
  }
  var firstFreeRow = parseInt(getLastRowInColumn(column)) + 1;
  log('column : ' + column + ' || row : ' + firstFreeRow);
  perf.getRange(column + firstFreeRow).setValue(JSON.stringify(time)); // Set value
  perf.getRange("A" + firstFreeRow).setValue(parseInt(firstFreeRow) - parseInt(4) + 1); // Set numerotation
  perf.getRange(column + "3").setFormula("=AVERAGE(" + column + "4:" + column + firstFreeRow +")"); // Set average
  
  clearCache();
}






/**
 * Principal function loading glpk
 *
 * @name run
 * @function
 * @param id {string} Id of the Google Sheets
 * @param showLogs {bool} If we show logs
 */
function run(id, showLogs) {
  
  // Show loading dialog
  var output = HtmlService.createHtmlOutput('<div></div>');
  SpreadsheetApp.getUi().showModalDialog(output, 'Initialization of the model...');
  
  // Store parameters in cache
  var toAdd = {
    'log': JSON.stringify(showLogs),
    'sheet_id' : JSON.stringify(id)
  };
  CacheService.getUserCache().putAll(toAdd);
  
  initLogs();
  log('----------------------------------------------------------------------------------');
  
  // Store begin time
  var ts_begin = new Date().getTime(); // Number of ms since Jan 1, 1970
  CacheService.getUserCache().put('ts_begin', JSON.stringify(ts_begin));
  log('ts_begin = ' + JSON.stringify(ts_begin));
  log('ts_begin after store : ' + getJsonCache('ts_begin'));
  
  initialization();
  
  // Get usefull global variables
  var array = getJsonCache('array');
  var priority = getJsonCache('priority');
  var params = getJsonCache('params');
  
      
    
  // inversion of the values of the wishes (ex : 1 -> 5, 3 -> 2...) --> preference = nbProjet + 1 - preference
  for (var etu in array) {
    for (var project in array[etu]) {
      array[etu][project] = params.nbProjects + 1 - array[etu][project];
    }
  }
  
  
  //---- Generate text for .dat ----//
  
  // Generate basic parameters
  console.log('Parameters generation...');
  var dat = '';
  dat +=
    'param nbStudents :='+params.nbStudents+';\n'+
      'param nbProjects :='+params.nbProjects+ ';\n'+
        'param maxStudentsPerProjects :='+params.maxStudentsPerProjects+ ';\n'+
          'param ProjectsPerStudents :='+params.ProjectsPerStudents+ ';\n';
  
  /* Generate wish table parameters
  ex : param preference : 1 2 3 4 5 :=
  1   1 5 3 2 4
  2   4 5 1 2 3
  ...
  */
  // 
  dat += 'param preference : ';
  for (var i=1;i<=params.nbProjects;i++) dat+=i+' ';
  dat += ':=\n';
  for (var etu in array) {
    dat+=parseInt(etu)+1+'   ';
    for (var project in array[etu]) {
      dat+=array[etu][project]+' ';
    }
    dat+="\n";
  }
  dat+=";\n";
  
  // Parse mandatory projects : [["","","oui","",""]]  to  [0,0,1,0,0]
  var priority = priority[0];
  for (var prio in priority) {
    if(priority[prio] === "") {
      priority[prio] = 0;
    } else {
      priority[prio] = 1;
    }
  }
  
  // Generate param for mandatoryProjects
  // ex : param mandatoryProjects := 
  // 1	1
  // 2	0
  // ...;
  dat += 'param mandatoryProjects :=';
  dat+="\n";
  for (var prio in priority) {
    dat+=parseInt(prio)+1+'   ' + priority[prio];
    dat+="\n";
  }
  dat+=";\n";
  
  // The MathProg model parse in readable js string    
  var str = HtmlService.createHtmlOutputFromFile("mod").getContent();
  // Replace html entities autoescape by the right character
  str = str.replace(/(&lt;)/ig, "<");
  str = str.replace(/(&gt;)/ig, ">");
  str = str.replace(/(&#34;)/ig, '"');
  str = str.replace(/(&#43;)/ig, "+");
  
  // http://www.howtocreate.co.uk/tutorials/jsexamples/syntax/prepareInline.html
  //    var str = '\/* ASSIGN, Assignment Problem *\/\n\n\/* Written in GNU MathProg by Andrew Makhorin *\/\n\n\/* The assignment problem is one of the fundamental combinatorial\n   optimization problems.\n\n   In its most general form, the problem is as follows:\n\n   There are a number of students and a number of projects. Any student can be\n   assigned to perform any project, incurring some cost that may vary\n   depending on the student-project assignment. It is required to perform all\n   projects by assigning exactly one student to each project in such a way that\n   the total cost of the assignment is minimized.\n\n   (From Wikipedia, the free encyclopedia.) *\/\n\nparam nbStudents, integer, > 0;\n\/* number of students *\/\n\nparam nbProjects, integer, > 0;\n\/* number of projects *\/\n\nparam maxStudentsPerProjects, integer, >0;\n\nparam ProjectsPerStudents, integer, >=0;\n\nset I := 1..nbStudents;\n\/* set of students *\/\n\nset J := 1..nbProjects;\n\/* set of projects *\/\n\nparam preference{i in I ,j in J}, >= 0;\n\/* cost of allocating project j to student i *\/\n\nparam mandatoryProjects{j in J}, binary, >=0;\n\/* set of mandatory projects, 1 means mandatory project, 0 optional *\/\n\nvar affectation{i in I, j in J}, binary, >= 0;\n\/* affectation[i,j] = 1 means projects j is assigned to student i\n   note that variables affectation[i,j] are binary, however, there is no need to\n   declare them so due to the totally unimodular constraint matrix *\/\n\n\nvar minPreferenceValue, integer, >=0, <=nbProjects;\n\n\ns.t. howManyProjectsPerStudents{i in I}: sum{j in J} affectation[i,j] = ProjectsPerStudents;\n\/* each student can perform at most one project *\/\n\ns.t. howManyStudentsPerProjectsMax{j in J}: sum{i in I} affectation[i,j] <= maxStudentsPerProjects;\n\/* each project must be assigned exactly to one student *\/\n\n\ns.t. minPreference{i in I}: sum{j in J} affectation[i,j]*preference[i,j] >= minPreferenceValue;\n\n\ns.t. mandatoryProjectsST{j in J}: mandatoryProjects[j] * (sum{i in I} affectation[i,j]) >= mandatoryProjects[j];\n\nmaximize obj:  minPreferenceValue + sum{i in I, j in J} preference[i,j] * affectation[i,j] ;\n\n\/* the objective is to find a best solution in term of mean preference and justice*\/\n\nsolve;';
  
  // Create model (.mod + .dat)
  var model = str+'data;\n'+dat+"end;";
  
  log('model = ' + model);
  
  log('Start resolution');
  // Show loading dialog
  var htmlTemplate = HtmlService.createTemplateFromFile('assign');
  htmlTemplate.data = JSON.stringify(model);
  var htmlOutput = htmlTemplate.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Solving in progress...');
  
  
}

