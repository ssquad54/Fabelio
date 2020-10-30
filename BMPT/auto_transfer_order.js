/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, search, transaction) {
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE)
            return;

        var soId = '';
        soId = context.newRecord;
        log.debug({
            title: "SO Internal ID",
            details: soId.id
        });
        var createToCheck = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ["type", "anyof", "SalesOrd"],
                "AND", ["custcol_create_to", "is", "T"],
                "AND", ["internalid", "anyof", "50"]
            ],
            columns: [
                search.createColumn({
                    name: "item",
                    sort: search.Sort.ASC
                })
            ]
        }).run().getRange(0, 50);

        log.debug({
            title: 'createTO.length',
            details: createToCheck.length
        });

        if (createToCheck.length > 0) {
            try {
                var date = soId.getValue({
                    fieldId: 'trandate'
                });

                var warehouse = soId.getValue({
                    fieldId: 'location'
                });

                var salesChannel = soId.getValue({
                    fieldId: 'class'
                });

                var profitCenter = soId.getValue({
                    fieldId: 'department'
                });

                var itemName = '';
                var qty = '';
                var itemWarehouse = '';
                var lotQty = '';

                var transferOrder = record.create({
                    type: record.Type.TRANSFER_ORDER,
                    isDynamic: true
                });

                transferOrder.setValue({
                    fieldId: 'date',
                    value: date
                });

                transferOrder.setValue({ // to Warehouse (sales order warehouse)
                    fieldId: 'transferlocation',
                    value: warehouse
                });

                transferOrder.setValue({
                    fieldId: 'class',
                    value: salesChannel
                });

                transferOrder.setValue({
                    fieldId: 'department',
                    value: profitCenter
                });

                transferOrder.setValue({
                    fieldId: 'date',
                    value: date
                });

                var lineCount = soId.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < lineCount; i++) {
                    var createToCheckField = soId.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_create_to',
                        line: i
                    });

                    log.debug({
                        title: 'createToCheckField',
                        details: createToCheckField
                    });

                    if (createToCheckField == true) {
                        transferOrder.selectNewLine({
                            sublistId: 'item'
                        });

                        itemName = soId.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        transferOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: itemName
                        });

                        qty = soId.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        transferOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: qty
                        });

                        itemWarehouse = soId.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: i
                        });

                        log.debug({
                            title: 'item warehouse',
                            details: itemWarehouse
                        });

                        transferOrder.setValue({ // from location
                            fieldId: 'location',
                            value: itemWarehouse
                        });

                        var inventoryDetail = soId.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });

                        var toInventoryDetail = transferOrder.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });

                        log.debug({
                            title: 'toInventoryDetail',
                            details: toInventoryDetail
                        });

                        var lotCount = inventoryDetail.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        for (var j = 0; j < lotCount; j++) {
                            toInventoryDetail.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });

                            var lotNumber = inventoryDetail.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'issueinventorynumber',
                                line: j
                            });
                            log.debug({
                                title: 'lotNumber',
                                details: lotNumber
                            });

                            lotQty = inventoryDetail.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                line: j
                            });

                            var updateSO = record.load({
                                type: record.Type.SALES_ORDER,
                                id: soId.id
                            });

                            updateSO.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i,
                                value: warehouse
                            });

                            soIdUpdate = updateSO.save();

                            toInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'issueinventorynumber',
                                value: lotNumber
                            });

                            toInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: lotQty
                            });

                            toInventoryDetail.commitLine({
                                sublistId: 'inventoryassignment'
                            });
                        }
                        transferOrder.commitLine({
                            sublistId: 'item'
                        });
                    }
                }

                toId = transferOrder.save();

            } catch (e) {
                log.error({
                    "title": "Error",
                    "details": e.toString()
                });
            }
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});