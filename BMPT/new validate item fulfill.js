/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord', 'N/search'], function(record, currentRecord, search) {
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
            columns: 'recordtype',
        });
        log.debug("createdfrom Type", fromRecord);

        if (fromRecord.recordtype != 'salesorder')
            return;

        else if (fromRecord.recordtype == 'salesorder') {
            var soRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: true
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

                var soItemCount = soRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug({
                    title: "soItemCount",
                    details: soItemCount
                });

                var totalAmount = 0;
                var amount = 0;
                //get item Detail per Line
                for (var i = 0; i < itemCount; i++) {
                    var fulfillCheck = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        line: i
                    });
                    log.debug({
                        title: "fulfillCheck" + [i],
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

                var reason = soRecord.getValue({
                    fieldId: 'custbody_approval_reason'
                });

                if (totalAmount > remainingBalance) {
                    // confirmation dialog
                    var confirmation = confirm('Total Customer Balance ' + totalBalance.toLocaleString("id-ID", currencySymbol) +
                        '\nhas Exceeded Customer Credit Limit of ' + creditLimit.toLocaleString("id-ID", currencySymbol) +
                        '\nDo You Want Submit Approval ?');

                    log.debug({
                        title: "confirmation",
                        details: confirmation
                    });

                    if (confirmation) {
                        if (reason == "" || reason == null) {
                            var input_reason = prompt('Please enter approval reason');

                            // set Sales Order Record 'approval reason' field Value . 
                            var soUpdate = record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: soId,
                                values: {
                                    'custbody_approval_reason': input_reason
                                }
                            });

                            log.debug({
                                title: 'soUpdate',
                                details: soUpdate
                            });
                        }

                        //set approval status to 1 - pending approval
                        var approvalSO = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: soId,
                            values: {
                                'custbody_approval_status_so': 1
                            }
                        });

                        /* for (var u = 0; u < itemCount; u++) {
                            var fulfill = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                line: u
                            });
                            log.debug({
                                title: "fulfill" + [u],
                                details: fulfill
                            });
                            // validate if fulfill field is checked
                            if (fulfill == true) {
                                var currentItem = currentRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: u
                                });
                                log.debug({
                                    title: "currentItem",
                                    details: currentItem
                                });

                                var currentQty = currentRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: u
                                });
                                log.debug({
                                    title: "currentQty",
                                    details: currentQty
                                });

                                // get SO item information. 
                                for (var so = 0; so < soItemCount; so++) {
                                    var soLine = soRecord.selectLine({
                                        sublistId: 'item',
                                        line: so
                                    });

                                    var SOItem = soRecord.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item'
                                    });
                                    log.debug({
                                        title: 'SOItem ' + [so],
                                        details: SOItem
                                    });

                                    if (currentItem == SOItem) {
                                        soRecord.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_need_approval',
                                            value: true
                                        });

                                        soRecord.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_fulfill_qty',
                                            value: currentQty
                                        });
                                    }
                                    soRecord.commitLine({
                                        sublistId: 'item'
                                    });
                                }
                            }
                        } */

                        // soRecord.save();

                        //open Sales Order Record at current Windows.
                        window.open('https://6261179-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + soId, +'_self');
                    } else {
                        alert('Silahkan Perbaiki dan Submit Kembali !!');
                    }
                    return false;
                }
            }
        }
        return true;
    }
    return {
        saveRecord: saveRecord
    };
});