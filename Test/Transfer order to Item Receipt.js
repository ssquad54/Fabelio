/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/format', 'N/error'], function(record, search, format, error) {
    /**
     * @param {record} record
     * @param {search} search
     * @param {format} format
     * @param {error} error
     */
    function doValidation(args, argNames, methodName) {
        log.debug("Validation", "args=" + JSON.stringify(args) + ' | argNames=' + JSON.stringify(argNames) + ' | methodName=' + methodName);
        for (var i = 0; i < args.length; i++)
            if (!args[i] && args[i] !== 0)
                throw error.create({
                    name: 'MISSING_REQ_ARG',
                    message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
                });
    }

    function getData(context) {
        doValidation([context.recordtype], ['recordtype'], 'GET');

        var recStr = [];

        if (context.recordtype == 'transferorder') {
            try {
                var maxData = Number(context.recmax);
                if (!context.recmax || maxData < 1 || maxData > 1000) {
                    maxData = 100;
                }

                var arrColumns = ['tranid', 'trandate', 'location'];
                if ((context.sort && (context.sort != '' || null != context.sort)) &&
                    (context.sort.toUpperCase() == 'DESC')) {
                    arrColumns.push(search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }));
                } else {
                    arrColumns.push(search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.ASC
                    }));
                }
                arrColumns.push('tranid');
                log.debug({
                    "title": "arrColumns",
                    "details": arrColumns
                });

                var arrFilters = [
                    ['mainline', 'is', 'F'],
                    'AND', ['status', 'anyof', 'TrnfrOrd:F'],
                    'AND', ['item.islotitem', 'is', 'T'],
                    'AND', ['tranid', 'is', '75']
                ];
                log.debug({
                    "title": "arrFilters",
                    "details": arrFilters
                });

                var myTransferList = search.create({
                    type: search.Type.TRANSFER_ORDER,
                    title: 'Transfer Order Pending Receipt SavedSearch',
                    id: 'Customsearch_transfer_order_pend_receipt',
                    columns: arrColumns,
                    filters: arrFilters,
                }).run().getRange(0, maxData);

                log.debug({
                    "title": "myTransferList",
                    "details": myTransferList
                });

                log.debug({
                    "title": "myTransferList.length",
                    "details": myTransferList.length
                });

                if (myTransferList.length > 0) {
                    for (var i = 0; i < myTransferList.length; i++) {
                        var recLoad = record.load({
                            type: context.recordtype,
                            id: myTransferList[i].getValue('internalid')
                        });

                        //	for (var j = 0; j < lotNumberCount; j++) {
                        var itemInfo = recLoad.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });

                        var lotNumberCount = itemInfo.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        for (var j = 0; j < lotNumberCount; j++) {
                            var lotNumber = itemInfo.getSublistText({
                                sublistId: 'inventoryassignment',
                                fieldId: 'issueinventorynumber',
                                line: j
                            });

                            recStr.push({
                                use_form: recLoad.getText('customform'),
                                tran_id: recLoad.getValue('tranid'),
                                tran_stat: recLoad.getText('orderstatus'),
                                tran_date: recLoad.getValue('trandate'),
                                tran_from: recLoad.getText('location'),
                                tran_to: recLoad.getText('transferlocation'),
                                tran_emp: recLoad.getValue('employee'),
                                tran_memo: recLoad.getValue('memo'),
                                // tran_item: recLoad.getSublistText('item', 'item', i),
                                // item_qty: recLoad.getSublistValue('item', 'quantity', i),
                                item_name: itemInfo.getText('item'),
                                item_qty: itemInfo.getValue('quantity'),
                                lot_numb: lotNumber
                            });
                        }
                    }
                    return recStr;
                } else {
                    return 'no record';
                }
            } catch (e) {
                log.error({
                    "title": "Error",
                    "details": e.toString()
                });
                try {
                    return 'Please try again... ' + e.toString();
                } catch (e) {
                    log.error({
                        "title": "Error",
                        "details": e.toString()
                    });
                }
            }
        } else {
            return 'not in scope: recordtype';
        }
    }

    function postData(receiptItem) {
        log.debug("PostData");

        doValidation([receiptItem.recordtype], ['recordtype'], 'POST');

        log.debug("After do Validation");

        var recordId = [];
        var recStr = [];

        if (receiptItem.recordtype == 'transferorder') {
            var objRecord = record.transform({
                fromType: record.Type.TRANSFER_ORDER,
                fromId: 174674,
                toType: record.Type.ITEM_RECEIPT,
                isDynamic: false
            });

            log.debug("objRecord", objRecord);

            var lineCount = objRecord.getLineCount({
                sublistId: 'item'
            });

            log.debug("lineCount", lineCount);

            //            objRecord.selectLine({
            //                sublistId: 'item',
            //                line: 0
            //            });

            objRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                line: 0,
                value: true
            });

            objRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: 0,
                value: 100
            });

            var hasSubRec = objRecord.hasSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: 0
            });

            log.debug("hasSubRec", hasSubRec);

            var subRec = objRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: 0
            });

            log.debug("subRec", subRec);

            //            subRec.selectNewLine({
            //                sublistId: 'inventoryassignment'
            //            });

            //            subRec.setSublistValue({
            //                sublistId: 'inventoryassignment',
            //                fieldId: 'receiptinventorynumber',
            //                line: 0,
            //                value: 1953
            //            });

            subRec.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity',
                line: 0,
                value: 25
            });

            subRec.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity',
                line: 1,
                value: 75
            });

            //            subRec.commitLine({
            //                sublistId: 'inventoryassignment'
            //            });

            //            objRecord.commitLine({
            //                sublistId: 'item'
            //            });

            var itemReceiptId = objRecord.save({
                enableSourcing: false,
                ignoreMandatoryField: false
            });

            log.debug("itemReceiptId", itemReceiptId);

            recordId.push(itemReceiptId)
            log.debug("[success] recordId: ", JSON.stringify(recordId));

            var recLoad = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: itemReceiptId
            });

            log.debug("recLoad", recLoad);

            var itemLine = recLoad.getLineCount({
                sublistId: 'item'
            });

            log.debug("itemLine", itemLine);

            if (itemLine > 0) {
                for (var x = 0; x < itemLine; x++) {
                    var itemList = recLoad.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: x
                    });

                    log.debug("itemList", itemList);

                    var lotCount = itemList.getLineCount({
                        sublistId: 'inventoryassignment'
                    });

                    log.debug("lotCount", lotCount);

                    for (var y = 0; y < lotCount; y++) {
                        var lotNumber = itemList.getSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            line: y
                        });

                        log.debug("lotNumber", lotNumber);

                        var lotQty = itemList.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: y
                        });

                        log.debug("lotQty", lotQty);

                        recStr.push({
                            use_form: recLoad.getText('customform'),
                            tran_id: recLoad.getValue('tranid'),
                            tran_date: recLoad.getValue('trandate'),
                            tran_from: recLoad.getText('transferlocation'),
                            tran_to: recLoad.getText('location'),
                            tran_ord_id: recLoad.getText('createdfrom'),
                            tran_memo: recLoad.getText('memo'),
                            item_name: itemList.getText('item'),
                            item_qty: itemList.getValue('quantity'),
                            lot_numb: lotNumber,
                            lot_qty: lotQty
                        });

                        log.debug("recStr", JSON.stringify(recStr));
                    }
                }
            }
        }
        return recStr;
    }
    return {
        'get': getData,
        post: postData
    };
});