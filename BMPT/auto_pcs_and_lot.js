/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function(currentRecord, dialog) {
    function validateLine(scriptContext) {

        var serialno = [];
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
                    fieldId: 'issueinventorynumber'
                });
                log.debug("qty", qty);

                serialno.push({
                    "lotNumber": id,
                    "lotQty": qty
                });
                log.debug("serialno", serialno);
            }
        }

        if (itemWarehouse != warehouse && createTrfOrd == false) {
            dialog.alert({ // Alert jika terjadi error
                title: "warehouse Beda",
                message: "Anda Memilih Warehouse Yang Berbeda. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tercentang jika Ingin dilakukan Transfer Order!"
            });
            log.debug("Alert", "Alert displayed successfully");
            return false;
        } else if (itemWarehouse == warehouse && createTrfOrd == true) {
            dialog.alert({ // Alert jika terjadi error
                title: "Warehouse Sama",
                message: "Anda Memilih Warehouse Yang Sama. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tidak Tercentang!"
            });
            log.debug("Alert", "Alert displayed successfully");
            return false;
        } else if (itemWarehouse != warehouse && createTrfOrd == true) {
            scriptContext.currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lot_number_detail',
                value: JSON.stringify(serialno)
            });

            scriptContext.currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_bmpt_pcs',
                value: cnt
            });
            return true;
        }
    }
    return {
        validateLine: validateLine
    };
});