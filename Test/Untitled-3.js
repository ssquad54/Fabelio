/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord', 'N/search', 'N/error'], function(record, currentrecord, search, error) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;

        var dateToday = new Date();

        var tranDate = new Date(currentRecord.getValue({
            fieldId: 'trandate'
        }));

        //   var tranDate = new Date(currentRecord.getValue('trandate'));

        if (context.fieldId == 'trandate') {

            var itemLocation = currentRecord.getValue({
                fieldId: 'location'
            });

            log.debug("itemLocation", itemLocation);

            var lineCount = currentRecord.getLineCount({
                sublistId: 'item'
            });

            log.debug("lineCount", lineCount);

            for (var i = 0; i < lineCount; i++) {
                var itemName = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                log.debug("itemName", itemName);

                var qtyItem = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                log.debug("qtyItem", qtyItem);
            };
        };

        var columns = [
            search.createColumn({
                name: "formulanumeric",
                summary: "SUM",
                formula: "Case when {type} IN ('Bin Transfer','Bin Putaway Worksheet') then {serialnumberquantity} else (case when {accounttype} = 'Other Current Asset' and {posting} = 'T' then {serialnumberquantity} else Null end) end",
                label: "Formula (Numeric)"
            })
        ];

        log.debug("columns", columns);

        var filters = [
            ["formulanumeric: case when {account.id} = {item.assetaccount.id} then 1 end", "equalto", "1"],
            "AND", ["posting", "is", "T"],
            "AND", ["trandate", "before", tranDate],
            "AND", ["item", "anyof", itemName]
        ];

        log.debug("filters", filters);

        var itemQty = search.create({
            type: search.Type.TRANSACTION,
            title: 'On Hand By Date',
            id: 'Customsearch_inventory_on_hand',
            columns: columns,
            filters: filters
        }).run().getRange(0, 100);

        log.debug("itemSearch", itemQty);

        /*         for (var j = 0; j < itemSearch.length; j++) {
                    var qtyLotOnHand = itemSearch[j].getValue('quantityonhand');
        
                    log.debug("qtyLotOnHand", qtyLotOnHand);
        
                    var itemLotNumber = itemSearch[j].getValue('inventorynumber');
        
                    log.debug("itemLotNumber", itemLotNumber);
                }; */

        if (tranDate != dateToday) {

            if (qtyItem > onHand) {
                dialog.alert({ // Alert jika terjadi error
                    title: 'Error',
                    message: 'Please Contact Administrator - System Validate Error NS'
                });

                /*             log.debug({
                                title: 'Success',
                                details: 'Alert displayed successfully'
                            }); */
                return false;
            }
        }
    }
    return {
        fieldChanged: fieldChanged
    };
});