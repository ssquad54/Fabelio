/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 */
define(['N/transaction', 'N/record'], function(transaction, record) {
    function each(params) {

        var voidId = transaction.void({
            type: params.type,
            id: params.id
        });

        var tranId = record.load({
            type: params.type,
            id: voidId
        });

        var memo = tranId.getValue({
            fieldId: 'memo'
        });

        log.debug({
            title: 'Success',
            details: memo
        });
    }
    return {
        each: each
    };
});