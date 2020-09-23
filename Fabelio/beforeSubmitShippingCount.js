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
            var oldRecord;
            var oldStatus;
            var newRecord;
            var newStatus;

            // on Create 
            if (context.type == context.UserEventType.CREATE) {
                newRecord = context.newRecord;
                newStatus = newRecord.getText('shipstatus');
                log.debug("Shipping Status", newStatus)

                if (newStatus == 'Shipped') {
                    newRecord.setValue({
                        fieldId: 'custbody_kri_shipping',
                        value: (1).toString()
                    });

                    var so = record.load({
                        type: record.Type.SALES_ORDER,
                        id: newRecord.getValue('createdfrom')
                    });

                    // Search Shipping Count from all Item Fulfillment related with Sales order
                    var soShippingSearch = search.create({
                        type: search.Type.ITEM_FULFILLMENT,
                        title: 'Shipping Count for SO',
                        id: 'customsearch_shipping_count_so',
                        columns: [
                            search.createColumn({
                                name: "custbody_kri_shipping"
                            })
                        ],
                        filters: [
                            ["createdfrom", "is", newRecord.getValue('createdfrom')],
                            "AND", ["mainline", "is", "T"]
                        ]
                    }).run().getRange(0, 500);

                    log.debug("soShippingSearch", soShippingSearch);

                    var soShippingCount = 1;
                    for (var i = 0; i < soShippingSearch.length; i++) {

                        var IFshippingCount = soShippingSearch[i].getValue('custbody_kri_shipping')
                        log.debug("IFshippingCount", IFshippingCount);

                        soShippingCount += Number(soShippingSearch[i].getValue('custbody_kri_shipping'));
                        log.debug("soShippingCount", soShippingCount);
                    }
                    // Populate Shipping Count to Sales Order
                    var so = record.load({
                        type: record.Type.SALES_ORDER,
                        id: newRecord.getValue('createdfrom')
                    });

                    so.setValue({
                        fieldId: 'custbody_kri_shipping',
                        value: (soShippingCount).toString()
                    });

                    var saveSO = so.save()
                    log.debug("internalid SO", saveSO);
                };
            } else if (context.type !== context.UserEventType.CREATE) {
                oldRecord = context.oldRecord;
                newRecord = context.newRecord;

                newStatus = newRecord.getText('shipstatus')
                log.debug("newStatus", newStatus);

                oldStatus = oldRecord.getText('shipstatus');
                log.debug("oldStatus", oldStatus);

                if (oldStatus == 'Shipped')
                    return;
                else if (newStatus == 'Shipped') {
                    var shippingCount = newRecord.getValue({
                        fieldId: 'custbody_kri_shipping'
                    });
                    log.debug("shipping Count", shippingCount);

                    newRecord.setValue({
                        fieldId: 'custbody_kri_shipping',
                        value: shippingCount + 1
                    });

                    // Search Shipping Count from all Item Fulfillment related with Sales order
                    var soShippingSearch = search.create({
                        type: search.Type.ITEM_FULFILLMENT,
                        title: 'Shipping Count for SO',
                        id: 'customsearch_shipping_count_so',
                        columns: [
                            search.createColumn({
                                name: "custbody_kri_shipping"
                            })
                        ],
                        filters: [
                            ["createdfrom", "is", newRecord.getValue('createdfrom')],
                            "AND", ["mainline", "is", "T"]
                        ]
                    }).run().getRange(0, 500);

                    log.debug("soShippingSearch", soShippingSearch);

                    var soShippingCount = 1;
                    for (var i = 0; i < soShippingSearch.length; i++) {

                        var IFshippingCount = soShippingSearch[i].getValue('custbody_kri_shipping')
                        log.debug("IFshippingCount", IFshippingCount);

                        soShippingCount += Number(soShippingSearch[i].getValue('custbody_kri_shipping'));
                        log.debug("soShippingCount", soShippingCount);
                    }
                    // Populate Shipping Count to Sales Order
                    var so = record.load({
                        type: record.Type.SALES_ORDER,
                        id: newRecord.getValue('createdfrom')
                    });

                    so.setValue({
                        fieldId: 'custbody_kri_shipping',
                        value: (soShippingCount).toString()
                    });

                    var saveSO = so.save()
                    log.debug("internalid SO", saveSO);
                }
            }
        }
        return {
            beforeSubmit: beforeSubmit
        };
    });