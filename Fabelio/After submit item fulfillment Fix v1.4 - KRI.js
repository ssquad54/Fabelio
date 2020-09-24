/**
 *@copyright 2020
 *@author Eko Susanto
 *
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'],
    function(record, search, transaction) {
        function beforeSubmit(context) {
            if (context.type == context.UserEventType.CREATE) {
                var newRecord = context.newRecord;
                var newStatus = newRecord.getText('shipstatus');
                log.debug("Shipping Status", newStatus);

                var fromRecord = search.lookupFields({ // Get Record Type from Createfrom field
                    type: search.Type.TRANSACTION,
                    id: newRecord.getValue('createdfrom'),
                    columns: 'recordtype'
                });
                log.debug("createdfrom Type", fromRecord);

                if (fromRecord.recordtype !== 'salesorder')
                    return;
                else {
                    if (newStatus == 'Shipped') {
                        newRecord.setValue({
                            fieldId: 'custbody_kri_shipping',
                            value: (1).toString()
                        });

                        var so = record.load({
                            type: record.Type.SALES_ORDER,
                            id: newRecord.getValue('createdfrom')
                        });

                        // Search Shipping Count from all Item Fulfillment related with Sales order
                        var soShippingSearch = search.create({
                            type: search.Type.ITEM_FULFILLMENT,
                            title: 'Shipping Count for SO',
                            id: 'customsearch_shipping_count_so',
                            columns: [
                                search.createColumn({
                                    name: "custbody_kri_shipping"
                                })
                            ],
                            filters: [
                                ["createdfrom", "is", newRecord.getValue('createdfrom')],
                                "AND", ["mainline", "is", "T"]
                            ]
                        }).run().getRange(0, 500);

                        log.debug("soShippingSearch", soShippingSearch);

                        var soShippingCount = 1;
                        for (var i = 0; i < soShippingSearch.length; i++) {

                            soShippingCount += Number(soShippingSearch[i].getValue('custbody_kri_shipping'));
                            log.debug("soShippingCount", soShippingCount);
                        }
                        // Populate Shipping Count to Sales Order
                        var so = record.load({
                            type: record.Type.SALES_ORDER,
                            id: newRecord.getValue('createdfrom')
                        });

                        so.setValue({
                            fieldId: 'custbody_kri_shipping',
                            value: (soShippingCount).toString()
                        });

                        var saveSO = so.save();
                        log.debug("internalid SO", saveSO);
                    }
                }
            } else if (context.type == context.UserEventType.EDIT) {
                var oldRecord = context.oldRecord;
                var newRecord = context.newRecord;

                var newStatus = newRecord.getText('shipstatus');
                log.debug("newStatus", newStatus);

                var oldStatus = oldRecord.getText('shipstatus');
                log.debug("oldStatus", oldStatus);

                var fromRecord = search.lookupFields({ // Get Record Type from Createfrom field
                    type: search.Type.TRANSACTION,
                    id: newRecord.getValue('createdfrom'),
                    columns: 'recordtype'
                });
                log.debug("createdfrom Type", fromRecord);

                if (fromRecord.recordtype == 'salesorder') {

                    if (oldStatus == 'Shipped')
                        return;
                    else if (newStatus == 'Shipped') {
                        var shippingCount = newRecord.getValue({
                            fieldId: 'custbody_kri_shipping'
                        });
                        log.debug("shipping Count", shippingCount);

                        newRecord.setValue({
                            fieldId: 'custbody_kri_shipping',
                            value: (Number(shippingCount) + 1).toString()
                        });

                        // Search Shipping Count from all Item Fulfillment related with Sales order
                        var soShippingSearch = search.create({
                            type: search.Type.ITEM_FULFILLMENT,
                            title: 'Shipping Count for SO',
                            id: 'customsearch_shipping_count_so',
                            columns: [
                                search.createColumn({
                                    name: "custbody_kri_shipping"
                                })
                            ],
                            filters: [
                                ["createdfrom", "is", newRecord.getValue('createdfrom')],
                                "AND", ["mainline", "is", "T"]
                            ]
                        }).run().getRange(0, 500);

                        log.debug("soShippingSearch", soShippingSearch);

                        var soShippingCount = 1;
                        for (var i = 0; i < soShippingSearch.length; i++) {

                            var IFshippingCount = soShippingSearch[i].getValue('custbody_kri_shipping');
                            log.debug("IFshippingCount", IFshippingCount);

                            soShippingCount += Number(soShippingSearch[i].getValue('custbody_kri_shipping'));
                            log.debug("soShippingCount", soShippingCount);
                        }
                        // Populate Shipping Count to Sales Order
                        var so = record.load({
                            type: record.Type.SALES_ORDER,
                            id: newRecord.getValue('createdfrom')
                        });

                        so.setValue({
                            fieldId: 'custbody_kri_shipping',
                            value: (soShippingCount).toString()
                        });

                        var saveSO = so.save();
                        log.debug("internalid SO", saveSO);
                    }
                }
            }
        }
        // After Submit 
        function afterSubmit(context) {
            if (context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.SHIP)
                return;
            var oldRecord = context.oldRecord;
            var newRecord = context.newRecord;

            var oldShipStatus = oldRecord.getText('shipstatus');
            log.debug("oldShipStatus", oldShipStatus);

            var newShipStatus = newRecord.getText('shipstatus');
            log.debug("newShipStatus", newShipStatus);


            var createdFrom = newRecord.getValue('createdfrom');
            log.debug("CreateFrom", createdFrom);

            // Start dari sini - review variable diatas juga.

            if (oldShipStatus == 'Shipped' && (newShipStatus == 'Packed' || newShipStatus == 'Picked')) { // Start - If old status = Shipped and New Status: Packed or picked

                var fromRecord = search.lookupFields({ // Get Record Type from Createfrom field
                    type: search.Type.TRANSACTION,
                    id: createdFrom,
                    columns: 'recordtype'
                });
                log.debug("fromType", fromRecord);

                if (fromRecord.recordtype == 'salesorder') { // Start - If Create From Sales Order
                    var searchRecord = search.create({
                        type: search.Type.INVOICE,
                        title: 'Related Invoice',
                        id: 'customsearch_related_invoice',
                        filters: [search.createFilter({
                                name: 'status',
                                operator: search.Operator.NONEOF,
                                values: 'CustInvc:V'
                            }),
                            search.createFilter({
                                name: 'custbody_if_no',
                                operator: search.Operator.IS,
                                values: newRecord.id
                            }),
                            search.createFilter({
                                name: 'mainline',
                                operator: search.Operator.IS,
                                values: true
                            }),
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

                    for (var i = 0; i < searchRecord.length; i++) {
                        var invoiceSO = record.load({
                            type: record.Type.INVOICE,
                            id: searchRecord[i].id
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

                        for (var j = 0; j < invLinkCount; j++) {
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

                                var invLinkTranId = invoiceSO.getSublistValue({
                                    sublistId: 'links',
                                    fieldId: 'tranid',
                                    line: j
                                });
                                log.debug("invLinkTranId", invLinkTranId);

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

                                        if (creApplyInv == invoiceSO.id) {
                                            var creApplyInvAmt = creditMemo.getSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'amount',
                                                line: x
                                            });
                                            log.debug("creApplyInvAmt", creApplyInvAmt);

                                            creditMemo.setSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'apply',
                                                line: x,
                                                value: false
                                            });
                                        }
                                    }
                                    var saveCreMemo = creditMemo.save();
                                    log.debug("saveCreMemo", saveCreMemo);

                                    var searchCreditUsage = search.create({
                                        type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                        title: 'Related Saved Search',
                                        id: 'customsearch_related_saved_search',
                                        filters: [
                                            ["custrecord_scu_credit_memo_id", "is", creditMemoTranId],
                                            "AND", ["custrecord_scu_sales_order_id", "is", createdFrom]
                                        ],
                                        columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        })]
                                    }).run().getRange(0, 10);

                                    log.debug({
                                        "title": "searchCreditUsage",
                                        "details": searchCreditUsage
                                    });

                                    log.debug({
                                        "title": "searchCreditUsage.length",
                                        "details": searchCreditUsage.length
                                    });

                                    for (var u = 0, max = searchCreditUsage.length; u < max; u++) {
                                        log.debug("yes", "masuk looping !!")
                                        var creditUsage = record.load({
                                            type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                            id: searchCreditUsage[u].id
                                        });

                                        creditUsage.setValue({
                                            fieldId: 'custrecord_scu_applied',
                                            value: false
                                        });

                                        var saveCreditUsage = creditUsage.save();
                                        log.debug('saveCreditUsage', saveCreditUsage);
                                    }
                                } // End - if Credit Memo - Uncheck apply invoiceSO
                                else if (invLinkType == 'Payment') { //  Start - if Payment - Uncheck Apply InvoiceSO
                                    var custPayment = record.load({
                                        type: record.Type.CUSTOMER_PAYMENT,
                                        id: invLinkId
                                    });
                                    log.debug("custPayment", custPayment);

                                    var paymentTranId = custPayment.getValue({
                                        fieldId: 'tranid'
                                    });
                                    log.debug("paymentTranId", paymentTranId);

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

                                        if (custPymtApplyInv == invoiceSO.id) {
                                            var custPymtApplyInvAmt = custPayment.getSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'amount',
                                                line: z
                                            });
                                            log.debug("custPymtApplyInvAmt", custPymtApplyInvAmt);

                                            custPayment.setSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'apply',
                                                line: z,
                                                value: false
                                            });
                                        }
                                    }
                                    var saveCustPymt = custPayment.save();
                                    log.debug("saveCustPymt", saveCustPymt);

                                    var searchUsagePymt = search.create({
                                        type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                        title: 'Related Saved Search',
                                        id: 'customsearch_related_saved_search',
                                        filters: [
                                            ["custrecord_scu_credit_memo_id", "is", paymentTranId],
                                            "AND", ["custrecord_scu_sales_order_id", "is", createdFrom]
                                        ],
                                        columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        })]
                                    }).run().getRange(0, 10);

                                    log.debug({
                                        "title": "searchUsagePymt",
                                        "details": searchUsagePymt
                                    });

                                    log.debug({
                                        "title": "searchUsagePymt.length",
                                        "details": searchUsagePymt.length
                                    });

                                    for (var o = 0, max = searchUsagePymt.length; o < max; o++) {
                                        log.debug("yes", "masuk looping !!")
                                        var creditUsage = record.load({
                                            type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                            id: searchUsagePymt[o].id
                                        });

                                        creditUsage.setValue({
                                            fieldId: 'custrecord_scu_applied',
                                            value: false
                                        });

                                        var saveCreditUsage = creditUsage.save();
                                        log.debug('saveCreditUsage', saveCreditUsage);
                                    }
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
                            id: invoiceSO.id
                        });
                        log.debug("voidInvoice", voidInvoice);
                    }
                } // End - If Create From Sales Order
            } // End - If new Status: Packed
            else if ((oldShipStatus == 'Packed' || oldShipStatus == 'Picked') && newShipStatus == 'Shipped') {
                //Create New Invoice Using Transform function - akan direview dulu
                //Note : Berhubung dalam 1 SO bisa ada beberapa kali pengiriman, apakah dalam Sales order bisa ada beberapa Invoice mengikuti item fulfillment ? jika ya, perlakuannya bagaimana ? 
                var newInvoice = record.transform({
                    fromType: record.Type.SALES_ORDER, //pakai Fulfillment
                    fromId: createdFrom,
                    toType: record.Type.INVOICE,
                });

                newInvoice.setValue({
                    fieldId: 'custbody_if_no',
                    value: newRecord.id
                });

                var newInvoiceId = newInvoice.save();
                log.debug("newInvoiceId", newInvoiceId);

                var searchCreditUsageCM = search.create({
                    type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                    title: 'Credit Usage Saved Search',
                    id: 'customsearch_credit_usage_saved_search',
                    filters: [
                        ["custrecord_scu_sales_order_id", "is", createdFrom]
                    ],
                    columns: [search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC
                        }),
                        "custrecord_scu_sales_order_id",
                        "custrecord_scu_credit_memo_id",
                        "custrecord_scu_amount_spent"
                    ],
                }).run().getRange(0, 100);

                log.debug({
                    "title": "searchCreditUsageCM",
                    "details": searchCreditUsageCM
                });

                log.debug({
                    "title": "searchCreditUsageCM.length",
                    "details": searchCreditUsageCM.length
                });

                for (var i = 0; i < searchCreditUsageCM.length; i++) {
                    var creditUsageTranId = searchCreditUsageCM[i].getValue('custrecord_scu_credit_memo_id');
                    log.debug("creditUsageTranId", creditUsageTranId);

                    var cuAmount = searchCreditUsageCM[i].getValue('custrecord_scu_amount_spent');
                    log.debug("cuAmount", cuAmount);

                    var relatedTranType = search.create({
                        type: search.Type.TRANSACTION,
                        title: 'Related Saved Search',
                        id: 'customsearch_related_saved_search',
                        filters: [
                            ["type", "anyof", "CustCred", "CustPymt"],
                            "AND", ["tranid", "is", creditUsageTranId],
                            "AND", ["mainline", "is", "T"]
                        ],
                        columns: [search.createColumn({
                            name: "type",
                            sort: search.Sort.ASC
                        })]
                    }).run().getRange(0, 100);

                    log.debug({
                        "title": "relatedTranType",
                        "details": relatedTranType
                    });

                    log.debug({
                        "title": "relatedTranType.length",
                        "details": relatedTranType.length
                    });

                    for (var j = 0; j < relatedTranType.length; j++) {
                        try {
                            var recordType = relatedTranType[j].recordType;
                            log.debug({
                                title: "recordType",
                                details: recordType
                            });

                            if (recordType == 'creditmemo') { // Start - If Credit Memo Apply to New Invoice
                                var creditMemoEdit = record.load({
                                    type: record.Type.CREDIT_MEMO,
                                    id: relatedTranType[j].id
                                });
                                log.debug("creditMemoEdit", creditMemoEdit);

                                var loadCreditUsage = record.load({
                                    type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                    id: searchCreditUsageCM[i].id
                                });

                                loadCreditUsage.setValue({
                                    fieldId: 'custrecord_scu_applied',
                                    value: true
                                });

                                var sublistLength = creditMemoEdit.getLineCount({
                                    sublistId: 'apply'
                                });
                                log.debug("sublistLength", sublistLength);

                                for (var k = 0; k < sublistLength; k++) {
                                    var cmApplyNewInv = creditMemoEdit.getSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'internalid',
                                        line: k
                                    });
                                    log.debug("cmApplyNewInv", cmApplyNewInv);

                                    if (cmApplyNewInv == newInvoiceId) {
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
                                            value: cuAmount
                                        });
                                    }
                                    var saveCreMemoEdit = creditMemoEdit.save();
                                    log.debug("saveCreMemoEdit", saveCreMemoEdit);

                                    var saveCreditUsage = loadCreditUsage.save();
                                    log.debug("saveCreditUsage", saveCreditUsage);
                                }
                            } // End - if Credit Memo - apply to New Invoice
                            else if (recordType == 'customerpayment') { // Start - If Credit Memo Apply to New Invoice
                                var custPymtEdit = record.load({
                                    type: record.Type.CUSTOMER_PAYMENT,
                                    id: relatedTranType[j].id
                                });
                                log.debug("custPymtEdit", custPymtEdit);

                                var loadCreditUsage = record.load({
                                    type: 'CUSTOMRECORD_STORE_CREDIT_USAGE',
                                    id: searchCreditUsageCM[i].id
                                });

                                loadCreditUsage.setValue({
                                    fieldId: 'custrecord_scu_applied',
                                    value: true
                                });

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
                                            value: cuAmount
                                        });
                                    }
                                }
                                var saveCustPymt = custPymtEdit.save();
                                log.debug("saveCustPymt", saveCustPymt);

                                var saveCreditUsage = loadCreditUsage.save();
                                log.debug("saveCreditUsage", saveCreditUsage);
                            } // End - if Payment - apply to New Invoice
                        } catch (e) {
                            log.error({
                                title: e.name,
                                details: e
                            });
                        }
                    }
                }
            }
        }
        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
    });