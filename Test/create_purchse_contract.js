/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/format', 'N/record', 'N/search', 'N/log'], function(format, record, search, log) {
    function execute(context) {
        if (context.type == context.InvocationType.SCHEDULED)
            try {
                var createRec = record.create({
                    type: record.Type.PURCHASE_CONTRACT,
                    isDynamic: true
                });
                createRec.setValue({
                    fieldId: 'tranid',
                    value: "PUC-8000"
                });
                createRec.setValue({
                    fieldId: 'entity',
                    value: 1671
                });
                createRec.setValue({
                    fieldId: 'subsidiary',
                    value: 14
                });
                log.debug('start', 'input item');
                i = 4465;
                z = 1;
                while (i < 12465) {
                    createRec.selectNewLine({
                        sublistId: 'item'
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: i
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: "10.00"
                    });
                    createRec.commitLine({
                        sublistId: 'item'
                    });
                    log.debug('item', 'item ' + z);

                    i++;
                    z++;
                }
                var recordId = createRec.save();

                log.debug({
                    title: 'recordId',
                    details: recordId
                });
            } catch (error) {
                log.debug('error', error);
            }
    }
    return {
        execute: execute
    };

});