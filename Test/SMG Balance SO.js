{
	var SUBLIST = 'custpage_sbl';
	var COL_SODATE = 'custpage_colsodate';
	var COL_SONO = 'custpage_colsono';
	var COL_CUSTOMER = 'custpage_colcustomer';
	var COL_SOAMOUNT = 'custpage_colsoamount';
	var COL_SOSTATUS = 'custpage_colsostatus';
	var COL_INVNO = 'custpage_colinvno';
	var COL_INVAMOUNT = 'custpage_colinvamount';
	var COL_INVDATE = 'custpage_colinvdate';
	var COL_SOBALANCE = 'custpage_colsobalance';
	
	var BTN_EXPORT = 'custpage_btnexport';
	var HC_SCRIPT_EXPORT = 'exportReport';
	var SCRIPT_BALANCESO_CS = 'customscript_smg_balance_so_cs';
}

function balanceSOReport (request, response)
{
	//var list = nlapiCreateList('SO Balance');
	//list.setStyle(request.getParameter('style'));
	
	var frm = nlapiCreateForm('Sales Order Balance', false);
	var fld = frm.addField('custpage_rows', 'select', 'View Row Numbers');
	frm.addField('custpage_sonum', 'text', 'Sales Order Number');
	var lengthSOList = getSOList().length;
	//nlapiLogExecution('DEBUG', 'lengthSOList = ' + lengthSOList);
	var rowsPerPage = 30;
	
	var maxPage = (lengthSOList/rowsPerPage).toFixed(0);
	//nlapiLogExecution('DEBUG', 'maxPage = ' + maxPage);
	
	for (var i = 1; i < maxPage; i++) {
		if (i == 1) {
			fld.addSelectOption(i*rowsPerPage, i + ' to ' + i*rowsPerPage);
		} else {
			fld.addSelectOption(i*rowsPerPage, (i*rowsPerPage+1) + ' to ' + (i+1)*rowsPerPage);
		}		
	}
	
	frm.setScript(SCRIPT_BALANCESO_CS);
	var rowCount = request.getParameter('custpage_rows');
	var soNumber = request.getParameter('custpage_sonum');
	
	//nlapiLogExecution('DEBUG', 'soNumber = ' + soNumber);
	
	if (null == rowCount || rowCount == '') {
		rowCount = rowsPerPage;
	}
	
	//nlapiLogExecution('DEBUG', 'rowCount 2 = ' + rowCount);
	
	var rowCountURL = request.getParameter('param_rowCount');
	var soNumberURL = request.getParameter('param_soNo');
	
	//nlapiLogExecution('DEBUG', 'rowCountURL = ' + rowCountURL);
	//nlapiLogExecution('DEBUG', 'soNumberURL = ' + soNumberURL);
	
	if (null != rowCountURL && rowCountURL != '') {
		rowCount = rowCountURL;
		fld.setDefaultValue(rowCount);
	}
	
	//nlapiLogExecution('DEBUG', 'rowCount 3 = ' + rowCount);
	
	var sbl = frm.addSubList(SUBLIST, 'list', 'Transactions');
	
	/*
	list.addColumn('col_sodate', 'date', 'SO Date', 'left');
	list.addColumn('col_sono', 'text', 'SO Number', 'left');
    list.addColumn('col_customer', 'text', 'Customer', 'left');
    list.addColumn('col_soamount', 'currency', 'SO Amount', 'right');
	list.addColumn('col_invdate', 'date', 'Invoice Date', 'left');
	list.addColumn('col_invno', 'text', 'Invoice No', 'left');
	list.addColumn('col_invamount', 'currency', 'Prepay Amount', 'right');
	list.addColumn('col_balance', 'currency', 'SO Balance', 'right');
	*/
	
	sbl.addField(COL_SODATE, 'date', 'Sales Order Date');
	sbl.addField(COL_SONO, 'text', 'Sales Order No');
	sbl.addField(COL_CUSTOMER, 'text', 'Customer Name');
	sbl.addField(COL_SOAMOUNT, 'currency', 'Sales Order Amount');
	sbl.addField(COL_SOSTATUS, 'text', 'Sales Order Status');
	sbl.addField(COL_INVNO, 'text', 'Invoice Prepayment No');
	sbl.addField(COL_INVDATE, 'date', 'Invoice Prepayment Date');
	sbl.addField(COL_INVAMOUNT, 'currency', 'Prepayment Amount');
	sbl.addField(COL_SOBALANCE, 'currency', 'Sales Order Balance');
	
	try {
		
		var SOList = nlapiLoadSearch('transaction', 'customsearch_smg_so_list');
		
		if (null != soNumberURL && soNumberURL != '') {
			SOList.addFilter(new nlobjSearchFilter('tranid', null, 'contains', soNumberURL));
		}
		
		var SOResultSet = SOList.runSearch();
		var SOResults = SOResultSet.getResults(rowCount - rowsPerPage, rowCount);
		//var SOResults = SOResultSet.getResults('21', '30');
		var nLineCtr = 1;
		
		//nlapiLogExecution('DEBUG', 'rowCount = ' + rowCount);
		//nlapiLogExecution('DEBUG', 'rowsPerPage = ' + rowsPerPage);
		nlapiLogExecution('DEBUG', 'SOResults.length = ' + SOResults.length);
		
		for(var i = 0; SOResults != null && i < SOResults.length; i++){
			
			searchresult = SOResults[i];
			
			var idSO = searchresult.getValue('internalid', null, 'group');
			var tranidSO = searchresult.getValue('tranid', null, 'group');
			var trandateSO = searchresult.getValue('trandate', null, 'group');
			var nameSO = searchresult.getText('name', null, 'group');
			var statusSO = searchresult.getText('status', null, 'group');
			var totalSO = parseFloat(searchresult.getValue('amount', null, 'max'));
			
			if ( tranidSO == '1') {
			nlapiLogExecution('DEBUG', '1 tranidSO = ' + tranidSO +
									   ' idSO = ' + idSO +
			                           //' trandateSO = ' + trandateSO +
									   //' nameSO = ' + nameSO +
									   //' totalSO = ' + totalSO +
									   ' i = ' + i);
			
			}
			
			//nlapiLogExecution('DEBUG', 'idSO = ' + idSO);			
			
			var fTotalPrepayAmt = 0;
			var prepayList = getPrepayList(idSO);
			
			if ( tranidSO == '1') {
			nlapiLogExecution('DEBUG', 'prepayList.length = ' + prepayList.length);
			}
			
			if (prepayList.length == 0) {
				//nlapiLogExecution('DEBUG', 'If prepaylist length = 0');
				/*
				list.addRow('05/30/2019', 
					        '123', 
							'tes', 
							'567',
							'05/30/2019',
							'123',
							'123',
							'123');*/
				
				/*
				list.addRow({
					row :{col_sodate   : trandateSO, 
					        col_sono     : tranidSO, 
							col_customer : nameSO, 
							col_soamount : totalSO,
							col_invdate  : '',
							col_invno    : '',
							col_invamount: '',
							col_balance  : totalSO
						   }
				});*/
				
				sbl.setLineItemValue(COL_SODATE, nLineCtr, trandateSO);
				sbl.setLineItemValue(COL_SONO, nLineCtr, tranidSO);
				sbl.setLineItemValue(COL_CUSTOMER, nLineCtr, nameSO);
				sbl.setLineItemValue(COL_SOAMOUNT, nLineCtr, totalSO);
				sbl.setLineItemValue(COL_SOSTATUS, nLineCtr, statusSO);
				sbl.setLineItemValue(COL_SOBALANCE, nLineCtr, totalSO);
				nLineCtr++;
			} else {
				
				//nlapiLogExecution('DEBUG', 'If prepaylist length > 0');
				
				for(var j = 0; j < prepayList.length; j++){
					var tranidInv = prepayList[j].getValue('tranid', null, 'group');
					var trandateInv = prepayList[j].getValue('trandate', null, 'group');
					var totalInv = parseFloat(prepayList[j].getValue('total', null, 'max'));
					var soBalance = totalSO - fTotalPrepayAmt
					
					/*
					if ( tranidSO == 'SO/MFG19000549') {
					nlapiLogExecution('DEBUG', '2 tranidSO = ' + tranidSO +
											   ' trandateSO = ' + trandateSO +
											   ' nameSO = ' + nameSO +
											   ' totalSO = ' + totalSO);
					
					
					nlapiLogExecution('DEBUG', '3 tranidInv = ' + tranidInv +
											   ' trandateInv = ' + trandateInv +
											   ' totalInv = ' + totalInv +
											   ' fTotalPrepayAmt = ' + fTotalPrepayAmt +
											   ' balanceSO = ' + soBalance);
					}*/
				
					/*
					list.addRow({
						row :{col_sodate   : trandateSO, 
								col_sono     : tranidSO, 
								col_customer : nameSO, 
								col_soamount : totalSO,
								col_invdate  : trandateInv,
								col_invno    : tranidInv,
								col_invamount: totalInv,
								col_balance  : soBalance
							   }
					});*/
					
					sbl.setLineItemValue(COL_SODATE, nLineCtr, trandateSO);
					sbl.setLineItemValue(COL_SONO, nLineCtr, tranidSO);
					sbl.setLineItemValue(COL_CUSTOMER, nLineCtr, nameSO);
					sbl.setLineItemValue(COL_SOAMOUNT, nLineCtr, totalSO);
					sbl.setLineItemValue(COL_SOSTATUS, nLineCtr, statusSO);
					sbl.setLineItemValue(COL_INVNO, nLineCtr, tranidInv);
					sbl.setLineItemValue(COL_INVDATE, nLineCtr, trandateInv);
					sbl.setLineItemValue(COL_SOBALANCE, nLineCtr, soBalance);
					nLineCtr++;
				}
			}				
		}		
	} catch(e){
		nlapiLogExecution('DEBUG', 'Error', e);
	}
	
	//response.writePage( list );
	
	frm.addButton(BTN_EXPORT, 'Export', HC_SCRIPT_EXPORT);
	response.writePage( frm );
	nlapiLogExecution('DEBUG', '>>>END', nlapiGetContext().getRemainingUsage());
}

