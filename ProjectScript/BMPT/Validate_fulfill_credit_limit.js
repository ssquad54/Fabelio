/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/currentRecord'], function(record, search, currentRecord) {
    function saveRecord(context) {
        var currentRecord = context.currentRecord;

        var isDynamic = currentRecord.isDynamic;
        log.debug({
            title: 'isDynamic',
            details: isDynamic
        });

        var soId = currentRecord.getValue({
            fieldId: 'createdfrom'
        });

        var fromRecord = search.lookupFields({ // Get Record Type from Createfrom field
            type: search.Type.TRANSACTION,
            id: soId,
            columns: ['recordtype']
        });
        log.debug("createdfrom Type", fromRecord);


        if (fromRecord.recordtype != 'salesorder')
            return true;

        else if (fromRecord.recordtype == 'salesorder') {
            var soRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: soId
            });

            var pymtMethod = soRecord.getValue({
                fieldId: 'custbody_bmpt_metode_pembayaran'
            });
            log.debug('Payment Method', pymtMethod);

            if (pymtMethod == 3 || pymtMethod == 4) {
                var creditLimit = soRecord.getValue({
                    fieldId: 'credlim'
                });
                log.debug('creditLimit', creditLimit);

                var balance = soRecord.getValue({
                    fieldId: 'balance'
                });
                log.debug('balance', balance);

                var remainingBalance = (creditLimit * 1.15) - balance;
                log.debug({
                    title: "Customer Remaining Balance",
                    details: remainingBalance
                });

                var itemCount = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug({
                    title: "itemCount",
                    details: itemCount
                });

                var totalAmount = 0;
                var amount;
                //get item Detail per Line
                for (var i = 0; i < itemCount; i++) {
                    var fulfillCheck = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        line: i
                    });
                    log.debug({
                        title: "fulfillCheck",
                        details: fulfillCheck
                    });
                    // validate if fulfill field is checked
                    if (fulfillCheck == true) {
                        var ifItem = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        log.debug({
                            title: "ifItem",
                            details: ifItem
                        });

                        var itemQty = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
                        log.debug({
                            title: "itemQty",
                            details: itemQty
                        });

                        var ifItemRate = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemunitprice',
                            line: i
                        });
                        log.debug({
                            title: "ifItemRate",
                            details: ifItemRate
                        });

                        var soItemCount = soRecord.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug({
                            title: "soItemCount",
                            details: soItemCount
                        });

                        // get SO item information. 
                        for (var so = 0; so < soItemCount; so++) {
                            var SOItem = soRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: so
                            });
                            log.debug({
                                title: 'SOItem',
                                details: SOItem
                            });

                            if (ifItem == SOItem) {
                                soRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_need_approval',
                                    line: so,
                                    value: true
                                });

                                soRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_fulfill_qty',
                                    line: so,
                                    value: itemQty
                                });
                            }
                        }
                        amount = itemQty * ifItemRate;
                        log.debug({
                            title: "amount",
                            details: amount
                        });
                    }
                    totalAmount += amount;
                    log.debug({
                        title: 'Amount Total',
                        details: totalAmount
                    });
                }

                var currencySymbol = {
                    style: "currency",
                    currency: "IDR"
                };
                var totalBalance = balance + totalAmount;
                log.debug({
                    title: 'totalBalance',
                    details: totalBalance
                });

                if (totalAmount > remainingBalance) {
                    var confirmation = confirm('Total Customer Balance ' + totalBalance.toLocaleString("id-ID", currencySymbol) +
                        '\n Sudah Melebihi Credit Limit Sebesar ' + creditLimit.toLocaleString("id-ID", currencySymbol) +
                        '\n Apakah Anda Ingin Mengajukan Approval ?');

                    log.debug({
                        title: "confirmation",
                        details: confirmation
                    });

                    if (confirmation == true) {
                        var soUpdate = soRecord.save({
                            ignoreMandatoryFields: true
                        });
                        log.debug({
                            title: 'soUpdate',
                            details: soUpdate
                        });

                        /* soRecord.setValue({
                            fieldId: 'memo',
                            value: "need approval",
                            ignoreFieldChange: true
                        });*/

                        window.open('https://6261179-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + soId, +"_self");

                        return false;
                    } else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    return {
        saveRecord: saveRecord
    };
});