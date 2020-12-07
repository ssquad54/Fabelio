function validate_credit_limit(type) {

    var createdFrom = nlapiGetFieldValue('createdfrom');
    var createdFromType = nlapiLookupField('transaction', createdFrom, 'recordtype');
    var customerId = nlapiGetFieldValue('entity');

    nlapiLogExecution('DEBUG', 'created from type', createdFromType);

    if (createdFromType == 'salesorder') {
        var salesOrder = nlapiLoadRecord('salesorder', createdFrom);

        var isReturn = salesOrder.getFieldValue('custbody_bmpt_return');
        nlapiLogExecution('DEBUG', 'is return', isReturn);

        if (isReturn == 'F') {
            var pymtMethod = salesOrder.getFieldValue('custbody_bmpt_metode_pembayaran');
            nlapiLogExecution('DEBUG', 'payment method', pymtMethod);

            if (pymtMethod == 3 || pymtMethod == 4) {
                var custRecord = nlapiLoadRecord('customer', customerId);

                var creditLimit = 0;
                var balance = 0;
                var depositBalance = 0;
                var totalAmount = 0;
                var amount = 0;
                var needApproval = [];

                creditLimit = salesOrder.getFieldValue('credlim');
                balance = salesOrder.getFieldValue('balance');
                depositBalance = custRecord.getFieldValue('depositbalance');
                var remainingBalance = (creditLimit * 1.15) - balance + Number(depositBalance);
                var totalCustBalance = creditLimit - balance + Number(depositBalance);
                nlapiLogExecution('DEBUG', 'SO field value', 'creditlimit :' + creditLimit + ' | balance: ' + balance + ' | depositBalance: ' + depositBalance + ' | remainingBalance: ' + remainingBalance);

                var lineCount = nlapiGetLineItemCount('item');
                for (var i = 1; i <= lineCount; i++) {
                    var item;
                    var quantity;
                    var rate;
                    var fulfill = nlapiGetLineItemValue('item', 'itemreceive', i);
                    nlapiLogExecution('DEBUG', 'fulfill', fulfill);
                    if (fulfill == 'T') {
                        var approval = nlapiGetLineItemValue('item', 'custcol_need_approval', i);
                        needApproval.push(approval);
                        nlapiLogExecution('DEBUG', 'Need Approval', needApproval[0] + " - " + needApproval[1]);
                        if (needApproval[0] == 'T') {
                            item = nlapiGetLineItemValue('item', 'item', i);
                            quantity = nlapiGetLineItemValue('item', 'quantity', i);
                            var qtyApproval = nlapiGetLineItemValue('item', 'custcol_fulfill_qty', i);
                            amount = 0;
                            nlapiLogExecution('DEBUG', 'Sublist data', 'item :' + item + ' | quantity: ' + quantity + ' | needApproval: ' + needApproval + ' | qtyApproval: ' + qtyApproval + ' | amount: ' + amount);
                            if (approval != needApproval[0]) {
                                alert('Silahkan Periksa Kembali Barang Yang Akan Dikirim !');
                                return false;
                            } else if (quantity > qtyApproval) {
                                alert('Quantity yang akan dikirimkan Lebih Besar dari Quantity yang di approve, Silahkan periksa Kembali !!');
                                return false;
                            }
                        } else if (needApproval[0] == 'F') {
                            item = nlapiGetLineItemValue('item', 'item', i);
                            quantity = nlapiGetLineItemValue('item', 'quantity', i);
                            rate = nlapiGetLineItemValue('item', 'itemunitprice', i);
                            amount = quantity * rate;
                            nlapiLogExecution('DEBUG', 'Sublist data', 'item :' + item + ' | quantity: ' + quantity + ' | rate: ' + rate + ' | amount: ' + amount);
                            if (approval != needApproval[0]) {
                                alert('Silahkan Periksa Kembali Barang Yang Akan Dikirim !');
                                return false;
                            }
                        }
                    }
                    totalAmount += Number(amount);
                }
                nlapiLogExecution('DEBUG', 'Total Amount', totalAmount);

                var overLimit = Number(totalAmount) + Number(totalCustBalance);
                nlapiLogExecution('DEBUG', 'over Limit', overLimit);

                var reason = salesOrder.getFieldValue('custbody_approval_reason');

                if (totalAmount > remainingBalance) {
                    // confirmation dialog
                    var confirmation = confirm('Customer ini telah Over Limit Sejumlah ' + Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(overLimit) +
                        '\nApakah Anda ingin mengajukan Approval ?');

                    if (confirmation) {
                        var input_reason = prompt('Please enter approval reason');
                        while (input_reason == "" || input_reason == null) {
                            input_reason = prompt('Approval reason cannot be blank !!');
                        }

                        salesOrder.setFieldValue('custbody_approval_reason', input_reason);
                        salesOrder.setFieldValue('custbody_approval_status_so', 1);

                        soLineCount = salesOrder.getLineItemCount('item');

                        for (var u = 1; u <= lineCount; u++) {
                            var check = nlapiGetLineItemValue('item', 'itemreceive', u);
                            nlapiLogExecution('DEBUG', 'isChecked', check);
                            if (check == 'T') {
                                var ifItem = nlapiGetLineItemValue('item', 'item', u);
                                var ifQuantity = nlapiGetLineItemValue('item', 'quantity', u);
                                nlapiLogExecution('DEBUG', 'start SO Line', 'start');
                                for (var o = 1; o <= soLineCount; o++) {
                                    nlapiLogExecution('DEBUG', 'get SO item', 'start');
                                    var soItem = salesOrder.getLineItemValue('item', 'item', o);
                                    if (ifItem == soItem) {
                                        nlapiLogExecution('DEBUG', 'set SO approval', 'start');
                                        salesOrder.setLineItemValue('item', 'custcol_need_approval', o, 'T');
                                        nlapiLogExecution('DEBUG', 'set SO qty fulfill', 'start');
                                        salesOrder.setLineItemValue('item', 'custcol_fulfill_qty', o, ifQuantity);
                                    }
                                }
                            }
                        }
                        saveSO = nlapiSubmitRecord(salesOrder, true);
                        //open Sales Order Record at current Windows.
                        window.open('https://6261179-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + saveSO, +'_self');
                        return false;
                    } else {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}