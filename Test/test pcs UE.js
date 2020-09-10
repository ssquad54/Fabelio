/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
// Load two standard modules.
define(['N/record', 'N/ui/serverWidget'], function(record, serverWidget) {

    function myBeforeSubmit(context) {

        var newRecord = context.newRecord;

        var lineCount = newRecord.getLineCount({
            sublistId: 'item'
        });

        log.debug("linecount", lineCount);

        if (lineCount > 0) {
            for (var i = 0; i < lineCount; i++) {
                var itemList = newRecord.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: i
                });

                log.debug("itemList", itemList);

                var lotNumber = itemList.getLineCount({
                    sublistId: 'inventoryassignment'
                });

                log.debug("lotNumber", lotNumber);

                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_bmpt_pcs',
                    line: i,
                    value: lotNumber
                });

                pcsCount = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_bmpt_pcs',
                    line: i
                });

                log.debug("PCS", pcsCount);
            };
        };
    };
    return {
        beforeSubmit: myBeforeSubmit
    }
})