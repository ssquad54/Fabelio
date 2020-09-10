/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', 'N/search', 'N/format', 'N/error'], function(runtime, record, search, format, error) {
    function doValidation(args, argNames, methodName) {
        for (var i = 0; i < args.length; i++)
            if (!args[i] && args[i] !== 0)
                throw error.create({
                    name: 'MISSING_REQ_ARG',
                    message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
                });
    }

    function getData(context) {
        // doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'GET');
        doValidation([context.recordtype], ['recordtype'], 'GET');
        var recStr = [];

        if (context.recordtype == 'vendor') {
            try {
                var maxData = Number(context.recmax);
                if (!context.recmax || maxData < 1 || maxData > 100) {
                    maxData = 7;

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
                arrColumns.push('entityid');
                log.debug({
                    "title": "arrColumns",
                    "details": arrColumns
                });

                var arrFilters = [];
                log.debug({
                    "title": "arrFilters",
                    "details": arrFilters
                });

                var vendorList = search.create({
                    type: search.Type.VENDOR,
                    title: 'Vendor Saved Search',
                    id: 'customsearch_vendor_saved_search',
                    columns: arrColumns,
                    filters: arrFilters
                }).run().getRange(0, maxData);

                log.debug({
                    "title": "vendorList",
                    "details": vendorList
                });

                log.debug({
                    "title": "vendorList.length",
                    "details": vendorList.length
                });

                if (vendorList.length > 0) {
                    for (var i = 0; i < vendorList.length; i++) {
                        var recLoad = record.load({
                            type: context.recordtype,
                            id: vendorList[i].getValue('internalid')
                        });

                        recStr.push({
                            use_form: recLoad.getText('customform'),
                            subsidiary: recLoad.getText('subsidiary'),
                            vendor_id: recLoad.getValue('entityid'),
                            vendor_type: recLoad.getText('isperson'),
                            vendor_klas: recLoad.getText('custentity_ksi_klasifikasi_vendor'),
                            company_name: recLoad.getValue('companyname'),
                            vendor_firstname: recLoad.getValue('firstname'),
                            vendor_middlename: recLoad.getValue('middlename'),
                            vendor_lastname: recLoad.getValue('lastname'),
                            vendor_phone: recLoad.getValue('phone'),
                            vendor_email: recLoad.getValue('email'),
                            vendor_nppkp: recLoad.getValue('custentity_ksi_nppkp'),
                            vendor_npwp: recLoad.getValue('vatregnumber')
                        });
                    }
                    //     };
                    // return vendorList;
                    // return recLoad;
                    return recStr;
                    //     }
                } else {
                    return 'no record';
                }
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
        } //
        else {
            return 'not in scope: recordtype';
        }
    }

    function postData(contextBody) {
        doValidation([contextBody.recordtype], ['recordtype'], 'POST');

        log.debug('After do validation');

        if (contextBody.recordtype == 'vendor') {

            var currPos = -999;
            var currVendor = '';
            var recStr = [];
            var contextData = contextBody.data;
            var countData = contextData.length;
            var recordId = [];

            log.debug("ContextData", contextData);

            for (var i = 0; i < countData; i++) {

                try {

                    var dataKey = contextData[i];
                    var flagPrc = '-';
                    var ksiVendID = '';
                    var isPerson = '';
                    var fullName = '';

                    for (var key in dataKey) {
                        // START HEADER LEVEL
                        var keyNotes = ['addressbook', 'contactroles', 'creditcards', 'currency', 'grouppricing', 'itempricing', 'submachine'];
                        if (keyNotes.indexOf(key) == -1 &&
                            dataKey.hasOwnProperty(key)) {
                            // First, FIND EXISTING DATA, IF FOUND-UPDATE, ELSE-CREATE, USE MemberID as RECORD_ID FROM BO-DB
                            if (key == 'vendorid') {
                                ksiVendID = dataKey[key].trim();
                                currVendor = ksiVendID;
                                var objSearch = search.create({
                                    type: search.Type.VENDOR,
                                    filters: ["entityid", search.Operator.IS, dataKey[key].trim()],
                                    columns: [search.createColumn({
                                        name: "entityid",
                                        sort: search.Sort.ASC
                                    }), search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC
                                    }), "companyname"]
                                }).run().getRange(0, 1000);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Vendor " + dataCount,
                                    "details": objSearch
                                });

                                // IF exist 1 data, Load and update...
                                if (dataCount == 1) {
                                    flagPrc = 'u';
                                    var currID = objSearch[0].getValue({
                                        name: "internalid"
                                    });
                                    var objRecord = record.load({
                                        type: contextBody.recordtype, //   vendor
                                        id: currID,
                                        isDynamic: true
                                    });
                                } // // IF more than 1 record... Report as Duplicate...
                                else if (dataCount > 1) {
                                    flagPrc = 'e';
                                    recStr.push({
                                        "type": "error.SuiteScriptError",
                                        "title": "Record Duplicated! VendorID: " + objSearch[0].getValue('entityid') + ".",
                                        "status": "Error",
                                        "o: errorCode": " "
                                    });
                                    break;
                                }
                                // IF not exist, Create record...
                                else {
                                    flagPrc = 'i';
                                    var objRecord = record.create({
                                        type: contextBody.recordtype, //   vendor
                                        isDynamic: true
                                    });

                                    objRecord.setValue({
                                        fieldId: 'customform',
                                        value: '5', // hardcoded to: 5 -	KSI Vendor Form - Sandbox
                                        ignoreFieldChange: true
                                    });
                                }
                            } //
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
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'payablesaccount') {
                                var objSearch = search.create({
                                    type: search.Type.ACCOUNT,
                                    filters: ["number".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        }), "name", "name",
                                        "isinactive"
                                    ]
                                }).run().getRange(0, 10);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Payables Account " + dataCount,
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
                                    fieldId: 'payablesaccount',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'klasifikasiVendor') {
                                var objSearch = search.create({
                                    type: 'customlist_ksi_klasifikasi_vendor',
                                    filters: ["name".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC
                                    }), "name", "isinactive"]
                                }).run().getRange(0, 2);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Klasifikasi Vendor " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    var objID = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } //
                                else {
                                    var objID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }

                                objRecord.setValue({
                                    fieldId: 'custentity_ksi_klasifikasi_vendor',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } // -- //
                            else if (key == 'namaBank' && dataKey[key] != "") {
                                var objSearch = search.create({
                                    type: 'customlist_ksi_list_bank',
                                    filters: ["name".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC
                                    }), "name", "isinactive"]
                                }).run().getRange(0, 2);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Nama Bank " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    var objID = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } //
                                else {
                                    var objID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }

                                objRecord.setValue({
                                    fieldId: 'custentity_ksi_nama_bank',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } // -- //
                            else if (key == 'terms') {
                                var objSearch = search.create({
                                    type: search.Type.TERM,
                                    filters: ["name".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        }), "name", "name",
                                        "isinactive"
                                    ]
                                }).run().getRange(0, 2);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Terms " + dataCount,
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
                                    fieldId: 'terms',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'nppkp') {
                                objRecord.setValue({
                                    fieldId: 'custentity_ksi_nppkp',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'noNpwp') {
                                objRecord.setValue({
                                    fieldId: 'vatregnumber',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'noKtp') {
                                objRecord.setValue({
                                    fieldId: 'custentity_ksi_ktp',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'noRekening') {
                                objRecord.setValue({
                                    fieldId: 'accountnumber',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //
                            else if (key == 'isperson') {
                                isPerson = dataKey[key];
                                objRecord.setValue({
                                    fieldId: key,
                                    value: dataKey[key],
                                    ignoreFieldChange: false
                                });
                            } //
                            else {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });

                                /*        if (isPerson == 'T') {
                                            if (key == 'firstname') {
                                                fullName += ' ' + ((dataKey[key] + ' ').substr(0, 1).toUpperCase() + (dataKey[key] + ' ').substr(1, 200).toLowerCase()).trim();
                                                fullName = fullName.trim();
                                                log.debug({
                                                    "title": "Check: fullName",
                                                    "details": fullName
                                                });
                                            }
                                            if (key == 'middlename') {
                                                fullName += ' ' + ((dataKey[key] + ' ').substr(0, 1).toUpperCase() + (dataKey[key] + ' ').substr(1, 200).toLowerCase()).trim();
                                                fullName = fullName.trim();
                                                log.debug({
                                                    "title": "Check: fullName",
                                                    "details": fullName
                                                });
                                            }
                                            if (key == 'lastname') {
                                                fullName += ' ' + ((dataKey[key] + ' ').substr(0, 1).toUpperCase() + (dataKey[key] + ' ').substr(1, 200).toLowerCase()).trim();
                                                fullName = fullName.trim();
                                                log.debug({
                                                    "title": "Check: fullName",
                                                    "details": fullName
                                                });
                                            }
                                        } //
                                        else if (isPerson == 'F') {
                                            if (key == 'companyname') {
                                                fullName += ' ' + dataKey[key].trim();
                                                fullName = fullName.trim();
                                                log.debug({
                                                    "title": "Check: fullName",
                                                    "details": fullName
                                                });
                                            }
                                        } */
                            }
                        } else if (key == 'addressbook' &&
                            dataKey.hasOwnProperty(key)) {
                            var arrKeys = dataKey.addressbook;
                            var lineNumber;
                            log.debug({
                                "title": "arrKeys: " + key,
                                "details": arrKeys
                            });

                            for (var j = 0; j < arrKeys.length; j++) {
                                var dataKey2 = arrKeys[j];
                                var key2Notes = ['attention', 'addr1', 'addr2', 'addr3', 'addrphone', 'city', 'state', 'zip', 'override', 'addrtext'];

                                if (flagPrc == 'u') {
                                    for (var key2 in dataKey2) {
                                        if (dataKey2.hasOwnProperty(key2)) {
                                            if (key2 == 'label') {
                                                lineNumber = objRecord.findSublistLineWithValue({
                                                    sublistId: key,
                                                    fieldId: key2,
                                                    value: dataKey2[key2]
                                                });
                                                log.debug({
                                                    "title": key + ' ' + key2 + ' ' + arrKeys[key2] + " sublistNumber",
                                                    "details": lineNumber
                                                });
                                                if (lineNumber >= 0) {
                                                    var setLine = objRecord.selectLine({
                                                        sublistId: key,
                                                        line: lineNumber
                                                    });
                                                    var subAddr = objRecord.getCurrentSublistSubrecord({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'addressbookaddress'
                                                    });
                                                    log.debug({
                                                        "title": "Check IF Exist: Vendor-AddressBookAddress-subAddr",
                                                        "details": subAddr
                                                    });
                                                } //
                                                else {
                                                    objRecord.selectNewLine({
                                                        sublistId: key
                                                    });
                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: key,
                                                        fieldId: key2,
                                                        value: dataKey2[key2],
                                                        ignoreFieldChange: true
                                                    });

                                                    var subAddr = objRecord.getCurrentSublistSubrecord({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'addressbookaddress'
                                                    });
                                                    subAddr.setValue({
                                                        fieldId: 'override',
                                                        value: true,
                                                        ignoreFieldChange: true
                                                    });
                                                }
                                            } //
                                            else if (key2Notes.indexOf(key2) >= 0) {
                                                subAddr.setValue({
                                                    fieldId: key2,
                                                    value: dataKey2[key2],
                                                    ignoreFieldChange: true
                                                });
                                            } // 
                                            else {
                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: key2,
                                                    value: dataKey2[key2],
                                                    ignoreFieldChange: true
                                                });
                                            }
                                        }
                                    }

                                } //
                                else if (flagPrc == 'i') {
                                    for (var key2 in dataKey2) {
                                        if (dataKey2.hasOwnProperty(key2)) {
                                            objRecord.selectNewLine({
                                                sublistId: key
                                            });

                                            var subAddr = objRecord.getCurrentSublistSubrecord({
                                                sublistId: 'addressbook',
                                                fieldId: 'addressbookaddress'
                                            });
                                            subAddr.setValue({
                                                fieldId: 'override',
                                                value: true,
                                                ignoreFieldChange: true
                                            });

                                            if (key2 == 'label') {
                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: key2,
                                                    value: dataKey2[key2],
                                                    ignoreFieldChange: true
                                                });
                                            } //
                                            else if (key2Notes.indexOf(key2) >= 0) {
                                                subAddr.setValue({
                                                    fieldId: key2,
                                                    value: dataKey2[key2],
                                                    ignoreFieldChange: true
                                                });
                                            } //
                                            else {
                                                objRecord.setCurrentSublistValue({
                                                    sublistId: key,
                                                    fieldId: key2,
                                                    value: dataKey2[key2],
                                                    ignoreFieldChange: true
                                                });
                                            }
                                        }
                                    }
                                } //
                                else { // flagPrc is '-' or flagPrc is 'e' or anyelse
                                    break;
                                }

                                objRecord.commitLine({
                                    sublistId: key
                                });
                            }
                        }

                        objRecord.setValue({
                            fieldId: 'autoname',
                            value: false,
                            ignoreFieldChange: true
                        });

                        objRecord.setValue({
                            fieldId: 'entityid',
                            value: currVendor.toUpperCase(),
                            ignoreFieldChange: true
                        });

                        /*    if (isPerson != '') {
                                objRecord.setValue({
                                    fieldId: 'autoname',
                                    value: false,
                                    ignoreFieldChange: true
                                });
     
                                if (dataKey == 'vendorid') {
                                    objRecord.setValue({
                                        fieldId: 'entityid',
                                        value: dataKey[key].toUpperCase(),
                                        ignoreFieldChange: true
                                    });
                                }
                            }*/
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
                            type: contextBody.recordtype,
                            id: recordId[i]
                        });

                        if (flagPrc == 'u') {
                            recStr.push({
                                "type": "success.SuiteScriptSuccess",
                                "title": "Record Successfully Updated! VendorID: " + recLoad.getValue('entityid') + ".",
                                "status": "Success",
                                "o:errorCode": " "
                            });
                        } //
                        else if (flagPrc == 'i') {
                            recStr.push({
                                "type": "success.SuiteScriptSuccess",
                                "title": "Record Successfully Inserted! VendorID: " + recLoad.getValue('entityid') + ".",
                                "status": "Success",
                                "o:errorCode": ""
                            });
                        }
                    }

                    log.debug({
                        "title": "recStr",
                        "details": recStr
                    });

                    log.debug({
                        "title": "Remaining governance units: iter#" + i,
                        "details": runtime.getCurrentScript().getRemainingUsage()
                    });

                    return recStr;
                } catch (e) {
                    var err = {
                        //        'iter#': currPos,
                        //    "vendor_id": currVendor,
                        "type": e.type,
                        "title": e.message,
                        "status": e.stack,
                        "o:errorCode": e.name

                        /*   "detail": {
                               "message": "Process was stopped on data:[" + currPos + "]",
                               "error": e
                           } */
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
            }
        } //--//
        else {
            return 'not in scope: recordtype';
        }
    }

    return {
        'get': getData,
        // put : doPut,
        post: postData
            // ,'delete': doDelete
    };

});