/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, search, transaction) {
    function beforeSubmit(context) {
        if (context.type != context.UserEventType.CREATE)
            return;

        var currentRecord = context.newRecord;
        var warehouse = currentRecord.getValue({
            fieldId: 'location'
        });

        var lineCount = currentRecord.getLineCount({
            sublistId: 'item'
        });

        for (var u = 0; u < lineCount; u++) {
            var createTO = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_create_to',
                line: u
            });
            log.debug('createTO', createTO);

            var commit = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantitycommitted',
                line: u
            });

            if (createTO == true) {
                var hasSublist = currentRecord.hasSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: u
                });

                log.debug('hasSublist', hasSublist);

                if (hasSublist) {
                    currentRecord.removeSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: u
                    });
                    log.debug('remove subrecord', 'goo!!');

                    var hasSublist2 = currentRecord.hasSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: u
                    });
                    log.debug('hasSublist2', hasSublist2);

                    currentRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: u,
                        value: warehouse
                    });
                    log.debug('set warehouse', 'goo!!');
                }
            }
        }
    }
    // Start After Submit Script
    function afterSubmit(context) {
        if (context.type != context.UserEventType.CREATE)
            return;

        var currentRecord = context.newRecord;
        //get mainline value first
        var tranDate = currentRecord.getValue({
            fieldId: 'trandate'
        });
        log.debug('tranDate', tranDate);

        var warehouse = currentRecord.getValue({
            fieldId: 'location'
        });
        log.debug('warehouse', warehouse);

        var profitCenter = currentRecord.getValue({
            fieldId: 'department'
        });
        log.debug('profitCenter', profitCenter);

        var salesChannel = currentRecord.getValue({
            fieldId: 'class'
        });
        log.debug('salesChannel', salesChannel);



        //get Sublist Value
        var warehouseArray = [];
        var itemArray = [];
        var itemWarehouse;
        var itemName;
        var itemQty;
        var lineCount = currentRecord.getLineCount({
            sublistId: 'item'
        });
        for (var l = 0; l < lineCount; l++) {
            // get value from field 'Create Transfer Order' to define which line want to proceeds.
            var checkfTrfOrd = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_create_to',
                line: l
            });

            if (checkfTrfOrd == true) {
                //note,custom column on the transaction line to hold the target warehouse
                itemWarehouse = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_warehouse',
                    line: l
                });
                log.debug("length", itemWarehouse.length);

                if (itemWarehouse.length > 0) {
                    itemWarehouse = '_' + itemWarehouse; //helpful to ensure that our array is not using numbers
                    if (!(itemWarehouse in warehouseArray)) {
                        warehouseArray[itemWarehouse] = "1";
                    }
                    log.debug("itemWarehouse", itemWarehouse);
                }

                itemName = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: l
                });

                itemQty = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: l
                });

                var lotDetail = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lot_number_detail',
                    line: l
                });
                log.debug("lotDetail", lotDetail.toString());

                itemArray.push({
                    location: parseInt(itemWarehouse.substring(1)),
                    item: parseInt(itemName),
                    quantity: itemQty,
                    inventorydetail: JSON.parse(lotDetail)
                });
            }
        }
        log.debug('itemArray', itemArray);
        log.debug('itemArray.length', itemArray.length);
        var keys = Object.keys(warehouseArray);
        var olen = keys.length;
        log.debug('warehouse array list', keys);
        log.debug('warehouse array list length', olen);

        if (olen > 0) {
            for (var o = 0; o < olen; o++) {
                var key = keys[o];
                var warehouse_id = key.substring(1); //remove the '_';
                log.debug('DEBUG', o + '. warehouse warehouse_id:' + warehouse_id);

                // this is the special syntax to setup the to with a target warehouse and link it to the SO
                var tranOrd = record.create({
                    type: record.Type.TRANSFER_ORDER,
                    isDynamic: true
                });

                if (profitCenter == 1) {
                    tranOrd.setValue({
                        fieldId: 'customform',
                        value: 110,
                        ignoreFieldChange: true
                    });
                } else {
                    tranOrd.setValue({
                        fieldId: 'customform',
                        value: 111,
                        ignoreFieldChange: true
                    });
                }

                tranOrd.setValue({
                    fieldId: 'trandate',
                    value: tranDate,
                    ignoreFieldChange: false
                });

                tranOrd.setValue({
                    fieldId: 'transferlocation',
                    value: warehouse,
                    ignoreFieldChange: false
                });

                tranOrd.setValue({
                    fieldId: 'location',
                    value: warehouse_id,
                    ignoreFieldChange: false
                });

                tranOrd.setValue({
                    fieldId: 'department',
                    value: profitCenter,
                    ignoreFieldChange: false
                });

                tranOrd.setValue({
                    fieldId: 'class',
                    value: salesChannel,
                    ignoreFieldChange: false
                });
                tranOrd.setValue({
                    fieldId: 'custbody_sales_order',
                    value: currentRecord.id,
                    ignoreFieldChange: false
                });


                /*                 var itemList = JSON.parse(itemArray);
                                log.debug('list item stringify ', itemList);
                                log.debug('list item stringify length', itemList.length); */


                for (var x = 0; x < itemArray.length; x++) {
                    var sublistLine = itemArray[x];

                    if (warehouse_id == sublistLine.location) {
                        for (var itemKeys in sublistLine) {
                            if (sublistLine.hasOwnProperty(itemKeys)) {
                                tranOrd.selectNewLine({
                                    sublistId: 'item'
                                });

                                if (itemKeys == 'item') {
                                    log.debug("item", sublistLine[itemKeys]);
                                    tranOrd.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: itemKeys,
                                        value: sublistLine[itemKeys],
                                        ignoreFieldChange: false
                                    });
                                } else if (itemKeys == 'quantity') {
                                    log.debug("quantity", sublistLine[itemKeys]);
                                    tranOrd.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: itemKeys,
                                        value: sublistLine[itemKeys],
                                        ignoreFieldChange: false
                                    });
                                } else if (itemKeys == 'inventorydetail' && sublistLine.hasOwnProperty(itemKeys)) {
                                    var dataLot = sublistLine[itemKeys];
                                    log.debug('inventory detail', 'count: ' + dataLot.length);
                                    if (dataLot.length > 0) {

                                        var tranOrdInvDet = tranOrd.getCurrentSublistSubrecord({
                                            sublistId: 'item',
                                            fieldId: itemKeys
                                        });

                                        for (var j = 0; j < dataLot.length; j++) {
                                            dataLotKeys = dataLot[j];
                                            for (var lotKeys in dataLotKeys) {
                                                if (dataLotKeys.hasOwnProperty(lotKeys)) {
                                                    tranOrdInvDet.selectNewLine({
                                                        sublistId: 'inventoryassignment'
                                                    });

                                                    tranOrdInvDet.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: lotKeys,
                                                        value: dataLotKeys[lotKeys],
                                                        ignoreFieldChange: false
                                                    });
                                                }
                                            }
                                            tranOrdInvDet.commitLine({
                                                sublistId: 'inventoryassignment'
                                            });
                                        }
                                    }
                                }
                            } else {
                                continue;
                            }
                        }
                        log.debug('commit item', 'commit item line: ' + [x]);
                        tranOrd.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                var TOid = tranOrd.save();
                log.debug('newTO', TOid);

                var loadTO = record.load({
                    type: record.Type.TRANSFER_ORDER,
                    id: TOid
                });

                var warehouseNewTranOrd = loadTO.getValue({
                    fieldId: 'location'
                });

                var loadSO = record.load({
                    type: record.Type.SALES_ORDER,
                    id: currentRecord.id
                });

                var loadSOLineCount = loadSO.getLineCount({
                    sublistId: 'item'
                });

                for (z = 0; z < loadSOLineCount; z++) {
                    var loadSOWarehouseLine = loadSO.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_warehouse',
                        line: z
                    });

                    if (loadSOWarehouseLine == warehouseNewTranOrd) {
                        loadSO.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_transfer_order_id',
                            line: z,
                            value: TOid
                        });
                    }
                }
                var updateSO = loadSO.save();
                log.debug('updateSO', updateSO);
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});