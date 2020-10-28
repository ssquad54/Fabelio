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
                fieldId: 'quantitybackordered',
                line: i
            });
            log.debug({
                title: "back order Qty",
                details: backOrder
            });

            if (backOrder == 0) {
                salesOrder.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'isclosed',
                    value: true,
                    line: i
                });
            }
        }
        salesOrder.save();
    }
    return {
        each: each
    };
});