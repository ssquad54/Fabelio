/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function prepaymentReportPageInit(type){
   
}

/**
 * Exports report to excel
 */
function exportReport(){
	var sExcelHTML = '<html><body><table>';
	sExcelHTML += document.getElementById("custpage_sbl_layer").innerHTML;
	sExcelHTML += '</table></body></html>';
	window.open("data:application/vnd.ms-excel," + encodeURIComponent(sExcelHTML));
}

function clientFieldChanged(type, name, linenum) {
	
	nlapiLogExecution('DEBUG', 'type = ' + type);
	nlapiLogExecution('DEBUG', 'name = ' + name);
	nlapiLogExecution('DEBUG', 'linenum = ' + linenum);

	if (name == 'custpage_rows') {
		var rowCount = nlapiGetFieldValue('custpage_rows');
		var url = window.location.search;
		
		if (url.indexOf('&param_') > 0) {
			// Remove the previous value of the parameter: param_rowCount
			url = url.substring(0, url.indexOf('&param_'));
		}
  
		// The code below refreshes the page and passes the value of the dropdown
		// in the URL as a parameter
		window.location.search = url + '&param_rowCount=' + rowCount;
	}
	
	if (name == 'custpage_sonum') {
		var soNumber = nlapiGetFieldValue('custpage_sonum');
		//alert('soNumber cs = ' + soNumber);
		
		var url = window.location.search;
		
		//alert('url.indexOf = ' + url.indexOf('&param_'));
		
		if (url.indexOf('&param_') > 0) {
			url = url.substring(0, url.indexOf('&param_'));
		}
  
		window.location.search = url + '&param_soNo=' + soNumber;
		
		//alert('url custpage_sonum = ' + url);
	}
}/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function prepaymentReportPageInit(type){
   
}

/**
 * Exports report to excel
 */
function exportReport(){
	var sExcelHTML = '<html><body><table>';
	sExcelHTML += document.getElementById("custpage_sbl_layer").innerHTML;
	sExcelHTML += '</table></body></html>';
	window.open("data:application/vnd.ms-excel," + encodeURIComponent(sExcelHTML));
}

function clientFieldChanged(type, name, linenum) {
	
	nlapiLogExecution('DEBUG', 'type = ' + type);
	nlapiLogExecution('DEBUG', 'name = ' + name);
	nlapiLogExecution('DEBUG', 'linenum = ' + linenum);

	if (name == 'custpage_rows') {
		var rowCount = nlapiGetFieldValue('custpage_rows');
		var url = window.location.search;
		
		if (url.indexOf('&param_') > 0) {
			// Remove the previous value of the parameter: param_rowCount
			url = url.substring(0, url.indexOf('&param_'));
		}
  
		// The code below refreshes the page and passes the value of the dropdown
		// in the URL as a parameter
		window.location.search = url + '&param_rowCount=' + rowCount;
	}
	
	if (name == 'custpage_sonum') {
		var soNumber = nlapiGetFieldValue('custpage_sonum');
		//alert('soNumber cs = ' + soNumber);
		
		var url = window.location.search;
		
		//alert('url.indexOf = ' + url.indexOf('&param_'));
		
		if (url.indexOf('&param_') > 0) {
			url = url.substring(0, url.indexOf('&param_'));
		}
  
		window.location.search = url + '&param_soNo=' + soNumber;
		
		//alert('url custpage_sonum = ' + url);
	}
}