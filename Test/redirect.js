/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/redirect'], function(record, redirect) {

    function afterSubmit(context) {
        log.debug('type', context.type);
        if (context.type !== context.UserEventType.EDIT)
            return;

        var record = context.newRecord;

        var id = record.id;
        var confirm = record.getValue({
            fieldId: 'custbody_bmpt_print_picking'
        });
        var printtype = 'pickingticket';

        log.debug('confirm', confirm);

        if (confirm)
            redirect.redirect({
                url: '/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&formnumber=115&trantype=salesord&&id=' + id + '&printtype=' + printtype + '&incustlocale=T'
            });
    }

    return {
        afterSubmit: afterSubmit
    };
});