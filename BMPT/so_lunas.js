/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, transaction) {
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE)
            return;

        var custPayment = context.newRecord;
        log.debug({
            title: "custPayment",
            details: custPayment
        });

        var customer = custPayment.getValue({
            fieldId: 'customer'
        });
        log.debug({
            title: "cust Id",
            details: customer
        });

        var lineCount = custPayment.getLineCount({
            sublistId: 'apply'
        });
        log.debug({
            title: "lineCount",
            details: lineCount
        });

        for (var i = 0; i < lineCount; i++) {
            var type = custPayment.getSublistValue({
                sublistId: 'apply',
                fieldId: 'trantype',
                line: i
            });
            log.debug({
                title: "type",
                details: type
            });

            if (type == 'CustInvc') {
                var apply = custPayment.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: i
                });
                log.debug({
                    title: "apply",
                    details: apply
                });

                var invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: apply
                });
                log.debug({
                    title: "invoiceRecord",
                    details: invoiceRecord
                });

                var invStatus = invoiceRecord.getValue({
                    fieldId: 'status'
                });
                log.debug({
                    title: "invStatus",
                    details: invStatus
                });

                if (invStatus == 'Paid In Full') {
                    var createdFrom = invoiceRecord.getValue({
                        fieldId: 'createdfrom'
                    });
                    log.debug({
                        title: "createdFrom",
                        details: createdFrom
                    });

                    if (createdFrom) {
                        var salesOrder = record.load({
                            type: record.Type.SALES_ORDER,
                            id: createdFrom
                        });
                        log.debug({
                            title: "salesOrder",
                            details: salesOrder
                        });

                        var soAmount = salesOrder.getValue({
                            fieldId: 'total'
                        });
                        log.debug({
                            title: "soAmount",
                            details: soAmount
                        });

                        var soLink = salesOrder.getLineCount({
                            sublistId: 'links'
                        });
                        log.debug({
                            title: "soLink",
                            details: soLink
                        });

                        var invAmount = 0;

                        for (var u = 0; u < soLink; u++) {
                            var soLinkType = salesOrder.getSublistValue({
                                sublistId: 'links',
                                fieldId: 'type',
                                line: u
                            });
                            log.debug({
                                title: "soLinkType",
                                details: soLinkType
                            });

                            if (soLinkType == 'Invoice') {
                                var amount = salesOrder.getSublistValue({
                                    sublistId: 'links',
                                    fieldId: 'total',
                                    line: u
                                });
                                log.debug({
                                    title: "amount",
                                    details: amount
                                });
                                invAmount += amount;
                                log.debug({
                                    title: "invAmount",
                                    details: invAmount
                                });
                            }
                        }
                        if (invAmount >= soAmount) {
                            salesOrder.setValue({
                                fieldId: 'custbody_bmpt_status_so',
                                value: 6
                            });

                            var updateSO = salesOrder.save();
                            log.debug('updateSO', updateSO);
                        }
                    }
                }
            }
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});