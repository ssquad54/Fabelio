function prolecto_SalesOrder_AfterSubmit(type) {
    //note, code has been adapted from working application and is for educational purposes only
    nlapiLogExecution('AUDIT', 'prolecto_SalesOrder_AfterSubmit starting', type);

    //only act on relevant records
    if (type == 'delete') return;
    if (!(type == 'create' || type == 'edit' || type == 'approve')) return;

    var CONST_FORM_PURCH = "98"; // 98 is standard po

    var tran_id = nlapiGetRecordId();
    var order = nlapiLoadRecord('salesorder', tran_id);
    var customer_id = order.getFieldValue('entity');
    nlapiLogExecution('DEBUG', 'salesorder:' + tran_id + ' customerid:' + customer_id, 'customform:' + CONST_FORM_PURCH);

    // get the order so we can create a unique list of target vendors
    var vendor_array = new Array();
    var lines = order.getLineItemCount('item');
    for (var l = 1; l <= lines; l++) {
        //note, we have a custom column on the transaction line to hold the target vendor
        var vendor = order.getLineItemValue('item', 'custcol_prolecto_vendor', l).toString();

        if (vendor.length > 0) {
            vendor = '_' + vendor; //helpful to ensure that our array is not using numbers
            if (!(vendor in vendor_array)) {
                vendor_array[vendor] = "1";
            }
        }
    }
    // create the purchase orders; our goal is to create one PO for each vendor
    // using the create PO syntax with parameters for special order will link it to the sales order;
    // by default, netSuite will link all items to the a vendor when the po is initially created.  Not quite right
    // We will delete incorrectly placed vendor rows and keep creating another po until we have a po for all vendors in play

    // produce an array list vendors
    var keys = Object.keys(vendor_array);
    var olen = keys.length;
    nlapiLogExecution('DEBUG', 'vendor array list length', olen);

    if (olen > 0) {
        for (var o = 0; o < olen; o++) {
            var key = keys[o];
            var vendor_id = key.substring(1); //remove the '_';
            nlapiLogExecution('DEBUG', o + '. vendor vendor_id:' + vendor_id);

            // this is the special syntax to setup the po with a target vendor and link it to the SO
            var new_po = nlapiCreateRecord('purchaseorder', {
                customform: CONST_FORM_PURCH,
                soid: tran_id,
                shipgroup: "1",
                dropship: "T",
                custid: customer_id,
                entity: vendor_id
            });

            // now delete the lines that are not part of the target vendor

            // as each po is created, it has one less vendor than the previous one for the one that already was created
            // therefore we can delete the lines that don't match the vendor or if the vendor is empty
            var num_lines = new_po.getLineItemCount('item');
            nlapiLogExecution('DEBUG', 'analyze vendors num_lines:' + num_lines);

            for (var d = num_lines; d >= 1; d--) {
                var vendortarget = new_po.getLineItemValue('item', 'custcol_prolecto_vendor', d).toString();
                if (vendortarget.length == 0 || vendortarget != vendor_id) {
                    //throw away the line; this target vendor is not in the current PO; we'll get it next time around
                    new_po.removeLineItem('item', d);
                } else {
                    // right vendor; set the correct target rate as indicated on our sales order line
                    var rate = new_po.getLineItemValue('item', 'custcol_prolecto_item_rate', d);
                    new_po.setLineItemValue('item', 'rate', d, rate);
                }
            }
        }

        //commit the work
        var num_lines = new_po.getLineItemCount('item');
        if (num_lines > 0) {
            var po_id = nlapiSubmitRecord(new_po, false, true);
            nlapiLogExecution('DEBUG', 'created a po', po_id);
        }
        new_po = null;
    }
}
}