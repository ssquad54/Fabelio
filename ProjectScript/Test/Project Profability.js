{
    var SUBLIST = 'custpage_sbl';
    var COL_ID = 'custpage_colid';
    var COL_NAME = 'custpage_colname';
    var COL_SODATE = 'custpage_colsodate';
    var COL_SONO = 'custpage_colsono';
    var COL_PROJECT = 'custpage_project';
    var COL_ITEM = 'custpage_colitem'
    var COL_NMV = 'custpage_colnmv';
    var COL_GMV = 'custpage_colgmv';
    var COL_COSTPRICE = 'custpage_colcostprice';
    var COL_PRICEPERITEM = 'custpage_pricepreritem';
    var COL_QTYORDERED = 'custpage_quantityordered';
    var COL_COGS = 'custpage_cogs';
    var COL_SHIPPINGCOST = 'custpage_colshippingcost';
    var COL_OVERHEADCOST = 'custpage_overheadcost';
    var COL_CITY = 'custpage_city';
    var COL_NPSSTATUS = 'custpage_npsstatus';
    var COL_CONTRACTOR = 'custpage_contractor';
    var COL_TYPEOFPROJECT = 'custpage_typeofproject';
    var COL_CATEGORY = 'custpage_category';
    var COL_SUBCATEGORY = 'custpage_subcategory';
    var COL_MARGIN = 'custpage_margin';
    var COL_SOURCECHANNEL = 'custpage_sourcechannel';
    var COL_SM = 'custpage_sm';
    var COL_DESIGNER = 'custpage_designer';
    var COL_ESTIMATOR = 'custpage_estimator';
    var COL_PROJECTMANAGER = 'custpage_projectmanager';
    var COL_SOBALANCE = 'custpage_colsobalance';

    var BTN_EXPORT = 'custpage_btnexport';
    var HC_SCRIPT_EXPORT = 'exportReport';
    var SCRIPT_PROJECT_PROFITABILITY = 'customscript_kri_project_profability';
}

