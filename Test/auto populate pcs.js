/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentrecord) {
    function validateLine(context) {
        var currentRecord = context.currentRecord;

        var invdetail = currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        var count = invdetail.getLineCount({
            sublistId: 'inventoryassignment'
        });

        // "custcol_bmpt_pcs" is the Script Id of the Custom Transaction Line Field
        currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_bmpt_pcs',
            value: count
        });

        log.debug({
            title: 'Success !!',
            details: 'This item have' + count + ' PCS'
        });
    }

    return {
        validateLine: validateLine
    };
});