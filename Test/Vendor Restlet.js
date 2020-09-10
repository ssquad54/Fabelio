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

    function doGet(context) {
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
                            company_name: recLoad.getValue('companyname'),
                            vendor_firstname: recLoad.getValue('firstname'),
                            vendor_middlename: recLoad.getValue('middlename'),
                            vendor_lastname: recLoad.getValue('lastname'),
                            vendor_altname: recLoad.getValue('altname'),
                            vendor_klasifikasi: recLoad.getValue('custentity_ksi_klasifikasi_vendor'),
                            vendor_address: recLoad.getValue('defaultaddress'),
                            vendor_phone: recLoad.getValue('phone'),
                            vendor_email: recLoad.getValue('email')
                        });
                    }

                    // return vendorList;
                    // return recLoad;
                    return recStr;
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

    function doPost(restletBody) {
        doValidation([restletBody.recordtype], ['recordtype'], 'POST');

        if (restletBody.recordtype == 'vendor') {
            try {
                var restletData = restletBody.data;
                var countData = restletData.length;
                var recordId = [];
                var recStr = [];

                for (var i = 0; i < countData; i++) {
                    var altName = '';
                    var objRecord = record.create({
                        type: restletBody.recordtype, //   vendor
                        isDynamic: true
                    });
                    var dataKey = restletData[i];

                    objRecord.setValue({
                        fieldId: 'customform',
                        value: '5' //   hardcoded to: 5 (TS - Vendor Form)
                    });

                    for (var key in dataKey) {
                        if (dataKey.hasOwnProperty(key)) //
                        {
                            //   this IF only for key in Header level !
                            if (key == 'orgUnit') {
                                var mySubSearch = search.create({
                                    type: search.Type.SUBSIDIARY,
                                    title: 'Subsidiary SavedSearch',
                                    id: 'customsearch_sub_search',
                                    columns: [search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC
                                    }), "namenohierarchy"],
                                    filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataKey[key].toUpperCase()]
                                }).run().getRange(0, 1);

                                if (mySubSearch.length == 1) {
                                    var subID = format.parse({
                                        value: mySubSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } //
                                else {
                                    var subID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }

                                objRecord.setValue({
                                    fieldId: 'subsidiary',
                                    value: subID,
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else if (key == 'vendorID') {
                                objRecord.setValue({
                                    fieldId: 'autoname',
                                    value: false,
                                    ignoreFieldChange: true
                                });
                                objRecord.setValue({
                                    fieldId: 'entityid',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                                objRecord.setValue({
                                    fieldId: 'custentity_ksi_klasifikasi_vendor',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else if (key == 'isPerson') {
                                objRecord.setValue({
                                    fieldId: 'isperson',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else if (key == 'vendorFirstName') {
                                objRecord.setValue({
                                    fieldId: 'firstname',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                                altName += ((dataKey[key]).substr(0, 1).toUpperCase() + (dataKey[key]).substr(1, 200).toLowerCase()).trim();
                                log.debug({
                                    "title": "altName",
                                    "details": altName
                                });
                            } //--//
                            else if (key == 'vendorMiddleName') {
                                objRecord.setValue({
                                    fieldId: 'middlename',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                                altName += ' ' + ((dataKey[key]).substr(0, 1).toUpperCase()).trim();
                                log.debug({
                                    "title": "altName",
                                    "details": altName
                                });
                            } //--//
                            else if (key == 'vendorLastName') {
                                objRecord.setValue({
                                    fieldId: 'lastname',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                                altName += ' ' + ((dataKey[key]).substr(0, 1).toUpperCase() + (dataKey[key]).substr(1, 200).toLowerCase()).trim();
                                log.debug({
                                    "title": "altName",
                                    "details": altName
                                });

                                log.debug({
                                    "title": "altName",
                                    "details": altName
                                });
                                objRecord.setValue({
                                    fieldId: 'altname',
                                    value: altName.replace(/\s+/gi, ' ')
                                });
                            } //--//
                            else if (key == 'vendorEmail') {
                                objRecord.setValue({
                                    fieldId: 'email',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else if (key == 'vendorPhone') {
                                objRecord.setValue({
                                    fieldId: 'phone',
                                    value: dataKey[key].trim(),
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: dataKey[key]
                                });
                            }
                        } //--//
                    }

                    recordId[i] = objRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });
                    log.debug({
                        "title": "[Success] recordId: " + i,
                        "details": recordId
                    });

                    recLoad = record.load({
                        type: restletBody.recordtype,
                        id: recordId[i]
                    });

                    recStr.push({
                        use_form: recLoad.getText('customform'),
                        subsidiary: recLoad.getText('subsidiary'),
                        vendor_id: recLoad.getValue('entityid'),
                        vendor_type: recLoad.getValue('isperson'),
                        company_name: recLoad.getValue('companyname'),
                        vendor_firstname: recLoad.getValue('firstname'),
                        vendor_middlename: recLoad.getValue('middlename'),
                        vendor_lastname: recLoad.getValue('lastname'),
                        vendor_altname: recLoad.getValue('altname'),
                        vendor_phone: recLoad.getValue('phone'),
                        vendor_email: recLoad.getValue('email')
                    });
                    log.debug({
                        "title": "recStr",
                        "details": recStr
                    });
                }

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
        'get': doGet,
        post: doPost
    };

});