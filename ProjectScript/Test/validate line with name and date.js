/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/format', 'N/error'], function(record, search, format, error) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    //    function showErrorMessage(msgText) {
    //        var myMsg = message.create({
    //            title: "Error Save Record",
    //            message: msgText,
    //            type: message.Type.ERROR
    //        });
    //        myMsg.show({
    //            duration: 10000
    //        });
    //    }

    function validateLine(context) {
        var currentRecord = context.currentRecord;

        var itemName = currentRecord.getCurrentSublistValue({
            sublistId: 'inventory',
            fieldId: 'item'
        });

        log.debug("itemName", itemName);

        var tranDate = currentRecord.getValue({
            fieldId: 'trandate'
        });

        log.debug("tranDate", tranDate);

        var arrColumns = [];

        var arrFilters = [
            ["item.type", "anyof", "Assembly", "InvtPart"],
            "AND", ["formulanumeric: Case when {type} IN ('Bin Transfer','Bin Putaway Worksheet') then {serialnumberquantity} else (case when {accounttype} = 'Other Current Asset' and {posting} = 'T' then {serialnumberquantity} else Null end) end", "isnotempty", ""],
            "AND", ["transactionlinetype", "noneof", "WIP"],
            "AND", ["item", "anyof", itemName],
            "AND", ["trandate", "within", tranDate]
        ];

        /*        arrFilters.push(search.createFilter({
                   name: 'item.type',
                   operator: search.Operator.ANYOF,
                   values: ['Assembly', 'InvtPart']
               }));
       
               arrFilters.push(search.createFilter({
                   name: 'transactionlinetype',
                   operator: search.Operator.NONEOF,
                   values: ['WIP']
               }));
       
               arrFilters.push(search.createFilter({
                   name: 'item',
                   operator: search.Operator.ANYOF,
                   values: itemName
               }));
       
               arrFilters.push(search.createFilter({
                   name: 'trandate',
                   operator: search.Operator.WITHIN,
                   values: tranDate
               }));
        */




        var onHand = search.create({
            type: search.Type.TRANSACTION,
            title: 'Qty on Hand by date',
            id: 'Customsearch_on_hand_by_date',
            columns: search.createColumn({
                name: "formulanumeric",
                formula: "Case when {type} IN ('Bin Transfer','Bin Putaway Worksheet') then {serialnumberquantity} else (case when {accounttype} = 'Other Current Asset' and {posting} = 'T' then {serialnumberquantity} else Null end) end "
            }),
            filters: arrFilters,
        }).run().getRange(0, maxData);

        log.debug("onHand", onHand);

        /*         var itemCount = currentRecord.getLineCount({
                    sublistId: 'inventory'
                });

                var onHand = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'quantityonhand'
                });

                var qtyTrf = currentRecord.getCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby'
                }); */

        var qtyFulfill = currentRecord.getCurrentSublistValue({
            sublistId: 'inventory',
            fieldId: 'adjustqtyby'
        });

        log.debug("qtyFulfill", qtyFulfill);

        if (qtyFulfill > onHand) {
            dialog.alert({ // Alert jika terjadi error
                title: 'Error',
                message: 'Please Contact Administrator - System Validate Error NS'
            });

            log.debug({
                title: 'Success',
                details: 'Alert displayed successfully'
            });
            return false;
        }
        return true;
    }

    return {
        validateLine: validateLine
    };
});