/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/error', 'N/log'], function(currentrecord, error, log) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    /*     function validateLine(context) {
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

            return true;
        };
     */
    function saveRecord(context) {
        var currentRecord = context.currentRecord;

        var lineCount = currentRecord.getLineCount({
            sublistId: 'item'
        });

        log.debug("linecount", lineCount);

        if (lineCount > 0) {
            for (var i = 0; i < itemLine; i++) {
                var itemList = lineCount.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: i
                });

                log.debug("itemList", itemList);

                var lotCount = itemList.getLineCount({
                    sublistId: 'inventoryassignment'
                });

                log.debug("lotCount", lotCount);

                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_bmpt_pcs',
                    line: i,
                    value: lotNumber
                });
            }
        }
        return true;
    }

    return {
        //       validateLine: validateLine,
        saveRecord: saveRecord
    };
});