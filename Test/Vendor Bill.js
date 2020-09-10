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

                        /*   var itemInfo = recLoad.getSublistText({
                               sublistId: 'line',
                               fieldId: 'account',
                               line: i
                           });
   
                           log.debug("itemInfo", itemInfo); */

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
                            tran_created: recLoad.getText('custbody_ksi_created_by'),
                            //       item_name: recLoad.getSublistText('item', 'item', i),
                            //       item_description: recLoad.getSublistValue('item', 'description', i),
                            //       item_qty: recLoad.getSublistValue('item', 'quantity', i),
                            //       item_rate: recLoad.getSublistValue('item', 'rate', i),
                            //       item_amount: recLoad.getSublistValue('item', 'amount', i),
                            //       item_tax_code: getSublistText('item', 'taxcode', i),
                            //       item_tax_rate: getSublistValue('item', 'taxrate', i),
                            //       item_tax_amount: getSublistText('item', 'taxamt', i),
                            //       item_gross_amount: recLoad.getSublistValue('item', 'grossamount', i),
                            //       item_department: recLoad.getSublistText('item', 'department', i),
                            //       item_cust_segment: recLoad.getSublistText('item', 'class', i),
                            //       item_location: recLoad.getSublistText('item', 'location', i)
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

    function postData(vendBill) {
        doValidation([vendBill.recordtype], ['recordtype'], 'POST');

        log.debug("After do Validation");

        if (vendBill.recordtype == 'vendorbill') {

            try {
                var recStr = [];

                var receiveNo = "5575";

                var billPrefix = "BIL20"
                var docNumb = "0089"
                var tranId = billPrefix + docNumb;

                var objSearch = search.create({
                    type: search.Type.VENDOR_BILL,
                    filters: [
                        ['mainline', search.Operator.IS, true],
                        'AND', [
                            ['custbody_ksi_no_penerimaan_barang', search.Operator.IS, receiveNo.trim()], 'or', ['tranid', search.Operator.IS, tranId.trim()]
                        ]
                    ],
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
                if (dataCount > 0) {
                    recStr.push({
                        Duplicate_on_RecordID: objSearch[0].getValue('custbody_ksi_no_penerimaan_barang')
                    });
                }
                // IF not exist, Create record...
                else if (dataCount < 1) {
                    flagPrc = 'i';
                    var objRecord = record.create({
                        type: vendBill.recordtype,
                        isDynamic: true
                    });

                    log.debug("objRecord", objRecord);

                    var tranDate = "05/05/2020";
                    var vendorId = "2520";
                    var subsidiary = "2"; // 2 - KSI
                    var account = "319"; // 2102101 UTANG DAGANG : UTANG DAGANG PIHAK KETIGA : Vendor Platform KSI
                    var terms = "2"; // 2 - Net 7
                    //  var tranDate = "7/5/2020"
                    //  var batchNumber = "77";
                    var memo = "Testing Script ";
                    var noFakturPajak = "123.456-78.12345678";
                    var tglFakturPajak = "04/05/2020";

                    objRecord.setValue({
                        fieldId: 'customform',
                        value: 110, // KSI Vendor Bill
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'trandate',
                        value: format.parse({
                            value: tranDate,
                            type: format.Type.DATE
                        })
                    });

                    objRecord.setValue({
                        fieldId: 'entity',
                        value: vendorId,
                        ignoreFieldChange: false
                    });

                    objRecord.setValue({
                        fieldId: 'tranid',
                        value: tranId,
                        ignoreFieldChange: true
                    });

                    /*   objRecord.setValue({
                           fieldId: 'subsidiary',
                           value: subsidiary,
                           ignoreFieldChange: true
                       });

                       objRecord.setValue({
                           fieldId: 'account',
                           value: account,
                           ignoreFieldChange: true
                       }); */

                    objRecord.setValue({
                        fieldId: 'terms',
                        value: terms,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'memo',
                        value: memo,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_ksi_no_penerimaan_barang',
                        value: receiveNo,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_ksi_faktur_pajak',
                        value: noFakturPajak,
                        ignoreFieldChange: true
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_tgl_faktur_pajak',
                        value: format.parse({
                            value: tglFakturPajak,
                            type: format.Type.DATE
                        })
                    });

                    var item = "828"; // Pembelian Barang Dagang KSI
                    var description = "pembelian Barang Dagang";
                    var itemRate = "14586900";
                    var taxCode = "810";
                    var location = "1";

                    //  for (var i = 0; i < account.length; i++) {
                    objRecord.selectNewLine({
                        sublistId: 'item'
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: item,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        value: description,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        value: 2, //  Set
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: itemRate,
                        ignoreFieldChange: false
                    });

                    /*  objRecord.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'amount',
                          value: itemRate,
                          ignoreFieldChange: true
                      }); */

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: location,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: taxCode,
                        ignoreFieldChange: false
                    });

                    objRecord.commitLine({
                        sublistId: 'item'
                    });

                    //  };

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
                        type: vendBill.recordtype,
                        id: recordId
                    });

                    log.debug("recLoad", recLoad);

                    if (vendorId == 2520) {

                        var invPH = record.create({
                            type: record.Type.INVOICE,
                            isDynamic: true
                        });

                        log.debug("invPH", invPH);

                        var custName = "712"; //KSI
                        var invMemo = "Terbentuh Dari AP KSI" + " " + "#" + recLoad.getValue('tranid');

                        invPH.setValue({
                            fieldId: 'customform',
                            value: 121,
                            ignoreFieldChange: false
                        });

                        invPH.setValue({
                            fieldId: 'entity',
                            value: custName,
                            ignoreFieldChange: false
                        });

                        invPH.setValue({
                            fieldId: 'subsidiary',
                            value: 3,
                            ignoreFieldChange: false
                        });

                        invPH.setValue({
                            fieldId: 'terms',
                            value: terms,
                            ignoreFieldChange: false
                        });

                        invPH.setValue({
                            fieldId: 'memo',
                            value: invMemo,
                            ignoreFieldChange: false
                        });

                        invPH.setValue({
                            fieldId: 'custbody_ksi_no_penerimaan_barang',
                            value: receiveNo,
                            ignoreFieldChange: false
                        });

                        /*   invPH.setValue({
                               fieldId: 'account',
                               value: 243,
                               ignoreFieldChange: true
                           }); */


                        var itemDesc = "Penjualan ke KSI"
                        var itemLocation = "4" //  PH Setu

                        invPH.selectNewLine({
                            sublistId: 'item'
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: 812,
                            ignoreFieldChange: false
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: itemDesc,
                            ignoreFieldChange: false
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: itemDesc,
                            ignoreFieldChange: false
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: 1,
                            ignoreFieldChange: false
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: itemRate,
                            ignoreFieldChange: false
                        });

                        /*      invPH.setCurrentSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'amount',
                                  value: itemRate,
                                  ignoreFieldChange: true
                              }); */

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            value: itemLocation,
                            ignoreFieldChange: false
                        });

                        invPH.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: taxCode,
                            ignoreFieldChange: false
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

                        var invDocNo = invLoad.getValue({
                            fieldId: 'tranid'
                        });

                        objRecord = record.load({
                            type: vendBill.recordtype,
                            id: recordId
                        });

                        objRecord.setValue({
                            fieldId: 'custbody_ksi_ar_numb_ph',
                            value: invDocNo
                        });

                        recordId = objRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });

                        log.debug("Update Vendor Bill Success! Record ID: ", recordId);

                    } else if (vendorId == 434) {
                        vendSaber = record.load({
                            type: vendBill.recordtype,
                            id: recordId
                        });

                        var saberPayment = record.transform({
                            fromType: vendBill.recordtype,
                            fromId: recordId,
                            toType: 'vendorpayment',
                            isDynamic: false
                        });

                        log.debug("saberPayment", saberPayment);

                        var payPrefix = "PAY20";
                        var CheckNumb = payPrefix + docNumb

                        saberPayment.setValue({
                            fieldId: 'tranid',
                            value: CheckNumb
                        });

                        saberPayment.setValue({
                            fieldId: 'account',
                            value: 219
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
                        type: vendBill.recordtype,
                        id: recordId
                    });

                    var lineCount = recLoad.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug("lineCount", lineCount);

                    if (lineCount > 0) {
                        for (var j = 0; j < lineCount; j++) {

                            recStr.push({
                                use_form: recLoad.getText('customform'),
                                tran_no: recLoad.getValue('transactionnumber'),
                                doc_number: recLoad.getText('tranid'),
                                tran_date: recLoad.getValue('date'),
                                tran_vendor: recLoad.getText('entity'),
                                tran_subsidiary: recLoad.getText('subsidiary'),
                                tran_term: recLoad.getText('terms'),
                                tran_account: recLoad.getText('account'),
                                tran_memo: recLoad.getValue('memo'),
                                no_penerimaan_brg: recLoad.getValue('custbody_ksi_no_penerimaan'),
                                no_faktur_pajak: recLoad.getValue('custbody_ksi_faktur_pajak'),
                                tgl_faktur_pajak: recLoad.getValue('custbody_tgl_faktur_pajak'),
                                no_ap_invoice_PH: recLoad.getValue('custbody_ksi_ar_numb_ph'),
                                item_name: recLoad.getSublistValue('item', 'item', j),
                                item_desc: recLoad.getSublistValue('item', 'description', j),
                                item_amt: recLoad.getSublistValue('item', 'amount', j),
                                item_taxcode: recLoad.getSublistValue('item', 'taxcode', j),
                                item_location: recLoad.getSublistValue('item', 'location', j)
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