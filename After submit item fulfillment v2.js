/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'],
    function(record, search, transaction) {
        function afterSubmit(context) {
            if (context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.PACK && context.type !== context.UserEventType.SHIP)
                return;
            var itemShip = context.newRecord;

            var createFrom = itemShip.getValue('createdfrom');
            log.debug("CreateFrom", createFrom);

            var shipStatus = itemShip.getText('shipstatus')
            log.debug("shipStatus", shipStatus);

            if (shipStatus == 'Packed') { // Start - If Status: Packed

                var fromRecord = search.lookupFields({ // Get Record Type from Createfrom field
                    type: search.Type.TRANSACTION,
                    id: createFrom,
                    columns: 'recordtype'
                });
                log.debug("fromType", fromRecord);

                if (fromRecord.recordtype == 'salesorder') { // Start - If Create From Sales Order
                    var loadRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: createFrom
                    });
                    log.debug("loadRecord", loadRecord);

                    var salesOrderTranId = getValue({
                        fieldId: 'tranid',
                    });
                    log.debug("salesOrderTranId", salesOrderTranId);

                    var linkCount = loadRecord.getLineCount({
                        sublistId: 'links'
                    });
                    log.debug("linkCount", linkCount);

                    for (var i = 0; i < linkCount; i++) {
                        var linkType = loadRecord.getSublistValue({
                            sublistId: 'links',
                            fieldId: 'type',
                            line: i
                        });
                        log.debug("linkType", linkType);

                        var linkId = loadRecord.getSublistValue({
                            sublistId: 'links',
                            fieldId: 'id',
                            line: i
                        });
                        log.debug("linkId", linkId);

                        if (linkType == 'Invoice') { // Start - If Related Record is Invoice
                            var invoiceSO = record.load({
                                type: record.Type.INVOICE,
                                id: linkId
                            });
                            log.debug("InvoiceSO", invoiceSO);

                            var invoiceStatus = invoiceSO.getValue({
                                fieldId: 'status'
                            });
                            log.debug("invoiceStatus", invoiceStatus);

                            // Get Related Record Count
                            var invLinkCount = invoiceSO.getLineCount({
                                sublistId: 'links'
                            });
                            log.debug("invLinkCount", invLinkCount);

                            for (var j = 0; j < linkCount; j++) {
                                var invLinkType = '';
                                var invLinkId = '';
                                try {
                                    invLinkType = invoiceSO.getSublistValue({
                                        sublistId: 'links',
                                        fieldId: 'type',
                                        line: j
                                    });
                                    log.debug("invLinkType", invLinkType);

                                    invLinkId = invoiceSO.getSublistValue({
                                        sublistId: 'links',
                                        fieldId: 'id',
                                        line: j
                                    });
                                    log.debug("invLinkId", invLinkId);

                                    if (invLinkType == 'Deposit Application') { // Start -  if Deposit Application - unapply InvoiceSO
                                        var deleteDepApp = record.delete({
                                            type: record.Type.DEPOSIT_APPLICATION,
                                            id: invLinkId
                                        });
                                        log.debug("deleteDepApp", deleteDepApp);
                                    } else if (invLinkType == 'Credit Memo') { // Start - if Credit Memo - Uncheck apply invoiceSO
                                        var creditMemo = record.load({
                                            type: record.Type.CREDIT_MEMO,
                                            id: invLinkId
                                        });
                                        log.debug("creditMemo", creditMemo);

                                        var creditMemoTranId = getValue({
                                            fieldId: 'tranid',
                                        });
                                        log.debug("creditMemoTranId", creditMemoTranId);

                                        var sublistLength = creditMemo.getLineCount({
                                            sublistId: 'apply'
                                        });
                                        log.debug("sublistLength", sublistLength);

                                        for (var x = 0; x < sublistLength; x++) {
                                            var creApplyInv = creditMemo.getSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'internalid',
                                                line: x
                                            });
                                            log.debug("creApplyInv", creApplyInv);

                                            if (creApplyInv == linkId) {
                                                creditMemo.setSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'apply',
                                                    line: x,
                                                    value: false
                                                });

                                                creditMemo.setValue({
                                                    fieldId: 'custbody_gill_test_mass_update',
                                                    value: salesOrderTranId
                                                });

                                                var saveCreMemo = creditMemo.save()
                                                log.debug("saveCreMemo", saveCreMemo);
                                            }
                                        }
                                    } // End - if Credit Memo - Uncheck apply invoiceSO
                                    else if (invLinkType == 'Payment') { //  Start - if Payment - Uncheck Apply InvoiceSO
                                        var custPayment = record.load({
                                            type: record.Type.CUSTOMER_PAYMENT,
                                            id: invLinkId
                                        });
                                        log.debug("custPayment", custPayment);

                                        var CustPymtSublistLength = custPayment.getLineCount({
                                            sublistId: 'apply'
                                        });
                                        log.debug("CustPymtSublistLength", CustPymtSublistLength);

                                        for (var z = 0; z < CustPymtSublistLength; z++) {
                                            var custPymtApplyInv = custPayment.getSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'internalid',
                                                line: z
                                            });
                                            log.debug("custPymtApplyInv", custPymtApplyInv);

                                            if (custPymtApplyInv == linkId) {
                                                custPayment.setSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'apply',
                                                    line: z,
                                                    value: false
                                                });

                                                custPayment.setValue({
                                                    fieldId: 'custbody_gill_test_mass_update',
                                                    value: salesOrderTranId
                                                });
                                            }
                                            var saveCustPymt = custPayment.save()
                                            log.debug("saveCustPymt", saveCustPymt);
                                        }
                                    } ///  End - if Payment - Uncheck Apply InvoiceSO
                                } catch (e) {
                                    log.error({
                                        title: e.name,
                                        details: e
                                    });
                                }
                            }
                            var voidInvoice = transaction.void({
                                type: transaction.Type.INVOICE,
                                id: linkId
                            });
                            log.debug("voidInvoice", voidInvoice);
                        } // End - If Related Record is Invoice
                    }
                } // End - If Create From Sales Order
            } // End - If Status: Packed
            else if (shipStatus == 'Shipped') {
                var newInvoice = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderTranId,
                    toType: record.Type.INVOICE,
                });
                log.debug("newInvoice", newInvoice);

                var itemShipTranId = itemShip.getValue({
                    fieldId: 'tranid'
                });
                log.debug("itemShipTranId", itemShipTranId);

                var searchRecord = search.create({
                    type: search.Type.TRANSACTION,
                    title: 'Related Saved Search',
                    id: 'customsearch_related_saved_search',
                    filters: [
                        ["custbody_gill_test_mass_update", "is", salesOrderTranId],
                        "AND", ["mainline", "is", "T"]
                    ],
                    columns: [search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC
                    })]
                }).run().getRange(0, 10);

                log.debug({
                    "title": "searchRecord",
                    "details": searchRecord
                });

                log.debug({
                    "title": "searchRecord.length",
                    "details": searchRecord.length
                });

                for (var y = 0; y < searchRecord.length; y++) {
                    tranType = searchRecord[y].recordType;

                    if (tranType == creditmemo) { // Start - If Credit Memo Apply to New Invoice
                        creditMemoEdit = record.load({
                            type: record.Type.CREDIT_MEMO,
                            id: searchRecord[y]
                        });
                        log.debug("creditMemoEdit", creditMemoEdit);

                        var sublistLength = creditMemo.getLineCount({
                            sublistId: 'apply'
                        });
                        log.debug("sublistLength", sublistLength);

                        for (var k = 0; k < sublistLength; k++) {
                            var creApplyNewInv = saveCreMemoEdit.getSublistValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                line: k
                            });
                            log.debug("creApplyInv", creApplyNewInv);

                            if (creApplyNewInv == newInvoice) {
                                creditMemoEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    line: x,
                                    value: true
                                });
                                var saveCreMemoEdit = creditMemoEdit.save()
                                log.debug("saveCreMemoEdit", saveCreMemoEdit);
                            }
                        }
                    } // End - if Credit Memo - apply to new Invoice
                    else if (tranType == customerpayment) { // Start - If Credit Memo Apply to New Invoice
                        custPymtEdit = record.load({
                            type: record.Type.CUSTOMER_PAYMENT,
                            id: searchRecord[y]
                        });
                        log.debug("custPymtEdit", custPymtEdit);

                        var sublistLength = custPymtEdit.getLineCount({
                            sublistId: 'apply'
                        });
                        log.debug("sublistLength", sublistLength);

                        for (var k = 0; k < sublistLength; k++) {
                            var custPymtApplyNewInv = custPymtEdit.getSublistValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                line: k
                            });
                            log.debug("custPymtApplyNewInv", custPymtApplyNewInv);

                            if (custPymtApplyNewInv == newInvoice) {
                                custPymtEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    line: x,
                                    value: true
                                });
                                var saveCustPymt = custPymtEdit.save()
                                log.debug("saveCustPymt", saveCustPymt);
                            }
                        }
                    } // End - if Credit Memo - apply to new Invoice
                }
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });