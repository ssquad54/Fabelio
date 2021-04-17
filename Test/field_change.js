/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {

    function validateField(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var fieldName = context.fieldId;
        var currentLine = context.line; // Line number (first line has value = 0) of Item User is on.

        console.info('currentRecord :' + currentRecord);
        console.info('sublistName :' + sublistName);
        console.info('fieldName :' + fieldName);
        console.info('currentLine :' + currentLine);

        if (sublistName === 'item' && fieldName === 'custcol_bmpt_pcs') {
            console.info("SS fieldChanged: " + (context.sublistId || "record") + "." + context.fieldId);
            console.info("SS currentLine: " + currentLine);

            lines = currentRecord.getLineCount({
                sublistId: 'item'
            });
            console.info('SS lines: ' + lines);

            var totalPcs = 0;
            var priceLevel;
            var lines;
            var pcs;
            var invDetail;
            var parent;
            var parent2;

            for (var i = lines - 1; i >= 0; i--) {

                currentRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });

                if (i === currentLine) {

                    totalPcs = 0;

                    parent = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'oqpbucket'
                    });
                    console.info('parent : ' + parent);

                    pcs = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_pcs'
                    });
                    console.info('pcs : ' + pcs);

                    /*     currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bmpt_pcs',
                            value: pcs
                        }); */

                    totalPcs += pcs;

                    console.info("1. SS total last line pcs: " + totalPcs);

                    if (totalPcs >= 1 && totalPcs <= 9) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 18
                        });
                    } else if (totalPcs >= 10 && totalPcs <= 19) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 19
                        });
                    } else if (totalPcs >= 20) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 20
                        });
                    }
                } else {
                    parent2 = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'oqpbucket'
                    });
                    console.info('parent : ' + parent2);

                    if (parent === parent2) {
                        pcs = (parseFloat(currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bmpt_pcs'
                        })) || 0);

                        totalPcs += pcs;
                        console.info("SS total first line pcs: " + totalPcs);


                        if (totalPcs >= 1 && totalPcs <= 9) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: 18
                            });
                        } else if (totalPcs >= 10 && totalPcs <= 19) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: 19
                            });
                        } else if (totalPcs >= 20) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: 20
                            });
                        }
                    }
                }
            }
            return true;
        } else {
            return true;
        }
    }
    return {
        validateField: validateField
    };
});