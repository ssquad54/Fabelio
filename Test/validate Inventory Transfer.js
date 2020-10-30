/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', ], function(dialog) {
    function validateLine(context) {
        var currentRecord = context.currentRecord;
        var itemCount = currentRecord.getLineCount({
            sublistId: 'inventory'
        });

        var onHand = currentRecord.getCurrentSublistValue({
            sublistId: 'inventory',
            fieldId: 'quantityonhand'
        });

        var ItemName = currentRecord.getCurrentSublistText({
            sublistId: 'inventory',
            fieldId: 'item'
        });

        var qtyTrf = currentRecord.getCurrentSublistValue({
            sublistId: 'inventory',
            fieldId: 'adjustqtyby'
        });

        if (qtyTrf > onHand) {
            dialog.alert({ // Alert jika terjadi error
                title: 'Error',
                message: 'Please Contact Administrator - System Validate Error NS'
            });

            log.debug({
                title: 'Success',
                details: 'Alert displayed successfully'
            });
            return false;
        }
        return true;
    }

    return {
        validateLine: validateLine
    };
});