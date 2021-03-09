/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/format', 'N/error'], function(record, search, format, error) {
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

                        /*      var addrCount = recLoad.getLineCount({
                          sublistId: 'addressbook'
                      }); 
 
                      log.debug("addrCount", addrCount); */

                        //                       if (addrCount > 0) {
                        //                            for (var j = 0; j < addrCount; j++) {
                        var vendorAddr = recLoad.getSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress',
                            line: 0
                        });

                        log.debug("vendorAddr", vendorAddr);

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
                            vendor_npwp: recLoad.getValue('vatregnumber'),
                            default_Address: recLoad.getValue('defaultaddress'),
                            default_Shipping: recLoad.getSublistValue('addressbook', 'defaultshipping', 0),
                            default_Billing: recLoad.getSublistValue('addressbook', 'defaultbilling', 0),
                            addr_country: vendorAddr.getValue('country'),
                            addr_attention: vendorAddr.getValue('attention'),
                            addr_addressee: vendorAddr.getValue('addressee'),
                            addr_phone: vendorAddr.getValue('addrphone'),
                            addr_1: vendorAddr.getValue('addr1'),
                            addr_2: vendorAddr.getValue('addr2'),
                            addr_city: vendorAddr.getValue('city'),
                            addr_state: vendorAddr.getValue('state'),
                            addr_zip: vendorAddr.getValue('zip')
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
            try {
                var flagPrc = '-';
                var recordId = [];
                var recStr = [];

                var vendorId = "Test Script";
                var formID = "5"; //      5 > KSI Vendor Form
                var subsidiary = "2"; //     1: Parent Company KSI 2: KSI 3: PH
                var isPerson = "T"; //      company type | F: Company | T: Individual
                var vendClass = "1"; //     1: Tengkulak 2: Reseller 3: Internal
                var companyName = "Test Script UP";
                var firstName = "Test";
                var middleName = "";
                var lastName = "Script";
                var phone = "0846 5343 7239";
                var email = "test.script.up@gmail.com";
                var nppkp = "232.4425.5522";
                var npwp = "00.345.678.9-012.345";

                if (isPerson == 'T') {
                    var vendorSearch = search.create({
                        type: search.Type.VENDOR,
                        title: 'KSI Vendor SavedSearch',
                        id: 'customsearch_ksi_vendor_search',
                        columns: [search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC
                        }), "companyname"],
                        filters: ["firstname".toUpperCase(), search.Operator.IS, firstName.toUpperCase(),
                            'AND', "lastname".toUpperCase(), search.Operator.IS, lastName.toUpperCase()
                        ]
                    }).run().getRange(0, 1);
                } //
                else if (isPerson == 'F') {
                    var vendorSearch = search.create({
                        type: search.Type.VENDOR,
                        title: 'KSI Vendor SavedSearch',
                        id: 'customsearch_ksi_vendor_search',
                        columns: [search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC
                        }), "companyname"],
                        filters: ["firstname".toUpperCase(), search.Operator.IS, companyName.toUpperCase()]
                    }).run().getRange(0, 1);
                }

                var dataCount = vendorSearch.length;

                log.debug("Check IF Exist: Vendor " + dataCount, vendorSearch);

                // IF exist 1 data, Load and update...
                if (dataCount == 1) {
                    flagPrc = 'u';
                    var vendID = vendorSearch[0].getValue({
                        name: "internalid"
                    });
                    var objRecord = record.load({
                        type: contextBody.recordtype, //   vendor
                        id: vendID,
                        isDynamic: true
                    });
                } //
                else if (dataCount > 1) {
                    flagPrc = 'e';
                    recStr.push({
                        Duplicate_on_RecordID: vendorSearch[0].getValue("entityid")
                    });
                }
                // IF not exist, Create record...
                else {
                    flagPrc = 'i';
                    var objRecord = record.create({
                        type: contextBody.recordtype, //   vendor
                        isDynamic: true
                    });
                }

                log.debug("objRecord", objRecord);

                objRecord.setValue({
                    fieldId: 'customform',
                    value: formID
                });

                objRecord.setValue({
                    fieldId: 'autoname',
                    value: false,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'custentity_ksi_klasifikasi_vendor',
                    value: vendClass,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'isperson',
                    value: isPerson,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'companyname',
                    value: companyName,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'firstname',
                    value: firstName,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'middlename',
                    value: middleName,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'lastname',
                    value: lastName,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'email',
                    value: email,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'phone',
                    value: phone,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'vatregnumber',
                    value: npwp,
                    ignoreFieldChange: true
                });

                objRecord.setValue({
                    fieldId: 'custentity_ksi_nppkp',
                    value: nppkp,
                    ignoreFieldChange: true
                });

                var addrAtt = "Test";
                var addrAddressee = "";
                var addrPhone = "0816 5532 7259";
                var addr1 = "Jalan Merdeka No.146";
                var addr2 = "Kalideres II";
                var addrCity = "Jakarta Barat";
                var addrState = "DKI Jakarta";
                var addrZip = "18569";

                if (flagPrc == 'u') {
                    lineNumber = objRecord.findSublistLineWithValue({
                        sublistId: 'addressbook',
                        fieldId: 'label',
                        value: addr1
                    });
                    log.debug({
                        "title": "Record " + addr1 + " sublistNumber",
                        "details": lineNumber
                    });
                    if (lineNumber >= 0) {
                        var setLine = objRecord.selectLine({
                            sublistId: 'addressbook',
                            line: lineNumber
                        });

                        log.debug("setLine", setLine);

                        var subAddr = objRecord.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });
                        log.debug({
                            "title": "Check IF Exist: Address Detail",
                            "details": subAddr
                        });
                    } //
                    else {
                        objRecord.selectNewLine({
                            sublistId: 'addressbook'
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'defaultbilling',
                            value: true,
                            ignoreFieldChange: true
                        });

                        objRecord.setCurrentSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'defaultshipping',
                            value: true,
                            ignoreFieldChange: true
                        });

                        var subAddr = objRecord.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });

                        log.debug("subAddr", subAddr);

                        subAddr.setValue({
                            fieldId: 'override',
                            value: true,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'override',
                            value: false,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'country',
                            value: "ID",
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'attention',
                            value: addrAtt,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'addressee',
                            value: addrAddressee,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'addrphone',
                            value: addrPhone,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'addr1',
                            value: addr1,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'addr2',
                            value: addr2,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'city',
                            value: addrCity,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'state',
                            value: addrState,
                            ignoreFieldChange: true
                        });

                        subAddr.setValue({
                            fieldId: 'zip',
                            value: addrZip,
                            ignoreFieldChange: true
                        });
                    }
                } //
                else if (flagPrc == 'i') {
                    objRecord.selectNewLine({
                        sublistId: 'addressbook'
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultbilling',
                        value: true,
                        ignoreFieldChange: true
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultshipping',
                        value: true,
                        ignoreFieldChange: true
                    });

                    var subAddr = objRecord.getCurrentSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress'
                    });

                    log.debug("subAddr", subAddr);

                    subAddr.setValue({
                        fieldId: 'override',
                        value: true,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'override',
                        value: false,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'country',
                        value: "ID",
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'attention',
                        value: addrAtt,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'addressee',
                        value: addrAddressee,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'addrphone',
                        value: addrPhone,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'addr1',
                        value: addr1,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'addr2',
                        value: addr2,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'city',
                        value: addrCity,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'state',
                        value: addrState,
                        ignoreFieldChange: true
                    });

                    subAddr.setValue({
                        fieldId: 'zip',
                        value: addrZip,
                        ignoreFieldChange: true
                    });
                } //
                else {
                    recStr.push({
                        Duplicate_on_RecordID: objSearch[0].getSublistValue('addressbook', 'address', 0)
                    });
                }

                objRecord.commitLine({
                    sublistId: 'addressbook'
                });

                recordId = objRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.debug("Success! Record ID: ", recordId);

                recLoad = record.load({
                    type: contextBody.recordtype,
                    id: recordId
                });

                log.debug("recLoad", recLoad);

                var vendorAddr = recLoad.getSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress',
                    line: 0
                });

                log.debug("vendorAddr", vendorAddr);

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
                    vendor_npwp: recLoad.getValue('vatregnumber'),
                    default_Address: recLoad.getValue('defaultaddress'),
                    default_Shipping: recLoad.getSublistValue('addressbook', 'defaultshipping', 0),
                    default_Billing: recLoad.getSublistValue('addressbook', 'defaultbilling', 0),
                    addr_country: vendorAddr.getValue('country'),
                    addr_attention: vendorAddr.getValue('attention'),
                    addr_addressee: vendorAddr.getValue('addressee'),
                    addr_phone: vendorAddr.getValue('addrphone'),
                    addr_1: vendorAddr.getValue('addr1'),
                    addr_2: vendorAddr.getValue('addr2'),
                    addr_city: vendorAddr.getValue('city'),
                    addr_state: vendorAddr.getValue('state'),
                    addr_zip: vendorAddr.getValue('zip')
                });

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