function getSOList ()
{
	
     var returncols = new Array();
	 var searchFilters = new Array();
	 
	 searchFilters.push(new nlobjSearchFilter('type', null, 'anyof', ['SalesOrd']));
	 searchFilters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	 //searchFilters.push(new nlobjSearchFilter('trandate', null, 'within', '08/07/2019','15/07/2019'));
	 //searchFilters.push(new nlobjSearchFilter('tranid', null, 'contains', 'SO/MFG'));
	 //searchFilters.push(new nlobjSearchFilter('status', null, 'noneof', 'closed'));
	 //searchFilters.push(new nlobjSearchFilter('tranid', null, 'anyof', ['SO/MFG19000513','SO/MFG19000519','SO/MFG19000518']));
	 
	 returncols.push(new nlobjSearchColumn('internalid', null, 'group').setSort());
	 returncols.push(new nlobjSearchColumn('tranid', null, 'group'));
	 returncols.push(new nlobjSearchColumn('trandate', null, 'group'));
	 returncols.push(new nlobjSearchColumn('name', null, 'group'));
	 returncols.push(new nlobjSearchColumn('amount', null, 'max'));
	 returncols.push(new nlobjSearchColumn('custbody_from_unknown', null, 'group'));
	 returncols.push(new nlobjSearchColumn('status', null, 'group'));
	 
 
	 var results = nlapiSearchRecord('transaction', null, searchFilters, returncols);
	 
	 return results || new Array();
}

