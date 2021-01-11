/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 */
define(['N/transaction', 'N/record'], function(transaction, record) {
    function each(params) {

        var depApp = record.load({
            type: params.type,
            id: params.id
        });

        var applyTo = depApp.getSublistValue({
            sublistId: 'apply',
            fieldId: 'type',
            line: 0
        });
        log.debug({
            title: 'Apply to',
            details: applyTo
        });

        if (applyTo == 'Invoice') {
            var invDate = depApp.getSublistValue({
                sublistId: 'apply',
                fieldId: 'applydate',
                line: 0
            });
            log.debug({
                title: 'Inv Date',
                details: invDate
            });

            depApp.setValue({
                fieldId: 'trandate',
                value: invDate
            });

            depApp.save()

            log.debug({
                title: 'Success !',
                details: 'Updated !'
            });

        } else if (applyTo == 'Customer Refund') {
            var refundDate = depApp.getSublistValue({
                sublistId: 'apply',
                fieldId: 'applydate',
                line: 0
            });
            log.debug({
                title: 'refund Date',
                details: refundDate
            });

            depApp.setValue({
                fieldId: 'trandate',
                value: refundDate
            });

            depApp.save()

            log.debug({
                title: 'Success !',
                details: 'Updated !'
            });
        }
    }
    return {
        each: each
    };
});