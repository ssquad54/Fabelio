/**
 *
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 *
 * Author: Eko Susanto
 */
define(['N/record'], function(record) {
    var scriptName = "create_inventory_adjustment ";

    function createInvAdj(scriptContext) {
        var funcName = scriptName + "onAction " + scriptContext.newRecord.type + " " + scriptContext.newRecord.id;
        log.debug(funcName, "Starting");

        var currentRecord = scriptContext.newRecord;
        log.debug('currentRecord', currentRecord);

        var internalId = currentRecord.id;
        log.debug('internalId', internalId);

        var date = currentRecord.getValue({
            fieldId: 'trandate'
        });
        log.debug('date', date);

        var toWarehouse = currentRecord.getValue({
            fieldId: 'transferlocation'
        });
        log.debug('toWarehouse', toWarehouse);

        var profitCenter = currentRecord.getValue({
            fieldId: 'department'
        });
        log.debug('profitCenter', profitCenter);

        var lineCount = currentRecord.getLineCount({
            sublistId: 'inventory'
        });
        log.debug('lineCount', lineCount);

        var itemArray = [];
        var inventorydetail = [];
        var itemWarehouse;
        var itemName;
        var itemQty;

        if (lineCount > 0) {
            for (var i = 0; i < lineCount; i++) {
                currentRecord.selectLine({
                    sublistId: 'inventory',
                    line: i
                });

                var item = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item'
                });
                log.debug('item', item);

                var quantity = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby'
                });
                log.debug('quantity', quantity);

                var invDetail = currentRecord.getCurrentSublistSubrecord({
                    sublistId: 'inventory',
                    fieldId: 'inventorydetail'
                });
                log.debug('invDetail', invDetail);

                for (var u = 0; u < invDetail.getLineCount('inventoryassignment'); u++) {
                    invDetail.selectLine({
                        sublistId: 'inventoryassignment',
                        line: u
                    });

                    var lotNumber = invDetail.getCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber'
                    });
                    log.debug("lotNumber", lotNumber);

                    var lotQty = invDetail.getCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity'
                    });
                    log.debug("lotQty", lotQty);

                    inventorydetail.push({
                        issueinventorynumber: lotNumber,
                        quantity: lotQty
                    });
                    log.debug("inventorydetail", inventorydetail);
                    log.debug("inventorydetail stringify", JSON.stringify(inventorydetail));
                    log.debug("inventorydetail.length", inventorydetail.length);
                }
                itemArray.push({
                    item: item,
                    adjustqtyby: quantity,
                    location: toWarehouse,
                    inventorydetail: inventorydetail
                });
            }
            log.debug('itemArray', itemArray);
            log.debug('itemArray stringify', JSON.stringify(itemArray));
            log.debug('itemArray.length', itemArray.length);
        }

        var objRecord = record.create({
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        });

        objRecord.setValue({
            fieldId: 'trandate',
            value: date
        });

        objRecord.setValue({
            fieldId: 'account',
            value: 492
        });

        objRecord.setValue({
            fieldId: 'custbody_bmpt_alasan_adjusment_invento',
            value: 3
        });

        objRecord.setValue({
            fieldId: 'custbody_bmpt_inventory_transfer',
            value: internalId
        });

        objRecord.setValue({
            fieldId: 'department',
            value: profitCenter
        });

        objRecord.setValue({
            fieldId: 'adjlocation',
            value: toWarehouse
        });

        for (var z = 0; z < itemArray.length; z++) {
            var sublistLine = itemArray[z];
            log.debug('sublistLine', sublistLine);

            for (var itemKeys in sublistLine) {
                if (sublistLine.hasOwnProperty(itemKeys)) {
                    objRecord.selectNewLine({
                        sublistId: 'inventory'
                    });

                    if (itemKeys == 'item') {
                        log.debug('item', sublistLine[itemKeys]);
                        objRecord.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: itemKeys,
                            value: sublistLine[itemKeys],
                            ignoreFieldChange: true
                        });
                    } else if (itemKeys == 'adjustqtyby') {
                        log.debug('adjustqtyby', sublistLine[itemKeys] * -1);
                        objRecord.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: itemKeys,
                            value: sublistLine[itemKeys] * -1,
                            ignoreFieldChange: true
                        });
                    } else if (itemKeys == 'location') {
                        log.debug('location', sublistLine[itemKeys]);
                        objRecord.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: itemKeys,
                            value: sublistLine[itemKeys],
                            ignoreFieldChange: true
                        });
                    } else if (itemKeys == 'inventorydetail' && sublistLine.hasOwnProperty(itemKeys)) {
                        var dataLot = sublistLine[itemKeys];
                        log.debug('inventory detail', 'count: ' + dataLot.length);
                        if (dataLot.length > 0) {
                            var objRecordInvDet = objRecord.getCurrentSublistSubrecord({
                                sublistId: 'inventory',
                                fieldId: itemKeys
                            });
                            for (var j = 0; j < dataLot.length; j++) {
                                dataLotKeys = dataLot[j];
                                log.debug('dataLotKey', dataLotKeys);
                                for (var lotKeys in dataLotKeys) {
                                    if (dataLotKeys.hasOwnProperty(lotKeys)) {
                                        objRecordInvDet.selectNewLine({
                                            sublistId: 'inventoryassignment'
                                        });

                                        if (lotKeys == 'issueinventorynumber') {
                                            log.debug('issueinventorynumber', dataLotKeys[lotKeys]);
                                            objRecordInvDet.setCurrentSublistValue({
                                                sublistId: 'inventoryassignment',
                                                fieldId: lotKeys,
                                                value: dataLotKeys[lotKeys],
                                                ignoreFieldChange: false
                                            });
                                        } else if (lotKeys == 'quantity') {
                                            log.debug('quantity', dataLotKeys[lotKeys] * -1);
                                            objRecordInvDet.setCurrentSublistValue({
                                                sublistId: 'inventoryassignment',
                                                fieldId: lotKeys,
                                                value: dataLotKeys[lotKeys] * -1,
                                                ignoreFieldChange: false
                                            });
                                        }
                                    }
                                }
                                objRecordInvDet.commitLine({
                                    sublistId: 'inventoryassignment'
                                });
                            }
                        }
                    }
                } else {
                    continue;
                }
            }
            log.debug('commit item', 'commit item line: ' + [z]);
            objRecord.commitLine({
                sublistId: 'inventory'
            });
        }

        var recordId = objRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

        return recordId;
    }

    return {
        onAction: createInvAdj
    };

});