function getPrepayList(internalid)
{
	 var returncols = new Array();
	 /*var searchFilters = new Array();
	 
	 searchFilters.push(new nlobjSearchFilter('type', null, 'anyof', ['CustInvc','CustCred']));
	 searchFilters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	 searchFilters.push(new nlobjSearchFilter('mainline', 'custbody_no_so_transaction', 'is', 'T'));
	 searchFilters.push(new nlobjSearchFilter('customform', null, 'anyof', ['136','128']));
	 searchFilters.push(new nlobjSearchFilter('custbody_no_so_transaction', null, 'is', internalid));*/
	 
	 var filterExpression = [['mainline', 'is', 'T'],
	                          'and', ['custbody_no_so_transaction.mainline', 'is', 'T'],
							  'and', ['customform', 'anyof', ['136','128']],
							  'and', ['custbody_no_so_transaction', 'is', internalid],
							  'and', [['type', 'anyof', ['CustInvc']],
							          'or', [['type', 'anyof', ['CustCred']], 
									         'and', ['custbody_from_unknown', 'is', 'T']
											]
									 ]
							]
							
	 
	 returncols.push(new nlobjSearchColumn('tranid', null, 'group'));
	 returncols.push(new nlobjSearchColumn('trandate', null, 'group'));
	 returncols.push(new nlobjSearchColumn('transactionname', null, 'group'));
	 returncols.push(new nlobjSearchColumn('entity', null, 'group'));
	 returncols.push(new nlobjSearchColumn('total', null, 'max'));
	 returncols.push(new nlobjSearchColumn('type', null, 'group'));
	 returncols.push(new nlobjSearchColumn('amount', null, 'max'));
	 
	 //var results = nlapiSearchRecord('transaction', null, searchFilters, returncols);
	 var results = nlapiSearchRecord('transaction', null, filterExpression, returncols);
	
	return results || new Array();	
}