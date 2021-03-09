/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function(currentRecord, dialog) {
    function validateLine(scriptContext) {

        var itemDetail;
        var inventorydetail = [];
        var cnt = '';

        var customForm = scriptContext.currentRecord.getValue({
            fieldId: 'customform'
        });
        log.debug('Custom Form', customForm);

        var soGrosir = scriptContext.currentRecord.getValue({
            fieldId: 'custbody_grosir'
        });
        log.debug('SO Roll', soGrosir);

        var warehouse = scriptContext.currentRecord.getValue({
            fieldId: 'location'
        });
        var profitCenter = scriptContext.currentRecord.getValue({
            fieldId: 'department'
        });

        if (scriptContext.sublistId == 'item') {
            var itemWarehouse = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
            });

            var PriceLevel = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price'
            });
            log.debug('PriceLevel', PriceLevel);

            var quantity = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
            });

            var quantityAvailable = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantityavailable',
            });
            if (profitCenter == 2 && customForm != 118) {
                if (quantity > quantityAvailable) {
                    dialog.alert({ // Alert jika terjadi error
                        title: "Alert!",
                        message: "Pastikan " + "Quantity".bold() + " tidak lebih besar dari " + "Quantity Available !!".bold()
                    });
                    log.debug("Alert", "Alert quantity displayed successfully");
                }
            }

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

                if (customForm == 114 && soGrosir == true && PriceLevel != 13) {
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_pcs',
                        value: cnt
                    });
                    if (cnt >= 1 && cnt <= 9) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 18
                        });
                    } else if (cnt <= 10 && cnt <= 19) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 19
                        });
                    } else if (cnt >= 20) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 20
                        });
                    }
                } else {
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_pcs',
                        value: cnt
                    });
                }

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

                /*     scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_pcs',
                        value: cnt
                    }); */

                scriptContext.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_warehouse',
                    value: itemWarehouse
                });

                scriptContext.currentRecord.removeCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });

                scriptContext.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: warehouse
                });
                return true;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
    return {
        validateLine: validateLine
    };
});