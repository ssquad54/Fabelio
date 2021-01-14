/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 */
define(['N/transaction', 'N/record', 'N/format'], function(transaction, record, format) {
    function each(params) {

        var depApp = record.load({
            type: params.type,
            id: params.id
        });

        var depAppNo = depApp.getValue('tranid');
        var depAppDate = depApp.getText('trandate');
        var depAppAmt = depApp.getValue('applied');

        log.debug('Deposit Application Internal ID', params.id);
        log.debug('Deposit Application Number', depAppNo);
        log.debug('Deposit Application Date', depAppDate);
        log.debug('Deposit Application Amount', depAppAmt);

        var dateValidate = format.parse({
            value: '2020-1-1',
            type: format.Type.DATE
        });
        log.debug('dateValidate', dateValidate);

        var applyTo = depApp.getSublistValue({
            sublistId: 'apply',
            fieldId: 'type',
            line: 0
        });
        log.debug('Apply to', applyTo);

        if (applyTo == 'Invoice') {
            var invDate = depApp.getSublistValue({
                sublistId: 'apply',
                fieldId: 'applydate',
                line: 0
            });
            log.debug('Inv Date', invDate);

            if (invDate < dateValidate) {
                depApp.setValue({
                    fieldId: 'trandate',
                    value: invDate
                });

                depApp.save();

                log.debug('Success !', 'Updated ! | Inv Number : ' + depApp.getSublistValue('apply', 'refnum', 0) + ' | Inv Date : ' + depApp.getSublistText('apply', 'applydate', 0) + ' | App Int ID : ' + params.id + ' | App No : ' + depAppNo + ' | App Date : ' + depAppDate + ' | Amount : ' + depAppAmt);
            } else {
                log.debug('Failed !', 'Not Updated ! | Inv Number : ' + depApp.getSublistValue('apply', 'refnum', 0) + ' | Inv Date : ' + depApp.getSublistText('apply', 'applydate', 0) + ' | App Int ID : ' + params.id + ' | App No : ' + depAppNo + ' | App Date : ' + depAppDate + ' | Amount : ' + depAppAmt);
            }

        } else if (applyTo == 'Customer Refund') {
            var refundDate = depApp.getSublistValue({
                sublistId: 'apply',
                fieldId: 'applydate',
                line: 0
            });
            log.debug('refund Date', refundDate);

            if (refundDate < dateValidate) {
                depApp.setValue({
                    fieldId: 'trandate',
                    value: refundDate
                });

                depApp.save();

                log.debug('Success !', 'Updated ! | Refund Number : ' + depApp.getSublistValue('apply', 'refnum', 0) + ' | Refund Date : ' + depApp.getSublistText('apply', 'applydate', 0) + ' | App Int ID : ' + params.id + ' | App No : ' + depAppNo + ' | App Date : ' + depAppDate + ' | Amount : ' + depAppAmt);
            } else {
                log.debug('Failed !', 'Not Updated ! | Refund Number : ' + depApp.getSublistValue('apply', 'refnum', 0) + ' | Refund Date : ' + depApp.getSublistText('apply', 'applydate', 0) + ' | App Int ID : ' + params.id + ' | App No : ' + depAppNo + ' | App Date : ' + depAppDate + ' | Amount : ' + depAppAmt);
            }
        }
    }
    return {
        each: each
    };
});