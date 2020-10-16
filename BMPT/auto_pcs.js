/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {
    function validateLine(context) {
        var currentRecord = context.currentRecord;

        var count = '';

        var invdetail = currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        if (invdetail) {
            count = invdetail.getLineCount({
                sublistId: 'inventoryassignment'
            });
            log.debug({
                title: 'count',
                details: count
            });
        }

        // "custcol_bmpt_pcs" is the Script Id of the Custom Transaction Line Field
        if (count > 0) {
            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_bmpt_pcs',
                value: count,
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