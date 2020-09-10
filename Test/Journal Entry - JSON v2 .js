/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/format', 'N/error', 'N/http'], function(record, search, format, error, http) {
    /**
     * @param {record} record
     * @param {search} search
     * @param {format} format
     * @param {error} error
     * @param {http} http
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

                var arrColumns = [];
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
                arrColumns.push(search.createColumn({
                    name: 'tranid',
                }));
                log.debug({
                    "title": "arrColumns",
                    "details": arrColumns
                });

                var arrFilters = [];
                arrFilters.push(search.createFilter({
                    name: 'mainline',
                    operator: search.Operator.IS,
                    values: 'T'
                }));
                arrFilters.push(search.createFilter({
                    name: 'memorized',
                    operator: search.Operator.IS,
                    values: 'F'
                }));

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

                        recStr.push({
                            use_form: recLoad.getText('customform'),
                            tran_id: recLoad.getText('tranid'),
                            tran_date: recLoad.getText('trandate'),
                            tran_period: recLoad.getText('postingperiod'),
                            tran_sub: recLoad.getText('subsidiary'),
                            tran_memo: recLoad.getText('memo'),
                            tran_batch: recLoad.getText('custbody_ksi_batch_number'),
                            tran_created: recLoad.getText('custbody_ksi_created_by')
                        });
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

    function postData(restletBody) {
        doValidation([restletBody.recordtype], ['recordtype'], 'POST');

        log.debug("After do Validation");

        if (restletBody.recordtype == 'journalentry') {
            try {
                var restletData = restletBody.data;
                var countData = restletData.length;
                var locID;
                var recordId = [];
                var recStr = [];

                for (var i = 0; i < countData; i++) {
                    currPos = i;
                    var dataKey = restletData[i];
                    var flagPrc = '-';
                    var ksiBatchNumb = '';

                    for (var key in dataKey) {
                        // START HEADER LEVEL
                        if ((key != 'line') && dataKey.hasOwnProperty(key)) {
                            if (key == 'batchNumber') {
                                ksiBatchNumb = dataKey[key].trim();
                                currBatch = ksiBatchNumb;
                                var objSearch = search.create({
                                    type: search.Type.JOURNAL_ENTRY,
                                    filters: ["custbody_ksi_batch_number", search.Operator.IS, dataKey[key].trim()],
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
                                    "title": "Check IF Exist: Batch Number " + dataCount,
                                    "details": objSearch
                                });

                                // IF more than or equal to 1 record ... Report Duplicate ...
                                if (dataCount >= 1) {
                                    flagPrc = 'e';
                                    recStr.push({
                                        "type": "error.SuiteScriptError",
                                        "title": "Record Duplicated! Batch Number: " + objSearch[0].getValue('custbody_ksi_batch_number') + ".",
                                        "status": "Error",
                                        "o: errorCode": " "
                                    });
                                    return recStr;
                                }
                                // IF not exist, Create record...
                                else {
                                    flagPrc = 'i';
                                    var objRecord = record.create({
                                        type: restletBody.recordtype, // Journal Entry
                                        isDynamic: true
                                    });

                                    objRecord.setValue({
                                        fieldId: 'customform',
                                        value: 116, // Hardcode to 116: KSI Journal Entry
                                        ignoreFieldChange: true
                                    });

                                    objRecord.setValue({
                                        fieldId: 'custbody_ksi_batch_number',
                                        value: currBatch,
                                        ignoreFieldChange: true
                                    });
                                }
                            } //--//
                            else if (key == 'subsidiary') {
                                var objSearch = search.create({
                                    type: search.Type.SUBSIDIARY,
                                    filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        }), "name", "namenohierarchy", "legalname",
                                        "isinactive"
                                    ]
                                }).run().getRange(0, 10);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Subsidiary " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    var objID = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } else {
                                    var objID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }
                                objRecord.setValue({
                                    fieldId: 'subsidiary',
                                    value: objID,
                                    ignoreFieldChange: false
                                });
                            } //--//
                            else if (key == 'trandate') {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: format.parse({
                                        value: new Date(dataKey[key]),
                                        type: format.Type.DATE
                                    })
                                });
                            } //--//
                            else if (key == 'createdBy') {
                                objRecord.setValue({
                                    fieldId: 'custbody_ksi_created_by',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: dataKey[key],
                                    ignoreFieldChange: false
                                });
                            }
                        } else if (key == 'line' && dataKey.hasOwnProperty(key)) {
                            var arrKeys = dataKey.line;

                            log.debug({
                                "title": "arrKeys: " + key,
                                "details": arrKeys
                            });

                            for (var j = 0; j < arrKeys.length; j++) {
                                var dataLineKey = arrKeys[j];
                                //    var lineKey2 = ['account', 'debit', 'credit', 'memo', 'location', 'custSegment'];

                                if (flagPrc == 'i') {
                                    for (var key2 in dataLineKey) {
                                        if (dataLineKey.hasOwnProperty(key2)) {
                                            objRecord.selectNewLine({
                                                sublistId: key
                                            });

                                            if (key2 == 'account') {
                                                var myAccountSearch = search.create({
                                                    type: search.Type.ACCOUNT,
                                                    title: 'my Account SavedSearch',
                                                    id: 'customsearch_my_account_search',
                                                    columns: [search.createColumn({
                                                        name: "internalid",
                                                        sort: search.Sort.ASC
                                                    }), "name", "type"],
                                                    filters: ["number".toUpperCase(), search.Operator.CONTAINS, dataLineKey[key2].toUpperCase()]
                                                }).run().getRange(0, 1);

                                                log.debug("accountsearch", myAccountSearch);

                                                if (myAccountSearch.length == 1) {
                                                    var accountID = format.parse({
                                                        value: myAccountSearch[0].getValue({
                                                            name: "internalid"
                                                        }),
                                                        type: format.Type.TEXT
                                                    });
                                                } //
                                                else {
                                                    var accountID = format.parse({
                                                        value: -1,
                                                        type: format.Type.TEXT
                                                    });
                                                }

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: 'account',
                                                    value: accountID,
                                                    ignoreFieldChange: true
                                                });
                                            } else if (key2 == 'location' && dataLineKey[key2] != "") {
                                                var myLocSearch = search.create({
                                                    type: search.Type.LOCATION,
                                                    title: 'my Location SavedSearch',
                                                    id: 'customsearch_my_location_search',
                                                    columns: [search.createColumn({
                                                        name: "internalid",
                                                        sort: search.Sort.ASC
                                                    }), "namenohierarchy"],
                                                    filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataLineKey[key2].toUpperCase()]
                                                }).run().getRange(0, 1);

                                                log.debug({
                                                    "title": "myLocSearch",
                                                    "details": myLocSearch
                                                });

                                                if (myLocSearch.length == 1) {
                                                    var locationID = format.parse({
                                                        value: myLocSearch[0].getValue({
                                                            name: "internalid"
                                                        }),
                                                        type: format.Type.TEXT
                                                    });
                                                } //
                                                else {
                                                    var locationID = format.parse({
                                                        value: -1,
                                                        type: format.Type.TEXT
                                                    });
                                                }

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: 'location',
                                                    value: locationID,
                                                    ignoreFieldChange: true
                                                });
                                            } else if (key2 == 'custSegment' && dataLineKey[key2] != "") {
                                                var myClassSearch = search.create({
                                                    type: search.Type.CLASSIFICATION,
                                                    title: 'my Customer Segment SavedSearch',
                                                    id: 'customsearch_my_cust_segment_search',
                                                    columns: [search.createColumn({
                                                        name: "internalid",
                                                        sort: search.Sort.ASC
                                                    }), "namenohierarchy"],
                                                    filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataLineKey[key2].toUpperCase()]
                                                }).run().getRange(0, 1);

                                                log.debug({
                                                    "title": "myClassSearch",
                                                    "details": myClassSearch
                                                });

                                                if (myClassSearch.length == 1) {
                                                    var custSegmentID = format.parse({
                                                        value: myClassSearch[0].getValue({
                                                            name: "internalid"
                                                        }),
                                                        type: format.Type.TEXT
                                                    });
                                                } //
                                                else {
                                                    var custSegmentID = format.parse({
                                                        value: -1,
                                                        type: format.Type.TEXT
                                                    });
                                                }

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: 'class',
                                                    value: custSegmentID,
                                                    ignoreFieldChange: true
                                                });
                                            } else if (key2 == 'department' && dataLineKey[key2] != "") {
                                                var myDepartmentSearch = search.create({
                                                    type: search.Type.DEPARTMENT,
                                                    title: 'my Department SavedSearch',
                                                    id: 'customsearch_my_department_search',
                                                    columns: [search.createColumn({
                                                        name: "internalid",
                                                        sort: search.Sort.ASC
                                                    }), "name"],
                                                    filters: ["name".toUpperCase(), search.Operator.IS, dataLineKey[key2].toUpperCase()]
                                                }).run().getRange(0, 1);

                                                log.debug({
                                                    "title": "myDepartmentSearch",
                                                    "details": myDepartmentSearch
                                                });

                                                if (myDepartmentSearch.length == 1) {
                                                    var departmentID = format.parse({
                                                        value: myDepartmentSearch[0].getValue({
                                                            name: "internalid"
                                                        }),
                                                        type: format.Type.TEXT
                                                    });
                                                } //
                                                else {
                                                    var departmentID = format.parse({
                                                        value: -1,
                                                        type: format.Type.TEXT
                                                    });
                                                }

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: 'department',
                                                    value: departmentID,
                                                    ignoreFieldChange: true
                                                });
                                            }
                                            /*     else if (key2 == 'custSegment') {
                                                     objRecord.setCurrentSublistValue({
                                                         sublistId: key,
                                                         fieldId: key2,
                                                         value: dataLineKey[key2],
                                                         ignoreFieldChange: false
                                                     });
                                                 } */
                                            else {
                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: key2,
                                                    value: dataLineKey[key2],
                                                    ignoreFieldChange: false
                                                });
                                            }
                                        }
                                    }
                                } //
                                else { // flagPrc is '-' or flagPrc is 'e' or anyelse
                                    break;
                                }

                                objRecord.commitLine({
                                    sublistId: 'line'
                                });
                            }
                        }
                    }

                    if (flagPrc != '-' || flagPrc != 'e') {
                        recordId[i] = objRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });
                        log.debug({
                            "title": "[Success] recordId: iter#" + i,
                            "details": recordId
                        });

                        recLoad = record.load({
                            type: restletBody.recordtype,
                            id: recordId
                        });

                        log.debug("recLoad", recLoad);

                        recStr.push({
                            "type": "success.SuiteScriptSuccess",
                            "title": "Record Successfully Inserted! JournalID: " + recLoad.getValue('tranid') + ".",
                            "status": "Success",
                            "o: errorCode": ""
                        });
                    }

                    log.debug("recStr", recStr);
                }

                return recStr;
            } //
            catch (e) {
                var err = {
                    "type": e.type,
                    "title": e.message,
                    "status": e.stack,
                    "o:errorCode": e.name,
                };
                recStr.push(err);
                log.error({
                    "title": "Error",
                    "details": e.toString()
                });
                try {
                    return recStr; //  'Please try again... ' + e.toString();
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