/**
 *@copyright 2020
 *@author Eko Susanto
 *
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'],
    function(record, search, transaction) {
        function afterSubmit(context) {
            if (context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.PACK && context.type !== context.UserEventType.SHIP)
                return;
            var itemShip = context.newRecord;

            log.debug("itemShip", itemShip);
            log.debug("itemShip.id", itemShip.id);

            var createFrom = itemShip.getValue('createdfrom');
            log.debug("CreateFrom", createFrom);

            var createFromText = itemShip.getText('createdfrom');
            log.debug("createFromText", createFromText);

            var shipStatus = itemShip.getText('shipstatus')
            log.debug("shipStatus", shipStatus);

            var shipCountSearch = search.create({
                type: search.Type.TRANSACTION,
                title: 'Shipping Try in Item Fulfillment',
                id: 'customsearch_shipping_try_if',
                columns: [
                    search.createColumn({
                        name: "newvalue",
                        join: "systemNotes"
                    })
                ],
                filters: [
                    ["internalid", "is", itemShip.id],
                    "AND", ["systemnotes.newvalue", "is", "Shipped"],
                    "AND", ["mainline", "is", "T"]
                ]
            }).run().getRange(0, 500);

            log.debug("shipCountSearch.length", shipCountSearch.length);

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

                                        var creditMemoTranId = creditMemo.getValue({
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
                                                var creApplyInvAmt = creditMemo.getSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'amount',
                                                    line: x
                                                });
                                                log.debug("creApplyInvAmt", creApplyInvAmt);

                                                creditMemo.setValue({
                                                    fieldId: 'custbody_gill_test_mass_update',
                                                    value: createFromText
                                                });

                                                creditMemo.setValue({
                                                    fieldId: 'custbody_amount_to_apply',
                                                    value: creApplyInvAmt
                                                });

                                                creditMemo.setSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'apply',
                                                    line: x,
                                                    value: false
                                                });
                                            }
                                        }
                                        var saveCreMemo = creditMemo.save()
                                        log.debug("saveCreMemo", saveCreMemo);
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
                                                var custPymtApplyInvAmt = custPayment.getSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'amount',
                                                    line: z
                                                });
                                                log.debug("custPymtApplyInvAmt", custPymtApplyInvAmt);

                                                custPayment.setValue({
                                                    fieldId: 'custbody_gill_test_mass_update',
                                                    value: createFromText
                                                });

                                                custPayment.setValue({
                                                    fieldId: 'custbody_amount_to_apply',
                                                    value: custPymtApplyInvAmt
                                                });

                                                custPayment.setSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'apply',
                                                    line: z,
                                                    value: false
                                                });
                                            }
                                        }
                                        var saveCustPymt = custPayment.save()
                                        log.debug("saveCustPymt", saveCustPymt);
                                    } //  End - if Payment - Uncheck Apply InvoiceSO
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
                // Populate Shipped Count to Sales Order
                var shippedCount = record.load({
                    type: record.Type.SALES_ORDER,
                    id: createFrom
                });

                shippedCount.setValue({
                    fieldId: 'custbody_shipping_count',
                    value: shipCountSearch.length + " Shipping Times"
                });

                var saveSO = shippedCount.save()
                log.debug("saveSO", saveSO);

                //Create New Invoice Using Transform function
                var newInvoice = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: createFrom,
                    toType: record.Type.INVOICE,
                });

                var newInvoiceId = newInvoice.save()
                log.debug("newInvoiceId", newInvoiceId);


                /*    var itemShipTranId = itemShip.getValue({
                       fieldId: 'tranid'
                   });
                   log.debug("itemShipTranId", itemShipTranId); */

                //create search to find old transaction 
                var searchRecord = search.create({
                    type: search.Type.TRANSACTION,
                    title: 'Related Saved Search',
                    id: 'customsearch_related_saved_search',
                    filters: [
                        ["custbody_gill_test_mass_update", "is", createFromText],
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
                    var tranType = searchRecord[y].recordType;
                    log.debug("tranType", tranType);

                    if (tranType == 'creditmemo') { // Start - If Credit Memo Apply to New Invoice
                        var creditMemoEdit = record.load({
                            type: record.Type.CREDIT_MEMO,
                            id: searchRecord[y].id
                        });
                        log.debug("creditMemoEdit", creditMemoEdit);

                        var creMemoAmtToApply = creditMemoEdit.getValue('custbody_amount_to_apply');
                        log.debug("creMemoAmtToApply", creMemoAmtToApply);

                        var sublistLength = creditMemoEdit.getLineCount({
                            sublistId: 'apply'
                        });
                        log.debug("sublistLength", sublistLength);

                        for (var k = 0; k < sublistLength; k++) {
                            var creApplyNewInv = creditMemoEdit.getSublistValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                line: k
                            });
                            log.debug("creApplyInv", creApplyNewInv);

                            if (creApplyNewInv == newInvoiceId) {
                                creditMemoEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    line: k,
                                    value: true
                                });

                                creditMemoEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'amount',
                                    line: k,
                                    value: creMemoAmtToApply
                                });
                            }
                        }
                        var saveCreMemoEdit = creditMemoEdit.save()
                        log.debug("saveCreMemoEdit", saveCreMemoEdit);
                    } // End - if Credit Memo - apply to New Invoice
                    else if (tranType == 'customerpayment') { // Start - If Credit Memo Apply to New Invoice
                        var custPymtEdit = record.load({
                            type: record.Type.CUSTOMER_PAYMENT,
                            id: searchRecord[y].id
                        });
                        log.debug("custPymtEdit", custPymtEdit);

                        var custPymtAmtToApply = custPymtEdit.getValue('custbody_amount_to_apply');
                        log.debug("custPymtAmtToApply", custPymtAmtToApply);

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

                            if (custPymtApplyNewInv == newInvoiceId) {
                                custPymtEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    line: k,
                                    value: true
                                });

                                custPymtEdit.setSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'amount',
                                    line: k,
                                    value: custPymtAmtToApply
                                });
                            }
                        }
                        var saveCustPymt = custPymtEdit.save()
                        log.debug("saveCustPymt", saveCustPymt);
                    } // End - if Credit Memo - apply to New Invoice
                }
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });
