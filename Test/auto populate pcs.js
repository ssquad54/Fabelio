/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentrecord) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function validateLine(context) {
        var currentRecord = context.currentRecord;

        var inventoryDetail = currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        var lotNumber = inventoryDetail.getLineCount({
            sublistId: 'inventoryassignment',
            fieldId: 'issueinventorynumber'
        });

        currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_bmpt_pcs',
            value: lotNumber
        });

        log.debug({
            title: 'Success',
            details: 'Pcs successfully insert'
        });

        return true;
    }

    return {
        validateLine: validateLine
    };
});