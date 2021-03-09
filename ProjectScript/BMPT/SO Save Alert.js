/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog'], function(record, dialog) {
    function saveRecord(context) {
        var currentRecord = context.currentRecord;

        var paymentMethod = currentRecord.getValue({
            fieldId: 'custbody_bmpt_metode_pembayaran'
        });
        log.debug({
            title: 'Metode Pembayaran',
            details: paymentMethod
        });

        if (paymentMethod == 3 || paymentMethod == 4) { // Metode Pembayaran - 3 : Credit 1 || 4 : Credit 2
            var customerId = currentRecord.getValue({
                fieldId: 'entity'
            });

            var customer = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            var creditLimit = customer.getValue({
                fieldId: 'creditlimit'
            });

            var creLimitNear = creditLimit * 0.90;

            var balance = customer.getValue({
                fieldId: 'balance'
            });

            var unbilledOrder = customer.getValue({
                fieldId: 'unbilledorders'
            });

            var remainingBalance = creLimitNear - (balance + unbilledOrder);
            log.debug({
                title: "Customer Remaining Balance",
                details: remainingBalance
            });

            var itemCount = currentRecord.getLineCount({
                sublistId: 'item'
            });

            var totalAmount = 0;
            var amount;

            //get item Detail per Line
            for (var i = 0; i < itemCount; i++) {
                currentRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });

                var inventory = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var quantity = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity'
                });
                log.debug({
                    title: "quantity",
                    details: quantity
                });

                var available = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantityavailable'
                });
                log.debug({
                    title: "available",
                    details: available
                });

                var rate = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate'
                });
                log.debug({
                    title: "rate",
                    details: rate
                });

                // get amount
                if (quantity <= available) {
                    amount = quantity * rate;
                } else if (quantity > available) {
                    amount = available * rate;
                }
                log.debug({
                    title: "amount",
                    details: amount
                });

            }

            totalAmount += amount;

            log.debug({
                title: 'Amount Total',
                details: totalAmount
            });

            var currencySymbol = {
                style: "currency",
                currency: "IDR"
            };

            if (totalAmount > remainingBalance) {
                dialog.alert({
                    title: 'Warning !!',
                    message: 'Customer Balance is Near Credit Limit' + ' || ' + 'Credit Limit: ' + creditLimit.toLocaleString("id-ID", currencySymbol) + ' || ' + 'Total Item: ' + totalAmount.toLocaleString("id-ID", currencySymbol)
                });
            }
        }
        return true;
    }
    return {
        saveRecord: saveRecord
    };

});