/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog'], function(record, dialog) {
    function saveRecord(context) {
        log.debug('mode', context.mode);

        var confirmation = confirm('Do you need to print Picking Ticket?');

        if (confirmation) {
            context.currentRecord.setValue({
                fieldId: 'custbody_bmpt_print_picking',
                value: true
            });
            log.debug('Yes', 'Yes');
            return true;
        } else {
            log.debug('No', 'No');
            return true;
        }
    }

    return {
        saveRecord: saveRecord
    };
});