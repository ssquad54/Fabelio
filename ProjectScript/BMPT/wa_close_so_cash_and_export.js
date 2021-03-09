/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record'],

    function(record) {
        var scriptName = "WA_CloseSO ";

        function onAction(context) {
            var funcName = scriptName + "onAction " + context.newRecord.type + " " + context.newRecord.id;
            log.debug(funcName, "Starting");

            try {
                var SO = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });

                //here is our loop.  Close all lines and the entire order will close
                for (var i = 0; i < SO.getLineCount({ 'sublistId': 'item' }); i++) {
                    var backOrder = SO.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantitybackordered',
                        line: i
                    });
                    log.debug("back order Qty", backOrder);

                    var invoice = SO.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantitybilled',
                        line: i
                    });

                    if (backOrder == 0 && invoice == 0) {
                        SO.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: true,
                            line: i
                        });
                    }
                }
                SO.save();
                log.debug(funcName, "updated/closed.");
            } catch (e) {
                log.error(funcName + "Unable to close error", e);
            }
        }
        return {
            onAction: onAction
        };
    });