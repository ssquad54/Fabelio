/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/transaction'], function(record, search, transaction) {
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE)
            return;
        var billPayment = context.newRecord;
        log.debug({
            title: "bill Payment",
            details: billPayment
        });

        var tranDate;
        var dueDate;
        var totalPayment;

        var vendorId = billPayment.getValue({
            fieldId: 'entity'
        });
        log.debug({
            title: "vendor Id",
            details: vendorId
        });

        if (vendorId == 29) { // vendorId : 29 - BENTARA SINAR PRIMA, PT
            tranDate = billPayment.getValue({
                fieldId: 'trandate'
            });

            totalPayment = billPayment.getValue({
                fieldId: 'total'
            });

            var applyCount = billPayment.getLineCount({
                sublistId: 'apply'
            });

            for (var i = 0; i < applyCount; i++) {
                var apply = billPayment.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    line: i
                });
                log.debug({
                    title: "Apply",
                    details: apply
                });

                if (apply == true) {
                    dueDate = billPayment.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'duedate',
                        line: i
                    });
                }
            }

            var differenceInDays = (dueDate.getTime() - tranDate.getTime()) / (1000 * 60 * 60 * 24);
            log.debug({
                title: "difference Days",
                details: differenceInDays + " fixed is " + differenceInDays.toFixed()
            });

            var discountTotal = (differenceInDays.toFixed() / 90) * (3.6 / 100) * totalPayment;
            log.debug({
                title: 'Total Discount',
                details: discountTotal
            });

            var invoice = record.create({
                type: record.Type.INVOICE,
                isDynamic: true
            });

            invoice.setValue({
                fieldId: 'customform',
                value: 121
            });

            invoice.setValue({ // Set Entity Value to 3182 - BENTARA SINAR PRIMA, PT
                fieldId: 'entity',
                value: 3182
            });

            invoice.setValue({
                fieldId: 'trandate',
                value: tranDate
            });

            invoice.setValue({
                fieldId: 'custbody_bmpt_bill_payment',
                value: billPayment.id
            });

            invoice.setValue({
                fieldId: 'memo',
                value: "Invoice Diskon BSP dari Vendor Payment BSP"
            });

            invoice.setValue({ // Profit Center - BMPT
                fieldId: 'department',
                value: 1
            });

            invoice.setValue({ // Sales Channel - Dropship/Reseller
                fieldId: 'class',
                value: 6
            });

            invoice.setValue({ // Warehouse - BMPT
                fieldId: 'location',
                value: 1
            });

            invoice.selectNewLine({
                sublistId: 'item'
            });

            // Set Item - Discount BSP - 7322
            invoice.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: 7322
            });

            invoice.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: 1
            });

            // Set Item Rate  - Total Discount
            invoice.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: discountTotal.toFixed()
            });

            invoice.commitLine({
                sublistId: 'item'
            });

            invoice.save();

            log.debug({
                title: "Create Invoice",
                details: invoice
            });

            var updateBillPymt = record.load({
                type: record.Type.VENDOR_PAYMENT,
                id: billPayment.id
            });

            updateBillPymt.setValue({
                fieldId: 'custbody_bmpt_invoice',
                value: invoice.id
            });

            updateBillPymt.save();

            log.debug({
                title: "Set Nomor Invoice",
                details: "Success !!"
            });
        }

    }
    return {
        afterSubmit: afterSubmit
    };
});