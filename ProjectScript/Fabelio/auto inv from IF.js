/**
 *@copyright 2020
 *@author Eko Susanto
 *
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, search, transaction) {
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.EDIT)
            return;

        var newRecord = context.newRecord;

        var lineCount = newRecord.getLineCount({
            sublistId: 'item'
        });

        var createdFrom = newRecord.getValue({
            fieldId: 'createdfrom'
        });

        var newInvoice = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: createdFrom,
            toType: record.Type.INVOICE,
            isDynamic: true
        });

        var invLineCount = newInvoice.getLineCount({
            sublistId: 'item'
        });

        for (var i = 0; i < lineCount; i++) {
            var fulfillItem = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            log.debug({
                title: "fulfillItem",
                details: fulfillItem
            });

            var fulfillQty = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });
            log.debug({
                title: "fulfillQty",
                details: fulfillQty
            });

            var inventoryDetail = newRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: i
            });

            var serialLineCount = inventoryDetail.getLineCount({
                sublistId: 'inventoryassignment'
            });

            for (var serialLine = 0; serialLine < serialLineCount; serialLine++) {
                var serialNumber = inventoryDetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber',
                    line: serialLine
                });

                var serialBin = inventoryDetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'binnumber',
                    line: serialLine
                });

                var serialQty = inventoryDetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    line: serialLine
                });

                log.debug({
                    title: "inventory Detail",
                    details: "Serial : " + serialNumber + ", Bin : " + serialBin + ", Quantity : " + serialQty
                });

                for (var invLine = 0; invLine < invLineCount; invLine++) {

                    newInvoice.selectLine({
                        sublistId: 'item',
                        line: invLine
                    });

                    var invItem = newInvoice.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    log.debug({
                        title: 'invItem',
                        details: invItem
                    });

                    if (fulfillItem == invItem) {
                        newInvoice.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: fulfillQty
                        });

                        var invSerialNumber = newInvoice.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });
                        log.debug({
                            title: 'invSerialNumber',
                            details: invSerialNumber
                        });

                        newInvoice.commitLine({
                            sublistId: 'item'
                        });

                    } else if (fulfillItem !== invItem) {
                        newInvoice.removeLine({
                            sublistId: 'item',
                            line: invLine,
                            ignoreRecalc: false
                        });
                    }
                }
            }
        }
        var saveInvoice = newInvoice.save();
        log.debug({
            title: "saveInvoice",
            details: saveInvoice
        });
    }
    return {
        afterSubmit: afterSubmit
    };
});