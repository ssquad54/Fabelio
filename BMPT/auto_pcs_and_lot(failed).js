/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {
    function validateLine(context) {
        var currentRecord = context.currentRecord;

        var count = '';
        var lotNumber = '';
        var lotQuantity = '';
        var lotDetail = [];

        var invdetail = currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        log.debug({
            title: 'invdetail',
            details: invdetail
        });

        if (invdetail) {
            count = invdetail.getLineCount({
                sublistId: 'inventoryassignment'
            });
            log.debug({
                title: 'count',
                details: count
            });

            for (var i = 0; i < count; i++) {
                currentRecord.selectLine({
                    sublistId: 'inventoryassignment',
                    line: i
                });

                lotNumber = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber'
                });
                log.debug({
                    title: "lotNumber",
                    details: lotNumber
                });

                lotQuantity = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity'
                });
                log.debug({
                    title: "lotQuantity",
                    details: lotQuantity
                });

                lotDetail.push({
                    "lotNumber": lotNumber,
                    "lotQuantity": lotQuantity
                });
                log.debug({
                    title: "lotDetail",
                    details: lotDetail
                });
            }
        }

        // "custcol_bmpt_pcs" is the Script Id of the Custom Transaction Line Field
        if (count > 0) {
            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_bmpt_pcs',
                value: count
            });

            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lot_number_detail',
                value: lotDetail
            });

            log.debug({
                title: 'Success !!',
                details: 'This item have ' + count + ' PCS'
            });
        }

        return true;
    }
    return {
        validateLine: validateLine
    };
});