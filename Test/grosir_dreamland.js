/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function(currentRecord, dialog) {
    function validateLine(scriptContext) {

        var itemDetail;
        var inventorydetail = [];
        var cnt = '';
        var totalPcs = 0;
        var sublistParent;
        var sublistParent2;

        var customForm = scriptContext.currentRecord.getValue({
            fieldId: 'customform'
        });
        console.info('Custom Forml : ' + customForm);

        var soGrosir = scriptContext.currentRecord.getValue({
            fieldId: 'custbody_grosir'
        });
        console.info('SO Roll : ' + soGrosir);

        var warehouse = scriptContext.currentRecord.getValue({
            fieldId: 'location'
        });
        var profitCenter = scriptContext.currentRecord.getValue({
            fieldId: 'department'
        });

        if (scriptContext.sublistId === 'item') {
            var itemWarehouse = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
            });

            var PriceLevel = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price'
            });
            console.info('PriceLevel : ' + PriceLevel);

            var quantity = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
            });
            console.info('quantity : ' + quantity);

            var pcsValue = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_bmpt_pcs'
            });
            console.info('pcsValue : ' + pcsValue);

            var quantityAvailable = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantityavailable',
            });
            console.info('quantityAvailable : ' + quantityAvailable);

            var currIndex = scriptContext.currentRecord.getCurrentSublistIndex({
                sublistId: 'item'
            });
            console.info('currIndex : ' + currIndex);

            if (profitCenter == 2 && customForm != 118) {
                if (quantity > quantityAvailable) {
                    dialog.alert({ // Alert jika terjadi error
                        title: "Alert!",
                        message: "Pastikan " + "Quantity".bold() + " tidak lebih besar dari " + "Quantity Available !!".bold()
                    });
                    console.info("Alert : Alert quantity displayed successfully");
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
                var numLines = scriptContext.currentRecord.getLineCount({
                    sublistId: 'item'
                });
                console.info('numLines : ' + numLines);

                cnt = invdetail.getLineCount({
                    sublistId: 'inventoryassignment'
                });

                if (customForm == 114 && soGrosir == true && PriceLevel != 13) {
                    if (cnt != pcsValue) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bmpt_pcs',
                            value: cnt
                        });
                    }

                    sublistParent = scriptContext.currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'oqpbucket'
                    });

                    totalPcs += cnt;

                    for (var z = numLines; z > 0; z--) {
                        sublistParent2 = scriptContext.currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'oqpbucket',
                            line: z - 1
                        });
                        console.info('sublistParent2 : ' + sublistParent2);

                        var itemPcs2 = (parseFloat(scriptContext.currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bmpt_pcs',
                            line: z - 1
                        })) || 0);
                        log.debug('itemPcs2', itemPcs2);

                        if (sublistParent == sublistParent2 && z - 1 !== currIndex) {
                            totalPcs += itemPcs2;
                            log.debug('totalPcs2', totalPcs);
                        }
                    }

                    // try to set 'Price Level' Value 
                    for (var e = numLines; e > 0; e--) {

                        console.info("entering loop for price Level !");

                        sublistParent2 = scriptContext.currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'oqpbucket',
                            line: e - 1
                        });
                        console.info('sublistParent2 : ' + sublistParent2);

                        if (sublistParent == sublistParent2 && i - 1 !== currIndex) {
                            scriptContext.currentRecord.selectLine({
                                sublistId: 'item',
                                line: e - 1
                            });

                            if (totalPcs >= 1 && totalPcs <= 9) {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: 18
                                });
                            } else if (totalPcs >= 10 && totalPcs <= 19) {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: 19
                                });
                            } else if (totalPcs >= 20) {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: 20
                                });
                            }
                        }
                    }
                } else {
                    if (cnt != pcsValue) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bmpt_pcs',
                            value: cnt
                        });
                    }
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
                    console.info('id : ' + id);

                    var qty = invdetail.getCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity'
                    });
                    console.info('qty : ' + qty);

                    inventorydetail.push({ "issueinventorynumber": parseInt(id), "quantity": qty });
                    console.info("inventorydetail", inventorydetail);
                    console.info("inventorydetail", JSON.stringify(inventorydetail));
                    console.info("inventorydetail.length", inventorydetail.length);
                }
            }

            if (itemWarehouse != warehouse && createTrfOrd == false) {
                dialog.alert({ // Alert jika terjadi error
                    title: "Alert!",
                    message: "Anda Memilih Warehouse Yang Berbeda. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tercentang jika Ingin dilakukan Transfer Order!"
                });
                console.info("Alert : Alert displayed successfully");
                return false;
            } else if (itemWarehouse == warehouse && createTrfOrd == true) {
                dialog.alert({ // Alert jika terjadi error
                    title: "Alert!",
                    message: "Anda Memilih Warehouse Yang Sama. Pastikan Field " + "\"CREATE TRANSFER ORDER\"".bold() + " Tidak Tercentang!"
                });
                console.info("Alert : Alert displayed successfully");
                return false;
            } else if (itemWarehouse != warehouse && createTrfOrd == true && cnt == 0) {
                dialog.alert({ // Alert jika terjadi error
                    title: "Alert!",
                    message: "Pastikan " + "\"Inventory Detail\"".bold() + " Dipilih!"
                });
                console.info("Alert :Alert displayed successfully");
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