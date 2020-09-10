/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/format', 'N/error'], function(record, search, format, error) {
    /**
     * @param {record} record
     * @param {search} search
     * @param {format} format
     * @param {error} error
     */
    function doValidation(args, argNames, methodName) {
        log.debug("Validation", "args=" + JSON.stringify(args) + ' | argNames=' + JSON.stringify(argNames) + ' | methodName=' + methodName);
        for (var i = 0; i < args.length; i++)
            if (!args[i] && args[i] !== 0)
                throw error.create({
                    name: 'MISSING_REQ_ARG',
                    message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
                });
    }

    function getData(context) {
        doValidation([context.recordtype], ['recordtype'], 'GET');

        var recStr = [];

        if (context.recordtype == 'journalentry') {
            try {
                var maxData = Number(context.recmax);
                if (!context.recmax || maxData < 1 || maxData > 1000) {
                    maxData = 100;
                }

                var arrColumns = ['internalid', 'tranid', 'trandate'];
                if ((context.sort && (context.sort != '' || null != context.sort)) &&
                    (context.sort.toUpperCase() == 'DESC')) {
                    arrColumns.push(search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }));
                } else {
                    arrColumns.push(search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.ASC
                    }));
                }
                arrColumns.push('tranid');
                log.debug({
                    "title": "arrColumns",
                    "details": arrColumns
                });

                var arrFilters = [];
                log.debug({
                    "title": "arrFilters",
                    "details": arrFilters
                });

                var myJournalList = search.create({
                    type: search.Type.JOURNAL_ENTRY,
                    title: 'KSI Journal Entry SavedSearch',
                    id: 'Customsearch_ksi_journal_entry',
                    columns: arrColumns,
                    filters: arrFilters,
                }).run().getRange(0, maxData);

                log.debug({
                    "title": "myJournalList",
                    "details": myJournalList
                });

                log.debug({
                    "title": "myJournalList.length",
                    "details": myJournalList.length
                });

                if (myJournalList.length > 0) {
                    for (var i = 0; i < myJournalList.length; i++) {
                        var recLoad = record.load({
                            type: context.recordtype,
                            id: myJournalList[i].getValue('internalid')
                        });

                        log.debug({
                            "title": "recLoad",
                            "details": recLoad
                        });

                        //	for (var j = 0; j < lotNumberCount; j++) {
                        var accountInfo = recLoad.getSublistText({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });

                        log.debug("accountInfo", accountInfo);

                        recStr.push({
                            use_form: recLoad.getText('customform'),
                            tran_id: recLoad.getText('tranid'),
                            tran_date: recLoad.getText('trandate'),
                            tran_period: recLoad.getText('postingperiod'),
                            tran_sub: recLoad.getText('subsidiary'),
                            tran_memo: recLoad.getText('memo'),
                            tran_batch: recLoad.getText('custbody_ksi_batch_number'),
                            tran_created: recLoad.getText('custbody_ksi_created_by'),
                            tran_account: accountInfo,
                            tran_debit: recLoad.getSublistText('line', 'debit', i),
                            tran_credit: recLoad.getSublistText('line', 'credit', i),
                            tran_memo: recLoad.getSublistText('line', 'memo', i)
                        });
                        // }

                        log.debug('Test', recStr);
                    }
                    return recStr;
                } else {
                    return 'no record';
                }
            } catch (e) {
                log.error({
                    "title": "Error",
                    "details": e.toString()
                });
                try {
                    return 'Please try again... ' + e.toString();
                } catch (e) {
                    log.error({
                        "title": "Error",
                        "details": e.toString()
                    });
                }
            }
        } else {
            return 'not in scope: recordtype';
        }
    }

    function postData(journalEntry) {
        doValidation([journalEntry.recordtype], ['recordtype'], 'POST');

        log.debug("After do Validation");

        if (journalEntry.recordtype == 'journalentry') {

            try {
                var recStr = [];

                var objSearch = search.create({
                    type: search.Type.JOURNAL_ENTRY,
                    filters: ["custbody_ksi_batch_number", search.Operator.IS, "77".trim()],
                    columns: [search.createColumn({
                        name: "custbody_ksi_batch_number",
                        sort: search.Sort.ASC
                    }), search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC
                    }), "tranid"]
                }).run().getRange(0, 1000);
                var dataCount = objSearch.length;

                log.debug({
                    "title": "Check IF Exist: Journal " + dataCount,
                    "details": objSearch
                });

                // IF exist 1 data, Load and update...
                /*   if (dataCount == 1) {
                       flagType = 'e';
                       var currID = objSearch[0].getValue({
                           name: "internalid"
                       });
                       var objRecord = record.load({
                           type: restletBody.recordtype, //   journal entry
                           id: currID,
                           isDynamic: true
                       });
                   } */
                // IF more than 1 record... Report as Duplicate...
                /*else*/
                if (dataCount == 1) {
                    flagPrc = 'e';
                    recStr.push({
                        'batch#': i,
                        Duplicate_on_RecordID: objSearch[0].getValue("custbody_ksi_batch_number")
                    });
                }
                // IF not exist, Create record...
                else if (dataCount < 1) {
                    flagPrc = 'i';
                    var objRecord = record.create({
                        type: journalEntry.recordtype,
                        isDynamic: true
                    });

                    log.debug("objRecord", objRecord);


                    var tranDate = "2/5/2020"
                    var subsidiary = "2";
                    var batchNumber = "77";
                    var memo = "Testing Script";
                    var createdBy = "Joe";


                    objRecord.setValue({
                        fieldId: 'customform',
                        value: 116,
                        ignoreFieldChange: true
                    });

                    /*      objRecord.setValue({
                              fieldId: 'trandate',
                              value: tranDate,
                              ignoreFieldChange: true
                          }); */

                    objRecord.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_ksi_batch_number',
                        value: batchNumber,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'memo',
                        value: memo,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_ksi_created_by',
                        value: createdBy,
                        ignoreFieldChange: true
                    });


                    var account = ["243", "54", "54", "54"];
                    // var account2 = "54";
                    var debit = ["300000", "", "", ""];
                    var credit = ["", "100000", "100000", "100000"];
                    var memo = ["Penjualan KSI", "Penjualan Mitra Bisnis", "Penjualan Mitra Grosir", "penjualan Mitra Sayur"];
                    var location = ["", "1", "2", "1"];
                    var custClass = ["", "3", "2", "1"];
                    //  var memo2 = "penjualan tunai";
                    var i;

                    for (var i = 0; i < account.length; i++) {
                        objRecord.selectNewLine({
                            sublistId: 'line'
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: account[i],
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: debit[i],
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: credit[i],
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: memo[i],
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: location[i],
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: custClass[i],
                            ignoreFieldChange: true
                        });

                        objRecord.commitLine({
                            sublistId: 'line'
                        });

                    };

                    /*      objRecord.selectNewLine({
                              sublistId: 'line'
                          });
      
                          objRecord.setCurrentSublistValue({
                              sublistId: 'line',
                              fieldId: 'account',
                              value: account2,
                              ignoreFieldChange: true
      
                          });
                          objRecord.setCurrentSublistValue({
                              sublistId: 'line',
                              fieldId: 'credit',
                              value: credit,
                              ignoreFieldChange: true
      
                          });
                          objRecord.setCurrentSublistValue({
                              sublistId: 'line',
                              fieldId: 'memo',
                              value: memo2,
                              ignoreFieldChange: true
                          });
      
                          objRecord.commitLine({
                              sublistId: 'line'
                          }); */

                    recordId = objRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });

                    log.debug("Success! Record ID: ", recordId);

                    recLoad = record.load({
                        type: journalEntry.recordtype,
                        id: recordId
                    });

                    log.debug("recLoad", recLoad);

                    var lineCount = recLoad.getLineCount({
                        sublistId: 'line'
                    });

                    log.debug("lineCount", lineCount);

                    if (lineCount > 0) {
                        for (var j = 0; j < lineCount; j++) {

                            recStr.push({
                                iternal_id: recLoad.getValue('internalid'),
                                use_form: recLoad.getText('customform'),
                                tran_id: recLoad.getText('tranid'),
                                tran_date: recLoad.getText('trandate'),
                                tran_period: recLoad.getText('postingperiod'),
                                tran_sub: recLoad.getText('subsidiary'),
                                tran_memo: recLoad.getText('memo'),
                                tran_batch: recLoad.getText('custbody_ksi_batch_number'),
                                tran_created: recLoad.getText('custbody_ksi_created_by'),
                                tran_account: recLoad.getSublistText('line', 'account', j),
                                tran_debit: recLoad.getSublistText('line', 'debit', j),
                                tran_credit: recLoad.getSublistText('line', 'credit', j),
                                tran_memo: recLoad.getSublistText('line', 'memo', j),
                                tran_loc: recLoad.getSublistText('line', 'location', j),
                                tran_class: recLoad.getSublistText('line', 'class', j)
                            });
                        };
                    };
                };

                log.debug("recStr", recStr);

                return recStr;
            } //
            catch (e) {
                log.error({
                    "title": "Error",
                    "details": e.toString()
                });
                try {
                    return 'Please try again... ' + e.toString();
                } catch (e) {
                    log.error({
                        "title": "Error",
                        "details": e.toString()
                    });
                    return e.toString();
                }
            }
        } //--//
        else {
            return 'not in scope: recordtype';
        }
    }

    return {
        'get': getData,
        post: postData
    };

});