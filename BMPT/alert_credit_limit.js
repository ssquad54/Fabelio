/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog'], function(record, dialog) {
    function saveRecord(context) {
        var currentRecord = context.currentRecord;

        var soReturn = currentRecord.getValue({
            fieldId: 'custbody_bmpt_return',
        });
        log.debug({
            title: 'So Retur',
            details: soReturn
        });
        if (soReturn == true)
            return true;

        var paymentMethod = currentRecord.getValue({
            fieldId: 'custbody_bmpt_metode_pembayaran'
        });
        log.debug({
            title: 'Metode Pembayaran',
            details: paymentMethod
        });

        if (paymentMethod == 3 || paymentMethod == 4) { // Metode Pembayaran - 3 : Credit 1 || 4 : Credit 2
            /*   var customerId = currentRecord.getValue({
                fieldId: 'entity'
            });
 */
            var totalOrder = currentRecord.getValue({
                fieldId: 'total'
            });

            var creditLimit = currentRecord.getValue({
                fieldId: 'credlim'
            });

            var balance = currentRecord.getValue({
                fieldId: 'balance'
            });

            /*    var unbilledOrders = currentRecord.getValue({
                   fieldId: 'unbilledorders'
               }); */

            var remainingBalance = (creditLimit * 0.90) - balance;
            log.debug({
                title: "Remaining Balance",
                details: remainingBalance
            });

            var totalBalance = balance + totalOrder;

            var currencySymbol = {
                style: "currency",
                currency: "IDR"
            };

            if (totalBalance > (creditLimit * 0.90)) {
                var confirmation = confirm('Total Customer Balance ' + totalBalance.toLocaleString("id-ID", currencySymbol) + ' Sudah Melebihi Credit Limit Sebesar ' + (creditLimit * 0.90).toLocaleString("id-ID", currencySymbol));

                if (confirmation) {
                    return true;
                } else {
                    return false;
                }
            }
            /* else if (totalBalance > creditLimit) {
                           window.alert('Total Customer Balance ' + totalBalance.toLocaleString("id-ID", currencySymbol) + ' Sudah Mencapai Credit Limit Sebesar ' + creditLimit.toLocaleString("id-ID", currencySymbol));
                       } */
        }
        return true;
    }
    return {
        saveRecord: saveRecord
    };

});