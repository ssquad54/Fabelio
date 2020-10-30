/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record'],

    function(record) {
        var scriptName = "WA_Close_SO_Cash_and_Export ";

        function onAction(context) {
            var funcName = scriptName + "onAction " + context.newRecord.type + " " + context.newRecord.id;
            log.debug(funcName, "Starting");

            try {
                var SO = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });

                //here is our loop.  Close all lines and the entire order will close
                for (var i = 0; i < SO.getLineCount({ 'sublistId': 'item' }); i++)
                    SO.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        value: true,
                        line: i
                    });

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