function balanceSOReport(request, response) {
    //var list = nlapiCreateList('SO Balance');
    //list.setStyle(request.getParameter('style'));

    var frm = nlapiCreateForm('Project Profitability', false);
    var fld = frm.addField('custpage_rows', 'select', 'View Row Numbers');
    frm.addField('custpage_sonum', 'text', 'Sales Order Number');
    frm.addField('custpage_projectname', 'text', 'Project Name');
    var lengthSOList = getSOList().length;
    //nlapiLogExecution('DEBUG', 'lengthSOList = ' + lengthSOList);
    var rowsPerPage = 50;

    var maxPage = (lengthSOList / rowsPerPage).toFixed(0);
    //nlapiLogExecution('DEBUG', 'maxPage = ' + maxPage);

    for (var i = 1; i < maxPage; i++) {
        if (i == 1) {
            fld.addSelectOption(i * rowsPerPage, i + ' to ' + i * rowsPerPage);
        } else {
            fld.addSelectOption(i * rowsPerPage, (i * rowsPerPage + 1) + ' to ' + (i + 1) * rowsPerPage);
        }
    }

    frm.setScript(SCRIPT_PROJECT_PROFITABILITY);
    var rowCount = request.getParameter('custpage_rows');
    var soNumber = request.getParameter('custpage_sonum');
    var projectName = request.getParameter('custpage_project');

    //nlapiLogExecution('DEBUG', 'soNumber = ' + soNumber);

    if (null == rowCount || rowCount == '') {
        rowCount = rowsPerPage;
    }

    //nlapiLogExecution('DEBUG', 'rowCount 2 = ' + rowCount);

    var rowCountURL = request.getParameter('param_rowCount');
    var soNumberURL = request.getParameter('param_soNo');
    var projectName = request.getParameter('param_projectNo');

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

    sbl.addField(COL_ID, 'text', 'Customer ID');
    sbl.addField(COL_NAME, 'text', 'Customer Name');
    sbl.addField(COL_SODATE, 'date', 'SO Date');
    sbl.addField(COL_SONO, 'text', 'Sales Order No');
    sbl.addField(COL_PROJECT, 'text', 'Project Name');
    sbl.addField(COL_ITEM, 'text', 'Item Name');
    sbl.addField(COL_NMV, 'currency', 'NMV');
    sbl.addField(COL_GMV, 'currency', 'GMV');
    sbl.addField(COL_COSTPRICE, 'currency', 'Cost Price');
    sbl.addField(COL_PRICEPERITEM, 'currency', 'Price per Item');
    sbl.addField(COL_QTYORDERED, 'currency', 'Quantity Ordered');
    sbl.addField(COL_COGS, 'currency', 'COGS');
    sbl.addField(COL_SHIPPINGCOST, 'currency', 'Shipping Cost');
    sbl.addField(COL_OVERHEADCOST, 'currency', 'Overehad Cost');
    sbl.addField(COL_CITY, 'text', 'City');
    sbl.addField(COL_NPSSTATUS, 'text', 'NPS Status');
    sbl.addField(COL_CONTRACTOR, 'text', 'Contractor');
    sbl.addField(COL_TYPEOFPROJECT, 'text', 'Type of Project');
    sbl.addField(COL_CATEGORY, 'text', 'Category');
    sbl.addField(COL_SUBCATEGORY, 'text', 'Sub Category');
    sbl.addField(COL_MARGIN, 'text', 'Margin');
    sbl.addField(COL_SOURCECHANNEL, 'text', 'Source Channel');
    sbl.addField(COL_SM, 'text', 'SM');
    sbl.addField(COL_DESIGNER, 'text', 'Designer');
    sbl.addField(COL_ESTIMATOR, 'text', 'Estimator');
    sbl.addField(COL_PROJECTMANAGER, 'text', 'Project Manager');
    sbl.addField(COL_SOBALANCE, 'text', 'SO Balance');

    try {

        var SOList = nlapiLoadSearch('transaction', 'customsearch_kri_project_profitability_2');

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

        for (var i = 0; SOResults != null && i < SOResults.length; i++) {

            searchresult = SOResults[i];

            var idSO = searchresult.getValue('internalid');
            var custId = searchresult.getValue('entityid', 'customerMain');
            var custName = searchresult.getValue('altname', 'customerMain');
            var trandateSO = searchresult.getValue('trandate');
            var tranidSO = searchresult.getText('tranid');
            var itemSO = searchresult.getText('item');
            var qtySO = seaarchresult.getText('quantity');
            //    var totalSO = parseFloat(searchresult.getValue('amount', null, 'max'));

            nlapiLogExecution('DEBUG', 'trandateSO' + trandateSO);

            if (tranidSO == '1') {
                nlapiLogExecution('DEBUG', '1 tranidSO = ' + tranidSO +
                    ' idSO = ' + idSO +
                    //' trandateSO = ' + trandateSO +
                    //' nameSO = ' + nameSO +
                    //' totalSO = ' + totalSO +
                    ' i = ' + i);

            }

            //nlapiLogExecution('DEBUG', 'idSO = ' + idSO);			

            var fTotalPrepayAmt = 0;
            var purchaseList = getPoList(idSO);

            if (tranidSO == '1') {
                nlapiLogExecution('DEBUG', 'purchaseList.length = ' + purchaseList.length);
            }

            if (purchaseList.length == 0) {
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

                sbl.setLineItemValue(COL_ID, nLineCtr, custId);
                sbl.setLineItemValue(COL_NAME, nLineCtr, custName);
                sbl.setLineItemValue(COL_SODATE, nLineCtr, trandateSO);
                sbl.setLineItemValue(COL_SONO, nLineCtr, tranidSO);
                sbl.setLineItemValue(COL_ITEM, nLineCtr, itemSO);
                sbl.setLineItemValue(COL_QTYORDERED, nLineCtr, qtySO);
                nLineCtr++;
            } else {

                //nlapiLogExecution('DEBUG', 'If prepaylist length > 0');

                for (var j = 0; j < purchaseList.length; j++) {
                    var tranidInv = purchaseList[j].getValue('tranid', null, 'group');
                    var trandateInv = purchaseList[j].getValue('trandate', null, 'group');
                    //    var totalInv = parseFloat(purchaseList[j].getValue('total', null, 'max'));
                    //    var soBalance = totalSO - fTotalPrepayAmt

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
                    sbl.setLineItemValue(COL_CUSTOMER, nLineCtr, custName);
                    sbl.setLineItemValue(COL_SOAMOUNT, nLineCtr, totalSO);
                    sbl.setLineItemValue(COL_SOSTATUS, nLineCtr, statusSO);
                    sbl.setLineItemValue(COL_INVNO, nLineCtr, tranidInv);
                    sbl.setLineItemValue(COL_INVDATE, nLineCtr, trandateInv);
                    sbl.setLineItemValue(COL_SOBALANCE, nLineCtr, soBalance);
                    nLineCtr++;
                }
            }
        }
    } catch (e) {
        nlapiLogExecution('DEBUG', 'Error', e);
    }

    //response.writePage( list );

    frm.addButton(BTN_EXPORT, 'Export', HC_SCRIPT_EXPORT);
    response.writePage(frm);
    nlapiLogExecution('DEBUG', '>>>END', nlapiGetContext().getRemainingUsage());
}

function getSOList() {

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
    // returncols.push(new nlobjSearchColumn('custbody_from_unknown', null, 'group'));
    returncols.push(new nlobjSearchColumn('status', null, 'group'));


    var results = nlapiSearchRecord('transaction', null, searchFilters, returncols);

    return results || new Array();
}

function getPoList(internalid) {
    var returncols = new Array();
    /*var searchFilters = new Array();
	 
    searchFilters.push(new nlobjSearchFilter('type', null, 'anyof', ['CustInvc','CustCred']));
    searchFilters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
    searchFilters.push(new nlobjSearchFilter('mainline', 'custbody_no_so_transaction', 'is', 'T'));
    searchFilters.push(new nlobjSearchFilter('customform', null, 'anyof', ['136','128']));
    searchFilters.push(new nlobjSearchFilter('custbody_no_so_transaction', null, 'is', internalid));*/

    var filterExpression = [
        'and', ['custbody_kri_so_project.mainline', 'is', 'T'],
        'and', ['customform', 'anyof', '140'],
        'and', ['custbody_kri_so_project', 'is', internalid],
        'and', ['type', 'anyof', 'PurchOrd']
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