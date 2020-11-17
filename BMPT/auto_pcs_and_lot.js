/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function(currentRecord, dialog) {
    function validateLine(scriptContext) {

        var itemDetail;
        var inventorydetail = [];
        var cnt = '';

        var warehouse = scriptContext.currentRecord.getValue({
            fieldId: 'location'
        });

        var itemWarehouse = scriptContext.currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'location',
        });

        var createTrfOrd = scriptContext.currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_create_to'
        });

        var invdetail = scriptContext.currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        if (invdetail) {
            cnt = invdetail.getLineCount({
                sublistId: 'inventoryassignment'
            });

            for (var i = 0; i < cnt; i++) {
                invdetail.selectLine({
                    sublistId: 'inventoryassignment',
                    line: i
                });

                var id = invdetail.getCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber'
                });
                log.debug("id", id);

                var qty = invdetail.getCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity'
                });
                log.debug("qty", qty);

                inventorydetail.push({ "issueinventorynumber": parseInt(id), "quantity": qty });
                log.debug("inventorydetail", inventorydetail);
                log.debug("inventorydetail", JSON.stringify(inventorydetail));
                log.debug("inventorydetail.length", inventorydetail.length);
            }
        }
        scriptContext.currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_bmpt_pcs',
            value: cnt
        });

        scriptContext.currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_warehouse',
            value: itemWarehouse
        });

        if (itemWarehouse != warehouse && createTrfOrd == false) {
            dialog.alert({ // Alert jika terjadi error
                title: "Alert!",
                message: "Anda Memilih Warehouse Yang Berbeda. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tercentang jika Ingin dilakukan Transfer Order!"
            });
            log.debug("Alert", "Alert displayed successfully");
            return false;
        } else if (itemWarehouse == warehouse && createTrfOrd == true) {
            dialog.alert({ // Alert jika terjadi error
                title: "Alert!",
                message: "Anda Memilih Warehouse Yang Sama. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tidak Tercentang!"
            });
            log.debug("Alert", "Alert displayed successfully");
            return false;
        } else if (itemWarehouse != warehouse && createTrfOrd == true && cnt == 0) {
            dialog.alert({ // Alert jika terjadi error
                title: "Alert!",
                message: "Pastikan " + "\"Inventory Detail\"".bold() + " Dipilih!"
            });
            log.debug("Alert", "Alert displayed successfully");
            return false;
        } else if (itemWarehouse != warehouse && createTrfOrd == true && cnt > 0) {
            scriptContext.currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lot_number_detail',
                value: JSON.stringify(inventorydetail)
            });

            return true;
        } else {
            return true;
        }
    }
    return {
        validateLine: validateLine
    };
});