/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 */
define(['N/record'], function(record) {
    function each(params) {

        salesOrder = record.load({
            type: params.type,
            id: params.id
        });

        for (var i = 0; i < salesOrder.getLineCount({ sublistId: 'item' }); i++) {
            var backOrder = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: 'backordered',
                line: i
            });
            if (backOrder == 0 && backOrder == null) {
                salesOrder.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'isclosed',
                    line: i,
                    value: true
                });
            }
        }
        salesOrder.save({ ignoreMandatoryFields: true });
    }
    return {
        each: each
    };
});