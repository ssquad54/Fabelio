function afterSubmit_generateInvoice(type) {
    log.debug('Executing', type);
    try {
        if (
            type == 'create' &&
            nlapiGetFieldValue('custbody_fab_auto_invoice') == 'T') {
            log.debug('Execution Context, Auto Invoice', JSON.stringify([nlapiGetContext().getExecutionContext(), nlapiGetFieldValue('custbody_fab_auto_invoice')]));
            var salesOrderId = nlapiGetFieldValue('createdfrom');
            var salesOrderNumber = nlapiGetFieldValue('tranid');
            var recInvoice = generatePartialInvoice(salesOrderId);
            var invoiceId = nlapiSubmitRecord(recInvoice);
            log.debug("Created invoice with id " + invoiceId, "SO # " + salesOrderNumber + " with Id " + salesOrderId);
            generatePayment(invoiceId)
        } else
            log.debug('Didnt run. Type, Context, Auto Check ', [type, nlapiGetContext().getExecutionContext(), nlapiGetFieldValue('custbody_fab_auto_invoice')]);
    } catch (ex) {
        log.error("Error generating invoice fo SO " + salesOrderNumber + " with Id " + salesOrderId, ex);
    }
}

function generatePartialInvoice(salesOrderId) {
    var recInvoice = nlapiTransformRecord('salesorder', salesOrderId, 'invoice');
    var fulfillmentItems = {};
    var countFF = nlapiGetLineItemCount('item');

    for (var i = 1; i <= countFF; i++)
        if (nlapiGetLineItemValue('item', 'itemreceive', i) == 'T')
            fulfillmentItems[nlapiGetLineItemValue('item', 'item', i)] = i;

    log.debug('FF Items: ' + countFF, JSON.stringify(fulfillmentItems));
    var countInv = recInvoice.getLineItemCount('item');

    /**
     * Transform sales order record Object to invoice
     * and calculate shipping cost 
     */
    var totalItemShippingFee = 0;
    var iInv = 1;
    var recInvoice = nlapiTransformRecord('salesorder', salesOrderId, 'invoice');
    /**
     * For Getting Item level actual shipping fee
     * and if actual shipping field not there works as before logic
     */
    var invoicePayloadJsonString = JSON.stringify(recInvoice);
    var invoicePayloadObj = JSON.parse(invoicePayloadJsonString);
    var items = {};
    var checkIfShippingFieldThere = false;
    for (var countItem = 0; countItem < invoicePayloadObj.item.length; countItem++) {
        if (typeof invoicePayloadObj.item[countItem].custcol_shipping_fee !== 'undefined') {
            items[invoicePayloadObj.item[countItem].item.internalid] = (invoicePayloadObj.item[countItem].custcol_shipping_fee) ? invoicePayloadObj.item[countItem].custcol_shipping_fee : 0;
            checkIfShippingFieldThere = true;
        }
    }

    recInvoice.setFieldValue('custbody_if_no', nlapiGetRecordId());
    while (iInv <= countInv) {
        // for (var fulfillmentItem in fulfillmentItems) {
        var item = recInvoice.getLineItemValue('item', 'item', iInv)
        log.debug('Processing ' + iInv, item);
        if (!fulfillmentItems[item]) { // this line is not in IF
            log.debug('Deleting' + iInv);
            recInvoice.removeLineItem('item', iInv);
            countInv = recInvoice.getLineItemCount('item');
            log.debug('New line count ' + countInv);
        } else {
            /**
             * calculating total shipping fee for invoice
             */
            if (items[item]) {
                totalItemShippingFee += parseFloat(items[item]);
            }

            recInvoice.setLineItemValue('item', 'quantity', iInv, nlapiGetLineItemValue('item', 'quantity', fulfillmentItems[item]));
            iInv++;
        }
    }
    log.debug('Total Invoice shipping fee ', totalItemShippingFee);
    /**
     * Removing tax from shipping cost
     */
    var shippingAmountWithoutTax = (totalItemShippingFee / 1.1).toFixed(2);
    log.debug('Total Invoice shipping fee without tax', shippingAmountWithoutTax);
    /**
     * Setting shipping cost to invoice
     */
    if (checkIfShippingFieldThere) {
        recInvoice.setFieldValue('altshippingcost', shippingAmountWithoutTax);
        recInvoice.setFieldValue('shippingcost', shippingAmountWithoutTax);
    }
    return recInvoice;
}

function generatePayment(invoiceId) {
    log.debug('generatePayment()');
    try {
        var invoice = nlapiLoadRecord('invoice', invoiceId);
        var storeCreditAmount = invoice.getFieldValue('custbody_magento_store_credit_amount');
        log.debug('Store Credit Amount', storeCreditAmount);
        var customer = invoice.getFieldValue('entity');
        log.debug('Customer', customer);
        var creditMemos = getCreditMemosFor(customer);
        log.debug('Applying customer, creditMemos, invoice', JSON.stringify([customer, creditMemos, invoiceId]))
        if (!!creditMemos && creditMemos.length > 0)
            applyInvoice(invoiceId, storeCreditAmount, creditMemos);
    } catch (ex) {
        log.error("Error applying CM", ex);
    }
}

function getCreditMemosFor(customer) {
    var creditMemos = nlapiSearchRecord('creditmemo', null, [
        new nlobjSearchFilter('mainline', null, 'is', 'T'),
        new nlobjSearchFilter('status', null, 'is', 'CustCred:A'),
        new nlobjSearchFilter('entity', null, 'is', customer)
    ])
    return (creditMemos || []).map(function(rec) { return rec.getId() }).sort();
}

function applyInvoice(invoice, storeCreditAmount, creditMemos) {
    var creditMemoIndex = 0;
    log.debug('Credit Memos found', JSON.stringify(creditMemos));
    while (storeCreditAmount > 0 && creditMemoIndex < creditMemos.length) {
        log.debug('Credit Memo Index, Store Credit Amount remaining', [creditMemoIndex, storeCreditAmount]);
        var appliedAmount = applyToSingleCM(creditMemos[creditMemoIndex], storeCreditAmount, invoice);
        storeCreditAmount = storeCreditAmount - appliedAmount;
        creditMemoIndex++;
    }
}

function applyToSingleCM(creditMemoId, storeCreditAmount, invoice) {
    log.debug('Trying to apply on', creditMemoId);
    var creditMemo = nlapiLoadRecord('creditmemo', creditMemoId);
    var total = Math.abs(+creditMemo.getFieldValue('total'));
    log.debug('CM Total', total);
    var amountToApply = total;
    if (total > storeCreditAmount)
        amountToApply = storeCreditAmount;
    log.debug('Amount to apply', amountToApply);
    var countApply = creditMemo.getLineItemCount('apply');
    for (var i = 1; i <= countApply; i++) {
        var invoiceId = creditMemo.getLineItemValue('apply', 'internalid', i);
        if (invoiceId == invoice) {
            log.debug('Matched on line ' + i, invoiceId);
            creditMemo.setLineItemValue('apply', 'apply', i, 'T');
            creditMemo.setLineItemValue('apply', 'amount', i, amountToApply);
            log.debug('Setting Amount to apply on CM, invoice ' + [creditMemoId, invoiceId], amountToApply);
            nlapiSubmitRecord(creditMemo);
            return amountToApply;
        }
    }
    log.error('Invoice ' + invoice + 'not found in this Credit Memo', [creditMemo, storeCreditAmount, invoice]);
    return 0;
}