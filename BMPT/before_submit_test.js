/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, search, transaction) {
    function beforeSubmit(context) {
        if (context.type != context.UserEventType.CREATE)
            return;

        var currentRecord = context.newRecord;
        var warehouse = currentRecord.getValue({
            fieldId: 'location'
        });

        var lineCount = currentRecord.getLineCount({
            sublistId: 'item'
        });

        for (var u = 0; u < lineCount; u++) {
            var itemWarehouse = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                line: u
            });

            if (itemWarehouse != warehouse) {
                currentRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: u,
                    value: warehouse
                });
            }
        }
    }
    return {
        beforeSubmit: beforeSubmit
    };
});