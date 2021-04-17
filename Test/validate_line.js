/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord'], function(currentRecord) {

    function validateLine() {
        var totalPcs;
        var record = currentRecord.get();

        if (scriptContext.sublistId === 'item') {
            var numLines = record.getLineCount({
                sublistId: 'item'
            });
            log.debug('numLines', numLines);

            var sublistValue = record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            log.debug('sublistValue', sublistValue);

            var sublistParent = record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'oqpbucket'
            });
            log.debug('sublistParent', sublistParent);

            var itemPcs = record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_bmpt_pcs'
            });
            log.debug('itemPcs', itemPcs);

            totalPcs += itemPcs;
            log.debug('totalPcs', totalPcs);

            var currIndex = record.getCurrentSublistIndex({
                sublistId: 'item'
            });
            log.debug('currIndex', currIndex);

            var sublistParent2;

            for (var i = numLines; i > 0; i--) {
                sublistParent2 = record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'oqpbucket'
                });
                log.debug('sublistParent2', sublistParent2);

                var itemPcs2 = record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_bmpt_pcs',
                    line: i - 1
                });
                log.debug('itemPcs2', itemPcs2);

                if (sublistParent == sublistParent2 && i - 1 !== currIndex) {
                    totalPcs += itemPcs2;
                    log.debug('totalPcs2', totalPcs);
                }
            }
            if (totalPcs > 0) {
                if (totalPcs >= 1 && totalPcs <= 9) {
                    record.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: 18
                    });
                    for (var u = numLines; u > 0; u--) {
                        if (sublistParent == sublistParent2 && i - 1 !== currIndex) {
                            record.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: 18
                            });
                        }
                    }
                } else if (totalPcs >= 1 && totalPcs <= 9) {
                    record.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: 18
                    });
                    for (var o = numLines; o > 0; o--) {
                        if (sublistParent == sublistParent2 && i - 1 !== currIndex) {
                            record.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: 19
                            });
                        }
                    }
                } else if (totalPcs >= 20) {
                    record.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: 18
                    });
                    for (var x = numLines; x > 0; x--) {
                        if (sublistParent == sublistParent2 && i - 1 !== currIndex) {
                            record.setSublistValue({
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
        validateLine: validateLine,
    };

});