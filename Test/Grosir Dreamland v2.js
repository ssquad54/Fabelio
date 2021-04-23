/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/currentRecord'], function(currentRecord) {
    function beforeSubmit(context) {
        log.debug('context type', context.type);
        if (context.type != context.UserEventType.CREATE && context.type != context.UserEventType.EDIT)
            return;

        var record = context.newRecord;

        var pcs = 0;
        var item;
        var priceLevel;
        var itemParent;
        var parentArray = [];

        var customForm = record.getValue({
            fieldId: 'customform'
        });
        log.debug('Custom Form', customForm);

        var grosir = record.getValue({
            fieldId: 'custbody_grosir'
        });
        log.debug('grosir', grosir);

        if (grosir == true) {
            var lineCount = record.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < lineCount; i++) {
                //get parent item value
                itemParent = record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_bmpt_kelompok_roll',
                    line: i
                });

                if (itemParent.length > 0) {
                    itemParent = '_' + itemParent;
                    if (!(itemParent in parentArray)) {
                        parentArray[itemParent] = "1";
                    }
                    log.debug('itemParent', itemParent);


                    item = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    priceLevel = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: i
                    });

                    pcs = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_pcs',
                        line: i
                    });

                    parentArray.push({
                        parent: itemParent.substring(1),
                        pcs: parseInt(pcs),
                    });
                }
            }
            log.debug('parentArray', parentArray);
            log.debug('parentArray.length', parentArray.length);

            var totalPcs = {};
            var newParentArray = [];

            parentArray.forEach(
                function(e) {
                    if (!totalPcs[e.parent]) {
                        totalPcs[e.parent] = 0;
                    }
                    totalPcs[e.parent] += e.pcs;
                }
            );

            for (var parent in totalPcs) {
                newParentArray.push({
                    parent: parent,
                    pcs: totalPcs[parent]
                });
            }

            log.debug('new Parent Array', newParentArray);
            log.debug('new parent array length', newParentArray.length);

            for (var x = 0; x < newParentArray.length; x++) {
                var parentLine = newParentArray[x];
                var newParent = parentLine.parent;
                var cnt = parentLine.pcs;

                log.debug('parentLine', parentLine);

                for (var o = 0; o < lineCount; o++) {
                    var parent2 = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_bmpt_kelompok_roll',
                        line: o
                    });
                    log.debug('parent2', parent2);

                    var priceLevel2 = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: o
                    });
                    log.debug('priceLevel2', priceLevel2);

                    if (newParent == parent2 && priceLevel2 != 13) {
                        if (cnt >= 1 && cnt <= 9) {
                            record.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                line: o,
                                value: 18
                            });
                        } else if (cnt >= 10 && cnt <= 19) {
                            record.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                line: o,
                                value: 19
                            });
                        } else if (cnt >= 20) {
                            record.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                line: o,
                                value: 20
                            });
                        }
                    }
                }
            }

            /* var parentKeys = Object.keys(parentArray);
            var parentLength = parentKeys.length;
            log.debug('parent array list', parentKeys);
            log.debug('parent array list length', parentLength);

            if (parentLength > 0) {
                for (var o = 0; o > parentLength; o++) {
                    var pcsTotal = 0;
                    var parentKey = parentKeys[o];
                    var parent_id = parentKey.substring(1); //remove the '_'
                    log.debug('DEBUG', o + ' parent parent_id:' + parent_id);

                    if (parent_id == parentKey.parent) {
                        pcsTotal += pcs;
                    }
                }
            } */
        }
    }
    return {
        beforeSubmit: beforeSubmit
    };
});