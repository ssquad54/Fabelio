function log(type, msg) {
    nlapiLogExecution('DEBUG', type, msg);
}

function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution("DEBUG", "Record", "Create Custom GL Starting ..");
    try {
        //nlapiLogExecution("DEBUG", "transactionRecord",transactionRecord);
        var rectype = transactionRecord.getRecordType();
        var recid = transactionRecord.getId();
        //var recordType = nlapiLoadRecord('itemfulfillment', recid);
        var createdfrom_text = transactionRecord.getFieldText('createdfrom');
        var recType_split = createdfrom_text.split(" #");
        var createdfrom_type = recType_split[0];

        nlapiLogExecution("DEBUG", "Record", createdfrom_type);
        if (rectype == "returnauthorization" && createdfrom_type == 'Sales Order') {
            nlapiLogExecution("DEBUG", "Record", "Return Authorization");
            var racreatedfrom = transactionRecord.getFieldValue('createdfrom');
            var rarecordTypeSo = nlapiLoadRecord('salesorder', racreatedfrom);

            var raBookId = book.getId();
            nlapiLogExecution("DEBUG", "bookId", bookId);
            if (raBookId != 1) {
                nlapiLogExecution("DEBUG", "Book Secondary", 'Book Secondary');
            } else {
                nlapiLogExecution("DEBUG", "Book primary", 'Book primary Return Authorization');

                // proses primary book
                var racurrLineCount = standardLines.getCount();
                var ralineTransaction = rarecordTypeSo.getLineItemCount('item');
                nlapiLogExecution("DEBUG", "Count Line return authorization", 'currLineCount : ' +
                    racurrLineCount + ' lineTransaction : ' + ralineTransaction);

                if (rectype == 'returnauthorization') {
                    log("masuk pembuatan GL Item Fulfillment", "Pembuatan GL return authorization");


                    for (var c = 1; c <= ralineTransaction; c++) {
                        var raamount_price = rarecordTypeSo.getLineItemValue('item', 'amount', c);
                        var raitemName = rarecordTypeSo.getLineItemText('item', 'item', c);

                        log("nama-name item", raitemName);
                        //debit
                        var newLineDebit = customLines.addNewLine();
                        //newLine.setBookSpecific(false);
                        newLineDebit.setDebitAmount(raamount_price);
                        newLineDebit.setAccountId(456);
                        //newLineDebit.setLocationId(parseInt(ralocation));
                        newLineDebit.setMemo(raitemName);
                        //Credit
                        var newLineCredit = customLines.addNewLine();
                        //newLine.setBookSpecific(false);
                        newLineCredit.setCreditAmount(raamount_price);
                        newLineCredit.setAccountId(54);
                        //newLineCredit.setLocationId(parseInt(ralocation));
                        newLineCredit.setMemo(raitemName);
                    }


                }

            }


        }

        if (rectype == 'creditmemo' && createdfrom_type == 'Return Authorization') {
            nlapiLogExecution("DEBUG", "Record", "Credit Memo Custom GL");
            var createdfrom = transactionRecord.getFieldValue('createdfrom');
            var recordTypeRa = nlapiLoadRecord('returnauthorization', createdfrom);
            //var recordTypeTransfer = nlapiLoadRecord('salesorder', createdfrom);
            //var location_id = recordTypeSo.getFieldValue('location');

            //var location_id = transactionRecord.getFieldValue('location');
            //var tranSubsidiary=transactionRecord.getFieldValue('subsidiary');
            //log("nilai subsi",tranSubsidiary);
            //nlapiLogExecution("DEBUG", "Header Field",'location_id : '+location_id+' tranSubsidiary : '+tranSubsidiary);

            //var lineItem = transactionRecord.getCount();

            var bookId = book.getId();
            nlapiLogExecution("DEBUG", "bookId", bookId);

            if (bookId != 1) {
                nlapiLogExecution("DEBUG", "Book Secondary", 'Book Secondary');
                //var currLineCount = standardLines.getCount();
                //var lineTransaction  = recordTypeSo.getLineItemCount('item');
                //nlapiLogExecution("DEBUG", "Count Line",'currLineCount : '+currLineCount+' lineTransaction : '+lineTransaction);
                //var pembagi = parseInt(currLineCount) / parseInt(lineTransaction); 3
            } else {
                nlapiLogExecution("DEBUG", "Book primary", 'Book primary');
                // proses primary book
                var currLineCount = standardLines.getCount();
                var lineTransaction = transactionRecord.getLineItemCount("item"); //recordTypeSo.getLineItemCount('item');
                nlapiLogExecution("DEBUG", "Count Line", 'currLineCount : ' + currLineCount + ' lineTransaction : ' + lineTransaction);
                //var pembagi = parseInt(currLineCount) / parseInt(lineTransaction); 3
                var location = null;
                for (var a = 1; a < currLineCount; a++) {
                    var line = standardLines.getLine(a);

                    /*var coa_id = line.getAccountId();
                    var debit_amount = line.getDebitAmount();
                    var credit_amount = line.getCreditAmount();
                    var memo = line.getMemo();*/
                    location = line.getLocationId();

                    //log("nilai2 disini",coa_id+" debit = "+debit_amount+" credit = "+credit_amount+"memo = "+memo);
                }

                if (rectype == 'creditmemo') {
                    log("masuk pembuatan GL Credit Memo", "Pembuatan GL creditmemo");

                    for (var c = 1; c <= lineTransaction; c++) {
                        var amount_price = 0.0;
                        //transactionRecord.getLineItemValue("item","amount",c);//
                        var itemValue = transactionRecord.getLineItemValue('item', 'item', c); //
                        var itemValueRa = recordTypeRa.getLineItemValue('item', 'item', c);
                        var itemNameText = transactionRecord.getLineItemText('item', 'item', c);

                        if (itemValue == itemValueRa) {
                            amount_price = recordTypeRa.getLineItemValue('item', 'amount', c);
                        }

                        //log("nama-name item",itemName+" dengan amount price = "+amount_price);
                        //debit
                        var newLineDebit = customLines.addNewLine();
                        //newLine.setBookSpecific(false);
                        newLineDebit.setDebitAmount(amount_price);
                        newLineDebit.setAccountId(456);

                        if (location != null) {
                            newLineDebit.setLocationId(parseInt(location));
                        }

                        newLineDebit.setMemo(itemNameText);
                        //Credit
                        var newLineCredit = customLines.addNewLine();
                        //newLine.setBookSpecific(false);
                        newLineCredit.setCreditAmount(amount_price);
                        newLineCredit.setAccountId(54);
                        if (location != null) {
                            newLineCredit.setLocationId(parseInt(location));
                        }
                        //
                        newLineCredit.setMemo(itemNameText);
                    }


                }
            }
        }

    } catch (e) {
        try {
            var err_title = 'Unexpected error';
            var err_description = '';
            if (e) {
                if (e instanceof nlobjError) {
                    err_description = err_description + ' ' + e.getCode() + '|' + e.getDetails() + e;
                } else {
                    err_description = err_description + ' ' + e.toString();
                }
            }
            nlapiLogExecution('ERROR', 'Log Error ' + err_title, err_description);
        } catch (ex) {
            nlapiLogExecution('ERROR', 'Error performing error logging');
        }
    }

}