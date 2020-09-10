/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', ], function(dialog) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    //    function showErrorMessage(msgText) {
    //        var myMsg = message.create({
    //            title: "Error Save Record",
    //            message: msgText,
    //            type: message.Type.ERROR
    //        });
    //        myMsg.show({
    //            duration: 10000
    //        });
    //    }

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