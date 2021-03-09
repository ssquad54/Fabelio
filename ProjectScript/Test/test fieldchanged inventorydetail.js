/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord'], function(record, currentrecord) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var fieldName = context.fieldId;

        if (sublistName === 'inventoryassignment' && sublistFieldName === 'issueinventorynumber') {

            var qtyAvailable = currentRecord.getSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantityavailable'
            });

            log.debug("qtyAvailable", qtyAvailable);

            currentRecord.setSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity',
                value: qtyAvailable
            });

            var quantity = currentRecord.getSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity'
            });

            log.debug("quantity", quantity);
        }
    }
    return {
        fieldChanged: fieldChanged
    };
});