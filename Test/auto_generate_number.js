/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'],
    function(record, search, log) {
        function afterSubmit(scriptContext) {
            var currentRecord = scriptContext.newRecord;
            var recId = currentRecord.id;

            var objRecord = record.load({
                type: record.Type.VENDOR_PAYMENT,
                id: recId,
                isDynamic: true
            });


            objRecord.setValue({
                fieldId: 'autoname',
                value: false,
                ignoreFieldChange: true
            });

            var mySearch = search.create({
                type: search.Type.VENDOR_PAYMENT,
                filters: [search.createFilter({
                    name: 'mainline',
                    operator: search.Operator.IS,
                    value: tue
                })],
                columns: [search.createColumn({
                    name: 'tranid',
                    sort: search.Sort.DESC
                })]
            }).run().getRange(0, 1);
            log.debug('mySearch', mySearch);

            var tranId;
            if (mySearch.length == 1) {
                tranId = mySearch[0].getValue({
                    name: 'tranid'
                });
            } else {
                tranId = 0;
            }

            var newTranId = tranId.substring(4, projectID.length);
            newTranId = parseInt(newTranId) + 1;
            log.debug('newTranId', newTranId);

            var tempid = "PAY-";
            tempid = tempid + newTranId;
            log.debug('tempid', tempid);

            var finalTranId = objRecord.setValue({
                fieldId: 'entityid',
                value: tempid
            });
            log.debug('finalTranId', finalTranId);

            var finalRec = objRecord.save({
                enablesourcing: true,
                ignamoreMandatoryFields: true
            });
            log.debug('finalRec', finalRec);
        }
        return {
            afterSubmit: afterSubmit
        };
    });