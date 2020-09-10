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

        if (context.recordtype == 'vendorbill') {
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

                var arrFilters = [
                    ['mainline', 'is', 'T'],
                    'AND', ['type', 'anyof', 'VendBill'],
                    'AND', ['memorized', 'is', 'F']
                ];
                log.debug({
                    "title": "arrFilters",
                    "details": arrFilters
                });

                var myVendBillList = search.create({
                    type: search.Type.TRANSACTION,
                    title: 'KSI Vendor Bill SavedSearch',
                    id: 'Customsearch_ksi_vendor_bill',
                    columns: arrColumns,
                    filters: arrFilters,
                }).run().getRange(0, maxData);

                log.debug({
                    "title": "myVenBillList",
                    "details": myVendBillList
                });

                log.debug({
                    "title": "myVendBillList.length",
                    "details": myVendBillList.length
                });

                if (myVendBillList.length > 0) {
                    for (var i = 0; i < myVendBillList.length; i++) {
                        var recLoad = record.load({
                            type: context.recordtype,
                            id: myVendBillList[i].getValue('internalid')
                        });

                        log.debug({
                            "title": "recLoad",
                            "details": recLoad
                        });

                        recStr.push({
                            use_form: recLoad.getText('customform'),
                            tran_no: recLoad.getValue('transactionnumber'),
                            doc_number: recLoad.getText('tranid'),
                            tran_date: recLoad.getValue('date'),
                            tran_sub: recLoad.getText('subsidiary'),
                            tran_acc: recLoad.getText('account'),
                            tran_term: recLoad.getText('terms'),
                            tran_memo: recLoad.getValue('memo'),
                            no_faktur_pajak: recLoad.getValue('custbody_ksi_faktur_pajak'),
                            tgl_faktur_pajak: recLoad.getValue('custbody_tgl_faktur_pajak'),
                            tran_created: recLoad.getText('custbody_ksi_created_by')
                        });

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

    function postData(restletBody) {
        doValidation([restletBody.recordtype], ['recordtype'], 'POST');

        log.debug("After do Validation");

        if (restletBody.recordtype == 'vendorbill') {
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
                    var noPenerimaan = '';
                    var vendorID = '';
                    var locationID = '';

                    for (var key in dataKey) {
                        // START HEADER LEVEL
                        if ((key != 'item' && key != 'expense') && dataKey.hasOwnProperty(key)) {
                            if (key == 'noPenerimaan') {
                                noPenerimaan = dataKey[key].trim();
                                var objSearch = search.create({
                                    type: search.Type.VENDOR_BILL,
                                    filters: ["custbody_ksi_no_penerimaan_barang", search.Operator.IS, dataKey[key].trim()],
                                    columns: [search.createColumn({
                                        name: "custbody_ksi_no_penerimaan_barang",
                                        sort: search.Sort.ASC
                                    }), search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC
                                    }), "tranid"]
                                }).run().getRange(0, 1000);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Vendor Bill " + dataCount,
                                    "details": objSearch
                                });

                                // IF more than or equal to 1 record ... Report Duplicate ...
                                if (dataCount >= 1) {
                                    flagPrc = 'e';
                                    recStr.push({
                                        "type": "error.SuiteScriptError",
                                        "title": "Record Duplicated! No Penerimaan: " + objSearch[0].getValue('custbody_ksi_no_penerimaan_barang') + ".",
                                        "status": "Error",
                                        "o: errorCode": " "
                                    });
                                    return recStr;
                                }
                                // IF not exist, Create record...
                                else {
                                    flagPrc = 'i';
                                    var objRecord = record.create({
                                        type: restletBody.recordtype, // Vendor Bill
                                        isDynamic: true
                                    });

                                    objRecord.setValue({
                                        fieldId: 'customform',
                                        value: 110, // Hardcode to 110 - KSI Vendor Bill
                                        ignoreFieldChange: true
                                    });

                                    objRecord.setValue({
                                        fieldId: 'custbody_ksi_no_penerimaan_barang',
                                        value: noPenerimaan,
                                        ignoreFieldChange: true
                                    });
                                }
                            } //--//
                            else if (key == 'vendorID') {
                                var objSearch = search.create({
                                    type: search.Type.VENDOR,
                                    filters: ["entityid".toUpperCase(), search.Operator.IS, dataKey[key].trim().toUpperCase(),
                                        'AND', "isinactive", search.Operator.IS, 'F'
                                    ],
                                    columns: [search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        }), "internalid", "entityid", "companyname",
                                        "isinactive"
                                    ]
                                }).run().getRange(0, 10);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Vendor " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    vendorID = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } else {
                                    vendorID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }
                                objRecord.setValue({
                                    fieldId: 'entity',
                                    value: vendorID,
                                    ignoreFieldChange: false
                                });
                            } //--//
                            /*        else if (key == 'subsidiary') {
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
                                    } //--// */
                            else if (key == 'account') {
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
                                    "title": "Check IF Exist: Account " + dataCount,
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
                                    fieldId: 'account',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } //--//
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
                                }).run().getRange(0, 10);
                                var dataCount = objSearch.length;

                                log.debug({
                                    "title": "Check IF Exist: Terms " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    var termID = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } else {
                                    var termID = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }
                                objRecord.setValue({
                                    fieldId: 'terms',
                                    value: termID,
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else if (key == 'POtype') {
                                var objSearch = search.create({
                                    type: 'customlist_ksi_po_type',
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
                                    "title": "Check IF Exist: PO Type " + dataCount,
                                    "details": objSearch
                                });

                                if (dataCount == 1) {
                                    var poType = format.parse({
                                        value: objSearch[0].getValue({
                                            name: "internalid"
                                        }),
                                        type: format.Type.TEXT
                                    });
                                } //
                                else {
                                    var poType = format.parse({
                                        value: -1,
                                        type: format.Type.TEXT
                                    });
                                }

                                objRecord.setValue({
                                    fieldId: 'custbody_ksi_po_type',
                                    value: poType,
                                    ignoreFieldChange: true
                                });
                            } // -- //
                            else if (key == 'klasifikasiPO') {
                                var objSearch = search.create({
                                    type: 'customlist_ksi_klasifikasi_po',
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
                                    "title": "Check IF Exist: Klasifikasi PO " + dataCount,
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
                                    fieldId: 'custbody_ksi_klasifikasi_po',
                                    value: objID,
                                    ignoreFieldChange: true
                                });
                            } // -- //
                            else if (key == 'trandate') {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: format.parse({
                                        value: new Date(dataKey[key]),
                                        type: format.Type.DATE
                                    })
                                });
                            } //--//
                            else if (key == 'tglFakturPajak') {
                                objRecord.setValue({
                                    fieldId: 'custbody_tgl_faktur_pajak',
                                    value: format.parse({
                                        value: new Date(dataKey[key]),
                                        type: format.Type.DATE
                                    })
                                });
                            } //--//
                            else if (key == 'noFakturPajak') {
                                objRecord.setValue({
                                    fieldId: 'custbody_ksi_faktur_pajak',
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //--//
                            else {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: dataKey[key],
                                    ignoreFieldChange: true
                                });
                            } //--//
                        } // if Expense - Start Expense Sublist
                        else if (key == 'expense' && dataKey.hasOwnProperty(key)) {
                            var arrKeys = dataKey[key];

                            log.debug({
                                "title": "arrKeys: " + key,
                                "details": arrKeys
                            });

                            for (var j = 0; j < arrKeys.length; j++) {
                                var dataExpenseKey = arrKeys[j];


                                for (var key2 in dataExpenseKey) {
                                    if (dataExpenseKey.hasOwnProperty(key2)) {
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
                                                filters: ["number".toUpperCase(), search.Operator.CONTAINS, dataExpenseKey[key2].toUpperCase()]
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
                                        } //--//
                                        else if (key2 == 'taxcode') {
                                            var myTaxSearch = search.create({
                                                type: search.Type.SALES_TAX_ITEM,
                                                title: 'My Tax-item SavedSearch',
                                                id: 'customsearch_my_tax_search',
                                                columns: [search.createColumn({
                                                    name: "internalid",
                                                    sort: search.Sort.ASC
                                                }), "name", "rate"],
                                                filters: ["name".toUpperCase(), search.Operator.IS, dataExpenseKey[key2].toUpperCase()]
                                            }).run().getRange(0, 1);

                                            log.debug({
                                                "title": "Check IF Exist: Tax Code " + dataCount,
                                                "details": objSearch
                                            });

                                            if (myTaxSearch.length == 1) {
                                                var taxID = format.parse({
                                                    value: myTaxSearch[0].getValue({
                                                        name: "internalid"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                                var taxRate = format.parse({
                                                    value: myTaxSearch[0].getValue({
                                                        name: "rate"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                            } //
                                            else {
                                                var taxID = format.parse({
                                                    value: -1,
                                                    type: format.Type.TEXT
                                                });
                                                var taxRate = null;
                                            }

                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: 'taxcode',
                                                value: taxID,
                                                ignoreFieldChange: true
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: 'taxrate1',
                                                value: (parseFloat(taxRate)).toFixed(2),
                                                ignoreFieldChange: true
                                            });
                                        } //--//
                                        else if (key2 == 'location') {
                                            var myLocSearch = search.create({
                                                type: search.Type.LOCATION,
                                                title: 'my Location SavedSearch',
                                                id: 'customsearch_my_location_search',
                                                columns: [search.createColumn({
                                                    name: "internalid",
                                                    sort: search.Sort.ASC
                                                }), "namenohierarchy"],
                                                filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataExpenseKey[key2].toUpperCase()]
                                            }).run().getRange(0, 1);

                                            log.debug({
                                                "title": "myLocSearch",
                                                "details": myLocSearch
                                            });

                                            if (myLocSearch.length == 1) {
                                                locationID = format.parse({
                                                    value: myLocSearch[0].getValue({
                                                        name: "internalid"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                            } //
                                            else {
                                                locationID = format.parse({
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
                                        } //--//
                                        /*            else if (key2 == 'custSegment' && dataExpenseKey[key2] != "") {
                                                        var myClassSearch = search.create({
                                                            type: search.Type.CLASSIFICATION,
                                                            title: 'my Customer Segment SavedSearch',
                                                            id: 'customsearch_my_cust_segment_search',
                                                            columns: [search.createColumn({
                                                                name: "internalid",
                                                                sort: search.Sort.ASC
                                                            }), "namenohierarchy"],
                                                            filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataExpenseKey[key2].toUpperCase()]
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
                                                    } //--// */
                                        /*              else if (key2 == 'department' && dataExpenseKey[key2] != "") {
                                                          var myDepartmentSearch = search.create({
                                                              type: search.Type.DEPARTMENT,
                                                              title: 'my Department SavedSearch',
                                                              id: 'customsearch_my_department_search',
                                                              columns: [search.createColumn({
                                                                  name: "internalid",
                                                                  sort: search.Sort.ASC
                                                              }), "name"],
                                                              filters: ["name".toUpperCase(), search.Operator.IS, dataExpenseKey[key2].toUpperCase()]
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
                                                      } //--// */
                                        else {
                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: key2,
                                                value: dataExpenseKey[key2],
                                                ignoreFieldChange: false
                                            });
                                        }
                                    }
                                }
                                objRecord.commitLine({
                                    sublistId: 'expense'
                                });
                            }
                        } // if Item - Start Item Sublist
                        else if (key == 'item' && dataKey.hasOwnProperty(key)) {
                            var arrKeys = dataKey[key];

                            log.debug({
                                "title": "arrKeys: " + key,
                                "details": arrKeys
                            });

                            for (var j = 0; j < arrKeys.length; j++) {
                                var dataItemKey = arrKeys[j];


                                for (var key2 in dataItemKey) {
                                    if (dataItemKey.hasOwnProperty(key2)) {
                                        objRecord.selectNewLine({
                                            sublistId: key
                                        });

                                        if (key2 == 'item') {
                                            var myItemSearch = search.create({
                                                type: search.Type.NON_INVENTORY_ITEM,
                                                title: 'my Item SavedSearch',
                                                id: 'customsearch_my_item_search',
                                                columns: [search.createColumn({
                                                    name: "internalid",
                                                    sort: search.Sort.ASC
                                                }), "name"],
                                                filters: ["name".toUpperCase(), search.Operator.IS, dataItemKey[key2].toUpperCase()]
                                            }).run().getRange(0, 1);

                                            log.debug({
                                                "title": "Check IF Exist: Item " + dataCount,
                                                "details": myItemSearch
                                            });

                                            if (myItemSearch.length == 1) {
                                                var itemID = format.parse({
                                                    value: myItemSearch[0].getValue({
                                                        name: "internalid"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                            } //
                                            else {
                                                var itemID = format.parse({
                                                    value: -1,
                                                    type: format.Type.TEXT
                                                });
                                            }

                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: 'item',
                                                value: itemID,
                                                ignoreFieldChange: true
                                            });
                                        } //--//
                                        else if (key2 == 'taxcode') {
                                            var myTaxSearch = search.create({
                                                type: search.Type.SALES_TAX_ITEM,
                                                title: 'My Tax-item SavedSearch',
                                                id: 'customsearch_my_tax_search',
                                                columns: [search.createColumn({
                                                    name: "internalid",
                                                    sort: search.Sort.ASC
                                                }), "name", "rate"],
                                                filters: ["name".toUpperCase(), search.Operator.IS, dataItemKey[key2].toUpperCase()]
                                            }).run().getRange(0, 1);

                                            log.debug({
                                                "title": "Check IF Exist: Tax Code " + dataCount,
                                                "details": myTaxSearch
                                            });

                                            if (myTaxSearch.length == 1) {
                                                var taxID = format.parse({
                                                    value: myTaxSearch[0].getValue({
                                                        name: "internalid"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                                var taxRate = format.parse({
                                                    value: myTaxSearch[0].getValue({
                                                        name: "rate"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                            } //
                                            else {
                                                var taxID = format.parse({
                                                    value: -1,
                                                    type: format.Type.TEXT
                                                });
                                                var taxRate = null;
                                            }

                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: 'taxcode',
                                                value: taxID,
                                                ignoreFieldChange: true
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: 'taxrate1',
                                                value: (parseFloat(taxRate)).toFixed(2),
                                                ignoreFieldChange: true
                                            });
                                        } //--//
                                        else if (key2 == 'location') {
                                            var myLocSearch = search.create({
                                                type: search.Type.LOCATION,
                                                title: 'my Location SavedSearch',
                                                id: 'customsearch_my_location_search',
                                                columns: [search.createColumn({
                                                    name: "internalid",
                                                    sort: search.Sort.ASC
                                                }), "namenohierarchy"],
                                                filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataItemKey[key2].toUpperCase()]
                                            }).run().getRange(0, 1);

                                            log.debug({
                                                "title": "myLocSearch",
                                                "details": myLocSearch
                                            });

                                            if (myLocSearch.length == 1) {
                                                locationID = format.parse({
                                                    value: myLocSearch[0].getValue({
                                                        name: "internalid"
                                                    }),
                                                    type: format.Type.TEXT
                                                });
                                            } //
                                            else {
                                                locationID = format.parse({
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
                                        } //--//
                                        /*              else if (key2 == 'custSegment' && dataItemKey[key2] != "") {
                                                          var myClassSearch = search.create({
                                                              type: search.Type.CLASSIFICATION,
                                                              title: 'my Customer Segment SavedSearch',
                                                              id: 'customsearch_my_cust_segment_search',
                                                              columns: [search.createColumn({
                                                                  name: "internalid",
                                                                  sort: search.Sort.ASC
                                                              }), "namenohierarchy"],
                                                              filters: ["namenohierarchy".toUpperCase(), search.Operator.IS, dataItemKey[key2].toUpperCase()]
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
                                                      } //--// */
                                        /*       else if (key2 == 'department' && dataItemKey[key2] != "") {
                                                   var myDepartmentSearch = search.create({
                                                       type: search.Type.DEPARTMENT,
                                                       title: 'my Department SavedSearch',
                                                       id: 'customsearch_my_department_search',
                                                       columns: [search.createColumn({
                                                           name: "internalid",
                                                           sort: search.Sort.ASC
                                                       }), "name"],
                                                       filters: ["name".toUpperCase(), search.Operator.IS, dataItemKey[key2].toUpperCase()]
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
                                               } //--// */
                                        else {
                                            objRecord.setCurrentSublistValue({
                                                sublistId: key,
                                                fieldId: key2,
                                                value: dataItemKey[key2],
                                                ignoreFieldChange: false
                                            });
                                        }
                                    }
                                }
                                objRecord.commitLine({
                                    sublistId: 'item'
                                });
                            }
                        }
                    }
                    recordId = objRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });
                    log.debug({
                        "title": "[Success] recordId:",
                        "details": recordId
                    });

                    // load record to next step
                    recLoad = record.load({
                        type: restletBody.recordtype,
                        id: recordId
                    });

                    /*      if (vendorID == 2520) { // if Vendor PH, created Invoice with Customer name : KSI 

                              var itemLocation = '';

                              var invPH = record.create({
                                  type: record.Type.INVOICE,
                                  isDynamic: true
                              });

                              log.debug("invPH", invPH);

                              invPH.setValue({
                                  fieldId: 'customform',
                                  value: 121, // Hardcode to 121 - PH Invoice
                              });

                              invPH.setValue({
                                  fieldId: 'entity',
                                  value: "712", //  Hardcode to 712 - KSI
                              });

                              invPH.setValue({
                                  fieldId: 'trandate',
                                  value: format.parse({
                                      value: new Date(dataKey.trandate),
                                      type: format.Type.DATE
                                  })
                              });

                              invPH.setValue({
                                  fieldId: 'subsidiary',
                                  value: 3, // Hardcode to 3 - PH
                              });

                              invPH.setValue({
                                  fieldId: 'terms',
                                  value: termID
                              });

                              invPH.setValue({
                                  fieldId: 'memo',
                                  value: "Terbentuk Dari AP KSI #" + recLoad.getValue('tranid')
                              });

                              invPH.setValue({
                                  fieldId: 'custbody_ksi_no_penerimaan_barang',
                                  value: recLoad.getValue('custbody_ksi_no_penerimaan_barang')
                              });

                              var itemDesc = "Penjualan ke KSI"

                              invPH.selectNewLine({
                                  sublistId: 'item'
                              });

                              invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'item',
                                  value: 812
                              });

                              invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'description',
                                  value: itemDesc
                              });

                              invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'quantity',
                                  value: 1
                              });

                              invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'rate',
                                  value: recLoad.getValue('total')
                              });

                              /*        if (locationID == '1') {
                                          invPH.setCurrentSublistValue({
                                              sublistId: 'item',
                                              fieldId: 'location',
                                              value: "4"
                                          });
                                      } else {
                                          invPH.setCurrentSublistValue({
                                              sublistId: 'item',
                                              fieldId: 'location',
                                              value: "5"
                                          });
                                      } 

                              invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'taxcode',
                                  value: taxID
                              });

                              invPH.commitLine({
                                  sublistId: 'item'
                              });

                              invId = invPH.save({
                                  enableSourcing: false,
                                  ignoreMandatoryFields: false
                              });

                              log.debug("invId", invId);

                              invLoad = record.load({
                                  type: record.Type.INVOICE,
                                  id: invId
                              });

                              objRecord = record.load({
                                  type: restletBody.recordtype,
                                  id: recordId
                              });

                              objRecord.setValue({
                                  fieldId: 'custbody_ksi_ar_numb_ph',
                                  value: invLoad.getValue('tranid')
                              });

                              recordId = objRecord.save({
                                  enableSourcing: false,
                                  ignoreMandatoryFields: false
                              });

                              log.debug("Update Vendor Bill Success! Record ID: ", recordId);

                          } */
                    if (poType == 2) { // if Vendor Saber, Created Payment
                        vendSaber = record.load({
                            type: restletBody.recordtype,
                            id: recordId
                        });

                        var saberPayment = record.transform({
                            fromType: restletBody.recordtype,
                            fromId: recordId,
                            toType: record.Type.VENDOR_PAYMENT,
                            isDynamic: false
                        });

                        log.debug("saberPayment", saberPayment);

                        saberPayment.setValue({
                            fieldId: 'tranid',
                            value: "PAY" + vendSaber.getValue('transactionnumber')
                        });

                        saberPayment.setValue({
                            fieldId: 'trandate',
                            value: format.parse({
                                value: new Date(dataKey.trandate),
                                type: format.Type.DATE
                            })
                        });

                        saberPayment.setValue({
                            fieldId: 'account',
                            value: "219" // Hardcode to 219 - 1101007 KAS : Kas Jojonomic
                        });

                        saberPayment.setValue({
                            fieldId: 'memo',
                            value: "Payment Untuk " + vendSaber.getValue('tranid')
                        });

                        var saberPaymentId = saberPayment.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });

                        log.debug("saberPaymentId", saberPaymentId);
                    }

                    recLoad = record.load({
                        type: restletBody.recordtype,
                        id: recordId
                    });

                    log.debug("recLoad", recLoad);

                    recStr.push({
                        "type": "success.SuiteScriptSuccess",
                        "title": "Record Successfully Inserted! VendorBill ID: " + recLoad.getValue('tranid') + ".",
                        "status": "Success",
                        "o: errorCode": ""
                    });
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