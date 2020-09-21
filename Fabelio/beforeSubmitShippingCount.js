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
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.SHIP)
                return;

            var newRecord = context.newRecord;
            log.debug("newRecord", newRecord);

            var newShipStatus = newRecord.getText('shipstatus')
            log.debug("newShipStatus", newShipStatus);

            var shipCountSearch = search.create({
                type: search.Type.TRANSACTION,
                title: 'Shipping Try in Item Fulfillment',
                id: 'customsearch_shipping_try_if',
                columns: [
                    search.createColumn({
                        name: "newvalue",
                        join: "systemNotes"
                    })
                ],
                filters: [
                    ["internalid", "is", newRecord.id],
                    "AND", ["systemnotes.newvalue", "is", "Shipped"],
                    "AND", ["mainline", "is", "T"]
                ]
            }).run().getRange(0, 500);

            log.debug("shipCountSearch.length", shipCountSearch.length);

            newRecord.setValue({
                fieldId: 'custbody_shipping_count',
                value: shipCountSearch.length + 1
            });
        }
    });