var itemcoupontotal = 0.0;
var linesToUpdateInitValues = [];

function existLineToUpdateInitValues(lineNum) {
    return linesToUpdateInitValues.indexOf(lineNum) > -1;
}

function addLineToUpdateInitValues(lineNum) {
    if (!existLineToUpdateInitValues(lineNum)) {
        linesToUpdateInitValues.push(lineNum);
    }
}

function removeLineToUpdateInitValues(lineNum) {
    var index = linesToUpdateInitValues.indexOf(lineNum);

    if (existLineToUpdateInitValues(lineNum)) {
        linesToUpdateInitValues.splice(index, 1);
    }
}

function hasLegacyMachine() {
    return nlapiGetContext().getExecutionContext() == 'userinterface' && document.forms.item_form;
}

function getItemType() {
    return nlapiGetCurrentLineItemValue('item', 'itemtype');
}

function getItemSubType() {
    return nlapiGetCurrentLineItemValue('item', 'itemsubtype');
}

function getTransactionType() {
    return nlapiGetFieldValue('type').toLowerCase();
}

function useInventoryLocationForFulfillment() {
    return nlapiGetContext().getFeature('CROSSSUBSIDIARYFULFILLMENT') && (getTransactionType() == 'salesord' || getTransactionType() == 'rtnauth');
}


function getItemMachDisabled(fldname) {
    return nlapiGetLineItemDisabled('item', fldname);
}

function setItemMachDisabled(fldname, bdisabled) {
    if (hasItemMachField(fldname))
        nlapiSetLineItemDisabled('item', fldname, bdisabled);
}

function hasItemMachField(fldname) {
    return nlapiGetLineItemField('item', fldname) != null;
}

function getItemMachField(fldname) {
    return nlapiGetLineItemField('item', fldname);
}

function getItemMachValue(fldname) {
    return nlapiGetCurrentLineItemValue('item', fldname);
}

function setItemMachValue(fldname, val) {
    return nlapiSetCurrentLineItemValue('item', fldname, val, false);
}


function getItemMachFloat(fldname) {
    return parseFloat(nlapiGetCurrentLineItemValue('item', fldname));
}

function itemMachCurrentLineValueNotEmpty(fldname) {
    var lineValue = nlapiGetCurrentLineItemValue('item', fldname);
    return lineValue != null && lineValue.length > 0;
}



function getEncodedItemValue(linenum, fieldname) {
    return getEncodedValue('item', linenum, fieldname);
}

function getEncodedItemFloat(linenum, fieldname) {
    return parseFloat(getEncodedItemValue(linenum, fieldname));
}

function getEncodedItemInt(linenum, fieldname) {
    return parseInt(getEncodedItemValue(linenum, fieldname));
}

function setEncodedItemValue(linenum, fieldname, value) {
    setEncodedValue('item', linenum, fieldname, value);
}

function itemHasEncodedField(fieldname) {
    return hasEncodedField('item', fieldname);
}

function hasEncodedItemValue(linenum, fieldname) {
    var lineValue = getEncodedItemValue(linenum, fieldname);
    return lineValue != null && lineValue.length > 0;
}



var taxInclusivePricingHelper = {
    fieldNames: {
        'rate': 'rateincludingtax',
        'amount': 'grossamt',
        'amounthasbeenset': 'grossamthasbeenset'
    },
    checkFieldName: function(fieldName) {
        if (!(fieldName in this.fieldNames)) {
            throw 'Unknown field \'' + fieldName + '\' retrieved.';
        }
    },
    getEditableFieldName: function(fieldName) {
        var useAlternativeFieldName = (nlapiGetFieldValue('pricesincludetax') === 'T');
        return this.getFieldName(fieldName, useAlternativeFieldName);
    },
    getCalculatedFieldName: function(fieldName) {
        var useAlternativeFieldName = !(nlapiGetFieldValue('pricesincludetax') === 'T');
        return this.getFieldName(fieldName, useAlternativeFieldName);
    },
    getFieldName: function(fieldName, useAlternativeFieldName) {
        this.checkFieldName(fieldName);
        return (useAlternativeFieldName ? this.fieldNames[fieldName] : fieldName);
    }
}



function DoProduct(fldname) {
    var rateField = taxInclusivePricingHelper.getEditableFieldName('rate');
    var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');

    var amtstr = nlapiGetLineItemField('item', amountField) != null ? nlapiGetCurrentLineItemValue('item', amountField) : '';

    var vsoeamtstr = nlapiGetLineItemField('item', 'vsoeamount') != null ? nlapiGetCurrentLineItemValue('item', 'vsoeamount') : '';

    var totalcostestimatestr = nlapiGetLineItemField('item', 'costestimate') != null ? nlapiGetCurrentLineItemValue('item', 'costestimate') : '';


    CheckCount();




    var itemtype = getItemType();
    if (itemtype == 'Subtotal') {
        amtstr = '0.00';
        vsoeamtstr = '';
        totalcostestimatestr = '';
    } else if (fldname != 'amount' && (itemtype == 'Discount' || itemtype == 'Markup')) {
        var rate = parseFloat(nlapiGetCurrentLineItemValue('item', rateField));



        // if there is % in discount rate, get amount from previous line and calculate correct amount for discount
        if (nlapiGetCurrentLineItemValue('item', rateField).indexOf('%') != -1 && nlapiGetCurrentLineItemIndex('item') > 1) {
            var previousLineIndex = nlapiGetCurrentLineItemIndex('item') - 1;
            var previousLineAmount = nlapiGetLineItemValue('item', 'amount', previousLineIndex);
            amtstr = format_currency(rate * 0.01 * previousLineAmount);
        } else {
            amtstr = shouldCalculateAmount('item') ? format_currency(rate) : amtstr;
        }

        vsoeamtstr = '';
        totalcostestimatestr = '';
    } else {
        var itmcnt = parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity'));
        var itmcost = parseFloat(nlapiGetCurrentLineItemValue('item', rateField));
        if (isNaN(itmcnt)) {
            itmcnt = 1;

        }




        if (getTransactionType() == 'blankord' && (isNaN(amtstr) || fldname == 'quantity' || fldname == rateField || fldname == null) && (hasItemMachField('quantityordered') && zeroIfNaN('quantityordered') != 0)) {
            var qtyOrdered = parseFloat(getItemMachValue('quantityordered'));
            var amtOrdered = zeroIfNaN('amountordered');
            amtstr = format_currency((itmcnt - qtyOrdered) * itmcost + amtOrdered);
        } else {
            if (fldname != 'amount' && ((hasItemMachField('costestimaterate') && fldname != 'costestimaterate') || !hasItemMachField('costestimaterate')) && (isNaN(amtstr) || fldname == 'quantity' || fldname == rateField || fldname == null)) {
                amtstr = shouldCalculateAmount('item') ? ((isNaN(itmcnt) || isNaN(itmcost)) ? '' : format_currency(itmcnt * itmcost)) : amtstr;
            }

            if (fldname != 'amount' && fldname != 'costestimaterate' && hasItemMachField('vsoeamount') && hasItemMachField('vsoeprice') && fldname != 'vsoeamount' && (isNaN(getItemMachValue('vsoeamount')) || fldname == 'quantity' || fldname == 'vsoeprice' || fldname == null)) {
                vsoeamtstr = shouldCalculateVSOEAmount() ? (isNaN(itmcnt) || isNaN(getItemMachValue('vsoeprice')) || getItemMachValue('vsoeprice') == '') ? '' : format_currency(itmcnt * getItemMachValue('vsoeprice')) : vsoeamtstr;
            }
            if (fldname != 'amount' && fldname != 'vsoeprice' && hasItemMachField('costestimate') && hasItemMachField('costestimaterate') && (isNaN(getItemMachValue('costestimate')) || fldname == 'quantity' || fldname == 'costestimaterate' || fldname == null)) {
                totalcostestimatestr = shouldCalculateCostEstimate() ? (isNaN(itmcnt) || isNaN(getItemMachValue('costestimaterate')) || getItemMachValue('costestimaterate') == '') ? '' : format_currency(itmcnt * getItemMachValue('costestimaterate')) : totalcostestimatestr;
            }
        }
    }
    if (hasItemMachField(amountField))
        setItemMachValue(amountField, amtstr);
    if (hasItemMachField('vsoeamount'))
        setItemMachValue('vsoeamount', vsoeamtstr);
    if (hasItemMachField('costestimate'))
        setItemMachValue('costestimate', totalcostestimatestr);


    if (fldname != null && !isNaN(parseFloat(nlapiGetCurrentLineItemValue('item', 'taxrate1'))))
        syncVatLine(fldname, 'item');
    syncAnnualRev(fldname);
}

function zeroIfNaN(fieldName) {
    var value = parseFloat(getItemMachValue(fieldName));
    if (isNaN(value))
        value = 0;
    return value;
}

function ifNaNThen(value, defaultValue) {
    return isNaN(value) ? defaultValue : value;
}

function syncPctQty() {
    var ordered = nlapiGetLineItemField('item', 'quantityordered') != null ? nlapiGetCurrentLineItemValue('item', 'quantityordered') : "";
    var percent = nlapiGetCurrentLineItemValue('item', 'currentpercent');
    var bsetamt = false;
    if (percent.length == 0)
        nlapiSetCurrentLineItemValue('item', 'quantity', '', false);
    else if (ordered.length > 0) {
        nlapiSetCurrentLineItemValue('item', 'quantity', parseFloat(percent) / 100 * parseFloat(ordered), false);
        bsetamt = true;
    } else {
        alert('There is no order quantity for this line');
        nlapiSetCurrentLineItemValue('item', 'currentpercent', '', false);
    }
    DoProduct();

    if (nlapiGetLineItemField('item', 'amountordered') != null && bsetamt)
        nlapiSetCurrentLineItemValue('item', 'amount', format_currency(parseFloat(percent) / 100 * parseFloat(nlapiGetCurrentLineItemValue('item', 'amountordered'))), false);
}

function syncQty() {
    var ordered = nlapiGetCurrentLineItemValue('item', 'quantityordered');
    var qty = nlapiGetCurrentLineItemValue('item', 'quantity');

    if (qty.length == 0 || parseFloat(ordered) == 0)
        nlapiSetCurrentLineItemValue('item', 'currentpercent', '', false);
    else if (ordered.length > 0)
        nlapiSetCurrentLineItemValue('item', 'currentpercent', parseFloat(qty) / parseFloat(ordered) * 100, false);
}

function getOnHandWarningMessage(locID, useloc, itemtype, itemname, onhand, unittext, backordered, onorder) {
    if (itemtype == 'Kit') {
        if (locID > 0)
            return '' + itemname + ': You only have parts for this number of kits available for commitment at this location: ' + onhand + '' + unittext + '.';
        if (useloc == true)
            return '' + itemname + ': You only have parts for this number of kits available for commitment across all locations: ' + onhand + '' + unittext + '.';
        return '' + itemname + ': You only have parts for this number of kits available for commitment: ' + onhand + '' + unittext + '.';
    }

    if (locID > 0)
        return '' + itemname + ': You have only ' + onhand + '' + unittext + ' available for commitment at this location (' + backordered + ' back ordered, ' + onorder + ' on order).';
    if (useloc == true)
        return '' + itemname + ': You have only ' + onhand + '' + unittext + ' available for commitment across all locations (' + backordered + ' back ordered, ' + onorder + ' on order).';
    return '' + itemname + ': You have only ' + onhand + '' + unittext + ' available for commitment, (' + backordered + ' back ordered, ' + onorder + ' on order).';
}

function getReorderWarningMessage(locID, useloc, itemtype, itemname, onhandafter, unittext, reorder, onorder) {
    if (itemtype == 'Assembly') {
        if (locID > 0)
            return '' + itemname + ': Time to build. This transaction will leave you with ' + onhandafter + '' + unittext + ' available at this location with a build point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
        if (useloc == true)
            return '' + itemname + ': Time to build. This transaction will leave you with ' + onhandafter + '' + unittext + ' available across all locations with a build point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
        return '' + itemname + ': Time to build. This transaction will leave you with ' + onhandafter + '' + unittext + ' available with a build point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
    }

    if (locID > 0)
        return '' + itemname + ': Time to reorder. This transaction will leave you with ' + onhandafter + '' + unittext + ' available at this location with a reorder point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
    if (useloc == true)
        return '' + itemname + ': Time to reorder. This transaction will leave you with ' + onhandafter + '' + unittext + ' available across all locations with a reorder point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
    return '' + itemname + ': Time to reorder. This transaction will leave you with ' + onhandafter + '' + unittext + ' available with a reorder point of ' + reorder + '' + unittext + ' and ' + onorder + ' on order.';
}

function getShowedWarningId(itemname, locID, unittext) {
    return itemname + '_%_' + locID + unittext;
}

var showedReorderWarning = {};
var showedOnHandWarning = {};

function CheckStockAmounts(itmnam, itmcnt, onhand, reorder, onorder, backordered, itmtyp, useloc, unittext, createpo, createwo) {
    if ((itmtyp != 'InvtPart' && itmtyp != 'Assembly' && itmtyp != 'Kit') || (createpo == 'DropShip' || createpo == 'SpecOrd') || createwo == 'T')
        return;

    var locID = 0;
    if (useloc == true) {
        locID = useInventoryLocationForFulfillment() ? (nlapiGetLineItemField('item', 'inventorylocation') != null ? nlapiGetCurrentLineItemValue('item', 'inventorylocation') : '') : (nlapiGetLineItemField('item', 'location') != null ? nlapiGetCurrentLineItemValue('item', 'location') : (nlapiGetField('location') ? nlapiGetFieldValue('location') : ''));
        if (locID == '' || locID == 'undefined')
            locID = 0;
    }

    if (isNaN(itmcnt))
        return;

    if (isNaN(onhand))
        onhand = 0;

    var showedWarningId = getShowedWarningId(itmnam, locID, unittext);
    if (onhand < itmcnt && showedOnHandWarning[showedWarningId] == null) {
        showedOnHandWarning[showedWarningId] = 'true';
        alert(getOnHandWarningMessage(locID, useloc, itmtyp, itmnam, onhand, unittext, backordered, onorder));
    } else if (itmtyp != 'Kit' && !isNaN(reorder) && onhand - itmcnt <= reorder && showedReorderWarning[showedWarningId] == null && showedOnHandWarning[showedWarningId] == null) {
        showedReorderWarning[showedWarningId] = 'true';
        alert(getReorderWarningMessage(locID, useloc, itmtyp, itmnam, onhand - itmcnt, unittext, reorder, onorder));
    }
}

function CheckStock(useloc) {
    var itemtype = getItemType();
    if (itemtype == 'InvtPart' || itemtype == 'Assembly' || itemtype == 'Kit') {

        if (nlapiGetLineItemField('item', 'quantityavailable') == null || nlapiGetCurrentLineItemValue('item', 'quantityavailable') == '')
            return;
        if (nlapiGetLineItemField('item', 'matrixtype') != null && nlapiGetCurrentLineItemValue('item', 'matrixtype') == 'PARENT')
            return;

        var itemfldtext = nlapiGetCurrentLineItemText('item', 'item');

        // make sure stock warning uses correct units
        var unittext = '';
        if (nlapiGetLineItemField('item', 'units_display') != null) {
            unittext = (nlapiGetCurrentLineItemValue('item', 'units_display').length > 0) ? (' ' + nlapiGetCurrentLineItemValue('item', 'units_display')) : '';
        }
        var createpo = (nlapiGetLineItemField('item', 'createpo') != null ? nlapiGetCurrentLineItemValue('item', 'createpo') : '');
        var createwo = (nlapiGetLineItemField('item', 'createwo') != null ? nlapiGetCurrentLineItemValue('item', 'createwo') : 'F');
        CheckStockAmounts(itemfldtext, parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')), parseFloat(nlapiGetCurrentLineItemValue('item', 'quantityavailable')), parseFloat(nlapiGetCurrentLineItemValue('item', 'reorder')), parseFloat(nlapiGetCurrentLineItemValue('item', 'onorder')), parseFloat(nlapiGetCurrentLineItemValue('item', 'backordered')), itemtype, useloc, unittext, createpo, createwo);
    }
}

function CheckDistrib() {
    var itemtype = getItemType();
    if (itemtype == 'InvtPart' || itemtype == 'Assembly') {
        if (nlapiGetCurrentLineItemValue('item', 'ddistrib') == null || nlapiGetCurrentLineItemValue('item', 'ddistrib') == '')
            alert('The item you selected has not been distributed as of the date of this transaction. Consequently any location associated with the item will be erased when the transaction is saved.');
    }
}

function CheckRate(rateField) {
    var itemtype = getItemType();
    if ((itemtype == 'Group' || itemtype == 'Subtotal' || itemtype == 'Description') && nlapiGetCurrentLineItemValue('item', rateField).length > 0) {
        alert('Rate not allowed for this item.');
        nlapiSetCurrentLineItemValue('item', rateField, '', false);
    }
}


function SyncQtyRate() {

    if (!(hasItemMachField('rateschedule') && hasItemMachField('quantity')))
        return;

    if (itemMachCurrentLineValueNotEmpty('orderdoc') || itemMachCurrentLineValueNotEmpty('srcline'))
        return;

    var qty = getItemMachFloat('quantity');

    if (itemMachCurrentLineValueNotEmpty('oqpbucket')) {

        var oqpbucket = getItemMachValue('oqpbucket');
        var linecount = nlapiGetLineItemCount('item');
        var linenum = nlapiGetCurrentLineItemIndex('item');
        for (var j = 1; j <= linecount; j++) {
            var lineQty = getEncodedItemFloat(j, 'quantity');
            if (j != linenum && getEncodedItemValue(j, 'oqpbucket') == oqpbucket &&
                lineQty > 0) {
                qty += lineQty;
            }
        }
    }
    var bCustomPriceLevel = hasItemMachField('price') && getItemMachFloat('price') == -1;

    if (itemMachCurrentLineValueNotEmpty('rateschedule') && !isNaN(qty) && !bCustomPriceLevel) {
        var schedstr = getItemMachValue('rateschedule');
        var marginal = 'T' == getItemMachValue('marginal');

        var rateField = taxInclusivePricingHelper.getEditableFieldName('rate');
        nlapiSetCurrentLineItemValue('item', rateField, format_rate(round_float(getQtyRate(schedstr, qty, marginal))), true);


    }
}

function SyncQtyPurchRate() {
    // Make sure all the fields are there. Otherwise, bail out.
    if (!(nlapiGetLineItemField('item', 'poratesched') != null && nlapiGetLineItemField('item', 'quantity') != null))
        return;
    var schedstr = nlapiGetCurrentLineItemValue('item', 'poratesched');
    var qty = parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity'));
    var marginal = 'T' == nlapiGetCurrentLineItemValue('item', 'pomarginal');
    var overallqtydisc = nlapiGetCurrentLineItemValue('item', 'pooverallqtydisc');

    if (overallqtydisc.length > 0) {
        var linecount = nlapiGetLineItemCount('item');
        var linenum = nlapiGetCurrentLineItemIndex('item');
        var vendor = parseInt(nlapiGetCurrentLineItemValue('item', 'povendor'));
        var qtygroup = parseInt(nlapiGetCurrentLineItemValue('item', 'poqtygroup'));
        var createpo = nlapiGetCurrentLineItemValue('item', 'createpo');
        if (vendor > 0) {
            for (var j = 1; j <= linecount; j++)
                if (j != linenum && getEncodedValue('item', j, 'pooverallqtydisc') == overallqtydisc && parseInt(getEncodedValue('item', j, 'poqtygroup')) == qtygroup && parseInt(getEncodedValue('item', j, 'povendor')) == vendor && ((getEncodedValue('item', j, 'createpo').length == 0 && createpo.length == 0) || getEncodedValue('item', j, 'createpo') == createpo) && parseFloat(getEncodedValue('item', j, 'quantity')) > 0) qty += parseFloat(getEncodedValue('item', j, 'quantity'));
        }
    }

    if (schedstr.length > 0 && !isNaN(qty)) {
        nlapiSetCurrentLineItemValue('item', 'porate', format_currency(round_float(getQtyRate(schedstr, qty, marginal)), true));
    }
}

function CheckAmount() {
    var itemtype = getItemType();
    if (itemtype == 'Payment')
        nlapiSetCurrentLineItemValue('item', 'amount', format_currency(-Math.abs(parseFloat(nlapiGetCurrentLineItemValue('item', 'amount')))), false);
    else if ((itemtype == 'Group' || itemtype == 'Subtotal' || itemtype == 'Description') && nlapiGetCurrentLineItemValue('item', 'amount').length > 0) {
        alert('Amount not allowed for this item.');
        nlapiSetCurrentLineItemValue('item', 'amount', '', false);
    }
}

function CheckBillingSchedule() {
    var itemtype = getItemType();
    if (!billingScheduleIsAllowedForItemType(itemtype) && nlapiGetCurrentLineItemValue('item', 'billingschedule').length > 0) {
        alert('Billing Schedule not allowed for this item.');
        nlapiSetCurrentLineItemValue('item', 'billingschedule', '', false);
    }
}

function billingScheduleIsAllowedForItemType(itemtype) {
    return !(itemtype == 'Group' || itemtype == 'Subtotal' || itemtype == 'Description' || itemtype == 'Discount' || itemtype == 'Markup' || itemtype == 'Payment');
}

function CheckCount() {
    var itemtype = getItemType();
    if ((itemtype == 'InvtPart' || itemtype == 'Assembly') && nlapiGetCurrentLineItemValue('item', 'quantity').length > 0 && parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) < 0) {
        if (itemtype == 'InvtPart')
            alert('Inventory items must have a positive quantity.');
        else
            alert('Assemblies must have a positive quantity.');

        nlapiSetCurrentLineItemValue('item', 'quantity', '', false);
        return false;
    }

    if (getTransactionType() == 'trnfrord' && nlapiGetCurrentLineItemValue('item', 'quantity').length > 0 && parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) <= 0) {
        alert('Transfer Order items must have a positive count.');
        nlapiSetCurrentLineItemValue('item', 'quantity', '', false);
        return false;
    }

    if (getTransactionType() == 'purchreq' && (itemtype == 'InvtPart' || itemtype == 'Assembly')) {
        if (nlapiGetLineItemField('item', 'estimatedamount') != null && nlapiGetCurrentLineItemValue('item', 'estimatedamount').length > 0 && parseFloat(nlapiGetCurrentLineItemValue('item', 'estimatedamount')) < 0) {
            if (itemtype == 'InvtPart')
                alert('Inventory items must have a positive amount.');
            else
                alert('Assemblies must have a positive amount.');
            nlapiSetCurrentLineItemValue('item', 'estimatedamount', '', false);
            return false;
        }
    }

    var bCheckCommitted = nlapiGetField('checkcommitted') != null && nlapiGetFieldValue('checkcommitted') == 'T';

    if (bCheckCommitted && (itemtype == 'InvtPart' || itemtype == 'Assembly') && nlapiGetCurrentLineItemValue('item', 'quantity').length > 0 && parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) > parseFloat(nlapiGetCurrentLineItemValue('item', 'quantitycommitted'))) {
        alert('You cannot fulfill more than the committed quantity.');
        nlapiSetCurrentLineItemValue('item', 'quantity', nlapiGetCurrentLineItemValue('item', 'quantitycommitted'), false);
        return false;
    }
    if ((itemtype == 'InvtPart' || itemtype == 'Assembly') && nlapiGetLineItemField('item', 'amount') != null && nlapiGetCurrentLineItemValue('item', 'amount').length > 0 && parseFloat(nlapiGetCurrentLineItemValue('item', 'amount')) < 0) {
        if (itemtype == 'InvtPart')
            alert('Inventory items must have a positive amount.');
        else
            alert('Assemblies must have a positive amount.');
        nlapiSetCurrentLineItemValue('item', 'amount', '', false);
        return false;
    } else if (itemtype == 'GiftCert') {
        if (nlapiGetCurrentLineItemValue('item', 'quantity').length == 0) {
            nlapiSetCurrentLineItemValue('item', 'quantity', '1', false);
        } else if (parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) != 1) {
            alert('Gift Certificate quantity must equal 1');
            nlapiSetCurrentLineItemValue('item', 'quantity', '1', false);
            return false;
        }
    } else if (!(itemtype == 'EndGroup' || itemtype == 'Payment' || itemtype == 'Subtotal' || itemtype == 'Discount' || itemtype == 'Markup' || itemtype == 'Description' || itemtype.length == 0)) {
        if (nlapiGetCurrentLineItemValue('item', 'quantity').length == 0) {
            nlapiSetCurrentLineItemValue('item', 'quantity', nlapiGetLineItemField('item', 'minqty') != null && nlapiGetCurrentLineItemValue('item', 'minqty').length > 0 ? nlapiGetCurrentLineItemValue('item', 'minqty') : '1', false);


            if (hasLegacyMachine() && document.activeElement == document.forms['item_form'].elements['quantity'])
                document.forms['item_form'].elements['quantity'].select();
        }
    } else if (itemtype.length != 0) {
        if (nlapiGetCurrentLineItemValue('item', 'quantity').length > 0) {
            alert('Quantity not allowed for this item.');
            nlapiSetCurrentLineItemValue('item', 'quantity', '', false);
            return false;
        }
    }

    if (nlapiGetLineItemField('item', 'quantity') != null && nlapiGetCurrentLineItemValue('item', 'quantity').length > 0) {
        var qty = parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity'));
        if (qty != Math.round(qty * 100000) / 100000) {
            alert('Quantity can not have more than 5 decimal places.');
            nlapiSetCurrentLineItemValue('item', 'quantity', Math.round(qty * 100000) / 100000, false);
            return false;
        }
    }

    return true;
}

function CheckDropShipSpecialOrderQty(bKeepDropShipQtyInSync, bKeepSpecialOrderQtyInSync) {
    if ((((hasItemMachField('isdropshiporderline') && getItemMachValue('isdropshiporderline') == 'T') || (hasItemMachField('isspecialorderline') && getItemMachValue('isspecialorderline') == 'T')) && getItemMachValue('dropshipwarningdisplayed') != 'T') &&
        ((hasItemMachField('quantity') && getItemMachValue('quantity').length > 0 && getItemMachValue('quantity') != getItemMachValue('origquantity')) ||
            (hasItemMachField('units') && getItemMachValue('units').length > 0 && getItemMachValue('units') != getItemMachValue('origunits')))
    ) {
        if ((!bKeepDropShipQtyInSync && !bKeepSpecialOrderQtyInSync) || getItemMachValue('dropshiporderhasbeenshiprecv') == 'T')
            alert('If you edit the quantity of a drop-ship or special order item on either a sales order or a purchase order, verify that the sales order and corresponding purchase order both show the same quantity. If the sales order and purchase order quantities do not match, the item is no longer treated as a drop shipment or special order and your inventory may be affected.');
        else if (getTransactionType() == 'salesord')
            alert('When you change the sales order quantity, the purchase order quantity and price will be adjusted based on this change.');
        else if (getTransactionType() == 'purchord')
            alert('When you change the purchase order quantity, the sales order quantity and price will be adjusted based on this change.');
        setItemMachValue('dropshipwarningdisplayed', 'T');
    }
}

function CheckInterCompanyQty() {
    if (hasItemMachField('isintercoorderline') && getItemMachValue('isintercoorderline') == 'T' && getItemMachValue('intercowarningdisplayed') != 'T' &&
        (hasItemMachField('quantity') && getItemMachValue('quantity').length > 0 && getItemMachValue('quantity') != getItemMachValue('intercoorderorigqty'))) {
        if (getTransactionType() == 'salesord')
            alert('When you change the intercompany sales order quantity, the intercompany purchase order quantity and price will be adjusted based on this change.');
        else if (getTransactionType() == 'purchord')
            alert('When you change the intercompany purchase order quantity, the intercompany sales order quantity and price will be adjusted based on this change.');
        setItemMachValue('intercowarningdisplayed', 'T');
    }
}

function CheckMinCount(dofocus) {
    if (nlapiGetLineItemField('item', 'minqty') != null && nlapiGetCurrentLineItemValue('item', 'minqty').length > 0) {
        if (nlapiGetCurrentLineItemValue('item', 'quantity').length == 0 || parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) < parseFloat(nlapiGetCurrentLineItemValue('item', 'minqty')) && shouldDoMinCountCheck()) {
            var msg = 'The minimum quantity for this item is {1}.';
            alert(msg.replace(/\{1\}/, nlapiGetCurrentLineItemValue('item', 'minqty')));
            if (dofocus && hasLegacyMachine()) {
                var form = document.forms['item_form'];
                form.elements['quantity'].focus();
                form.elements['quantity'].select();
                NS.form.setValid(false);
            }
            return false;
        }
    } else if (getTransactionType() == 'blankord' && nlapiGetLineItemField('item', 'quantityordered') != null) {
        var qtyOrdered = parseFloat(getItemMachValue('quantityordered'));
        if (nlapiGetCurrentLineItemValue('item', 'quantity').length == 0 || parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity')) < qtyOrdered) {
            alert('The quantity cannot be less than the quantity ordered.');
            if (dofocus && hasLegacyMachine()) {
                var form = document.forms['item_form'];
                form.elements['quantity'].focus();
                form.elements['quantity'].select();
                NS.form.setValid(false);
            }
            return false;
        }
    }
    return true;
}

function shouldDoMinCountCheck() {
    // Issue 142168
    var transactionType = getTransactionType();
    return !(transactionType == 'custcred' || transactionType == 'cashrfnd' ||
        ((transactionType == 'custinvc' || transactionType == 'cashsale') && nlapiGetCurrentLineItemValue('item', 'orderline') != null && nlapiGetCurrentLineItemValue('item', 'orderline').length != 0) ||
        (transactionType == 'rtnauth' && nlapiGetContext().getPreference("ENFORCE_MIN_QUANTITY_RET_AUTH") == 'F'));
}

function CheckStockMultiple(groupstart, groupend, useloc) {
    for (var i = groupstart; i < groupend; i++) {
        var unittext = '';
        if (hasEncodedField('item', 'units_display')) {
            unittext = getEncodedValue('item', i, 'units_display');
            if (unittext.length != 0)
                unittext = ' ' + unittext;
        }

        CheckStockAmounts(hasEncodedField('item', 'item_display') ? getEncodedValue('item', i, 'item_display') : nlapiGetLineItemText('item', 'item', i),
            parseFloat(getEncodedValue('item', i, 'quantity')),
            parseFloat(getEncodedValue('item', i, 'quantityavailable')),
            parseFloat(getEncodedValue('item', i, 'reorder')),
            parseFloat(getEncodedValue('item', i, 'onorder')),
            parseFloat(getEncodedValue('item', i, 'backordered')),
            getEncodedValue('item', i, 'itemtype'),
            useloc,
            unittext,
            (hasEncodedField('item', 'createpo') ? getEncodedValue('item', i, 'createpo') : ''),
            (hasEncodedField('item', 'createwo') ? getEncodedValue('item', i, 'createwo') : 'F'))
    }
}

function checkComponentQuantityChange() {
    var quantity = parseFloat(nlapiGetCurrentLineItemValue('item', 'quantity'));
    var usedInBuildQuantity = parseFloat(getItemMachValue('quantityfulfilled'));

    return checkComponentQuantity(quantity, usedInBuildQuantity);
}

function checkComponentYieldQuantityChange() {
    if (itemMachCurrentLineValueNotEmpty('componentyield') && itemMachCurrentLineValueNotEmpty('bomquantity')) {
        var quantity = getComponentYieldQuantity();
        var usedInBuildQuantity = parseFloat(nlapiGetCurrentLineItemValue('item', 'quantityfulfilled'));

        return checkComponentQuantity(quantity, usedInBuildQuantity);
    }
    return true;
}

function checkComponentQuantity(quantity, usedInBuildQuantity) {
    if (quantity < usedInBuildQuantity) {
        alert('The selected item is used in other builds associated with this work order. The item quantity cannot be lower than what has already been issued to these related builds. To proceed, amend the relevant issue component transaction on the related build.');
        return false;
    }
    return true;
}

function checkItemIsChangedAfterRevenueElementCreation() {
    if (itemMachCurrentLineValueNotEmpty('attachedtorevenueelement') && nlapiGetCurrentLineItemValue('item', 'attachedtorevenueelement') == 'T') {
        alert('You cannot change the item on this line because it has an existing revenue element. Delete the line, and enter a new line to correct the item.');
        return false;
    }
    return true;
}

function SetupGroup(groupstart, groupend, useloc) {

    var i;
    if (hasEncodedField('item', 'class')) {

        var bRequired = item_machine.getElementRequired('class');
        var iEndIndex = bRequired ? groupend + 1 : groupend;

        for (i = groupstart; i < iEndIndex; i++) {

            if (getEncodedValue('item', groupstart - 1, 'class').length != 0)
                setEncodedValue('item', i, 'class', getEncodedValue('item', groupstart - 1, 'class'));
        }


        if (!bRequired)
            setEncodedValue('item', groupstart - 1, 'class', '');
    }
    if (hasEncodedField('item', 'department')) {

        var bRequired = item_machine.getElementRequired('department');
        var iEndIndex = bRequired ? groupend + 1 : groupend;

        for (i = groupstart; i < iEndIndex; i++) {

            if (getEncodedValue('item', groupstart - 1, 'department').length != 0)
                setEncodedValue('item', i, 'department', getEncodedValue('item', groupstart - 1, 'department'));
        }


        if (!bRequired)
            setEncodedValue('item', groupstart - 1, 'department', '');
    }
    if (hasEncodedField('item', 'location')) {

        var bRequired = item_machine.getElementRequired('location');
        var iEndIndex = bRequired ? groupend + 1 : groupend;

        for (i = groupstart; i < iEndIndex; i++) {

            if (getEncodedValue('item', groupstart - 1, 'location').length != 0) {
                setEncodedValue('item', i, 'location', getEncodedValue('item', groupstart - 1, 'location'));
                setEncodedValue('item', i, 'location_display', getEncodedValue('item', groupstart - 1, 'location_display'));
            }
        }

        if (!bRequired) {
            setEncodedValue('item', groupstart - 1, 'location', '');
            setEncodedValue('item', groupstart - 1, 'location_display', '');
        }
    }

    if (useInventoryLocationForFulfillment() && hasEncodedField('item', 'inventorylocation')) {

        var iEndIndex = groupend;

        for (i = groupstart; i < iEndIndex; i++) {

            if (getEncodedValue('item', groupstart - 1, 'inventorylocation').length != 0) {
                setEncodedValue('item', i, 'inventorylocation', getEncodedValue('item', groupstart - 1, 'inventorylocation'));
                setEncodedValue('item', i, 'inventorylocation_display', getEncodedValue('item', groupstart - 1, 'inventorylocation_display'));
            }
        }

        setEncodedValue('item', groupstart - 1, 'inventorylocation', '');
        setEncodedValue('item', groupstart - 1, 'inventorylocation_display', '');
    }

    if (useInventoryLocationForFulfillment() && hasEncodedField('item', 'inventorysubsidiary')) {

        var iEndIndex = groupend;

        for (i = groupstart; i < iEndIndex; i++) {

            if (getEncodedValue('item', groupstart - 1, 'inventorysubsidiary').length != 0)
                setEncodedValue('item', i, 'inventorysubsidiary', getEncodedValue('item', groupstart - 1, 'inventorysubsidiary'));
        }

        setEncodedValue('item', groupstart - 1, 'inventorysubsidiary', '');
    }

    if (hasEncodedField('item', 'isbillable')) {
        for (i = groupstart; i < groupend; i++)
            setEncodedValue('item', i, 'isbillable', getEncodedValue('item', groupstart - 1, 'isbillable'));
        setEncodedValue('item', groupstart - 1, 'isbillable', 'F');
    }
    if (hasEncodedField('item', 'customer')) {
        for (i = groupstart; i < groupend; i++)
            setEncodedValue('item', i, 'billto', getEncodedValue('item', groupstart - 1, 'billto'));
        setEncodedValue('item', groupstart - 1, 'billto', '');
    }
    if (hasEncodedField('item', 'job')) {
        for (i = groupstart; i < groupend; i++) {
            setEncodedValue('item', i, 'job_display', getEncodedValue('item', groupstart - 1, 'job_display'));
            setEncodedValue('item', i, 'job', getEncodedValue('item', groupstart - 1, 'job'));
        }
        setEncodedValue('item', groupstart - 1, 'job', '');
        setEncodedValue('item', groupstart - 1, 'job_display', '');
    }
    var fldnames = getFieldNamesArray('item');
    var fldflags = splitIntoCells(nlapiGetFieldValue('itemflags'));
    var n;
    for (n = 0; n < fldnames.length; n++)
        if (fldnames[n].indexOf('custcol') == 0) {
            for (i = groupstart; i < groupend; i++)

                if (getEncodedValue('item', groupstart - 1, fldnames[n]).length > 0 && getEncodedValue('item', groupstart - 1, fldnames[n]) != 'F' && getEncodedValue('item', i, fldnames[n]).length == 0)
                    setEncodedValue('item', i, fldnames[n], getEncodedValue('item', groupstart - 1, fldnames[n]));
            if ((fldflags[n] & 16) == 0)
                setEncodedValue('item', groupstart - 1, fldnames[n], '');
        }
    if (hasEncodedField('item', 'expectedshipdate'))
        initializeExpectedShipmentDateForGroup(groupstart, groupend);
    if (hasEncodedField('item', 'expectedreceiptdate'))
        setDefaultExpectedReceiptDateForGroup(groupstart, groupend);
    if (hasEncodedField('item', 'orderallocationstrategy'))
        initializeOrderAllocationStrategyForGroup(groupstart, groupend);
    setEncodedValue('item', groupstart - 1, 'amount', '');
    setEncodedValue('item', groupstart - 1, 'groupsetup', 'T');

    if (nlapiGetContext().getFeature('STOREPICKUP')) {
        var itemFulfillmentChoiceFieldId = 'itemfulfillmentchoice';
        if (hasEncodedField('item', itemFulfillmentChoiceFieldId)) {

            var bRequired = item_machine.getElementRequired(itemFulfillmentChoiceFieldId);
            var iEndIndex = bRequired ? groupend + 1 : groupend;

            var groupFulfillmentChoice = getEncodedValue('item', groupstart - 1, itemFulfillmentChoiceFieldId);
            if (groupFulfillmentChoice.length != 0) {
                for (i = groupstart; i < iEndIndex; i++) {
                    if (storePickUpConnector.isFulfillableLine(i)) {
                        setEncodedValue('item', i, itemFulfillmentChoiceFieldId, groupFulfillmentChoice);
                    }
                }
            }

            if (!bRequired) {
                setEncodedValue('item', groupstart - 1, itemFulfillmentChoiceFieldId, '');
            }

            storePickUpConnector.setExcludeFromRateRequestMultiple(groupstart, groupend);
        }
    }
}

function FillPctQty(sync) {
    var linecount = nlapiGetLineItemCount('item');
    var percent = prompt('Please enter a numeric percentage:', '100');
    if (percent == '' || percent == null) {
        return;
    }
    percent = parseFloat(percent);
    if (isNaN(percent)) {
        alert('The percentage you entered was invalid.');
        return;
    }
    for (var i = 1; i <= linecount; i++) {
        var ordered = parseFloat(getEncodedValue('item', i, 'quantityordered'));
        if (!isNaN(ordered)) {
            var newqty = percent / 100 * ordered;
            newqty = Math.round(newqty * 100000) / 100000;
            var oldqty = parseFloat(getEncodedValue('item', i, 'quantity'));
            setEncodedValue('item', i, 'currentpercent', percent + '%');
            setEncodedValue('item', i, 'quantity', newqty);
            if (sync) {
                if (hasEncodedField('item', 'quantityfulfilled')) {
                    var quantityfulfilled = parseFloat(getEncodedValue('item', i, 'quantityfulfilled'));
                    if (isNaN(oldqty)) oldqty = 0;
                    if (isNaN(quantityfulfilled)) quantityfulfilled = 0;
                    quantityfulfilled = quantityfulfilled + newqty - oldqty;
                    setEncodedValue('item', i, 'quantityfulfilled', quantityfulfilled);
                    if (hasEncodedField('item', 'percentcomplete') && ordered > 0)
                        setEncodedValue('item', i, 'percentcomplete', quantityfulfilled / ordered * 100 + '%');
                }
            }
            setEncodedValue('item', i, 'amount', format_currency(getEncodedValue('item', i, 'rate') * getEncodedValue('item', i, 'quantity')));
        }
    }
    Item_Machine_Recalc();
    if (hasLegacyMachine()) {
        item_machine.buildtable();
    }
    synctotal();
}





var bucketsDeleted = [];

function Item_Machine_Recalc(onload) {
    if (getTransactionType() == 'workord' && workOrderConnector.isInternal())
        return;



    var oqpHandler = new function() {
        var rateField = taxInclusivePricingHelper.getEditableFieldName('rate');
        var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');

        var bucketTotals = [];
        var bucketsNeedingNewRate = [];
        var isUseUnitConversionRatePreferenceEnabled = nlapiGetContext().getPreference("USE_UNIT_CONVERSION_RATE") === 'T';

        var skipOQPRecalcForCurrentLine;
        var isDynamic;
        var currentLine;

        this.init = function() {
            currentLine = nlapiGetCurrentLineItemIndex('item');

            isDynamic = currentLine > 0 && currentLine <= linecount;
            skipOQPRecalcForCurrentLine = isDynamic &&
                bucketsDeleted.length == 0 &&
                !(lineImpactsOQP(currentLine) && bucketOrQtyChanged(currentLine));

            if (!skipOQPRecalcForCurrentLine) {
                setDeletedBucketsNeedUpdate();
                loadBucketTotalsAndSetNeedsRecalc(1);
            }

        };

        function getBucket(linenum) {
            return getEncodedItemValue(linenum, 'oqpbucket');
        }

        function getOrigBucket(linenum) {
            return getEncodedItemValue(linenum, 'initoqpbucket');
        }

        function setOrigBucketNeedsRecalc(linenum) {
            var origBucket = getOrigBucket(linenum);
            setBucketNeedsRecalc(origBucket);
        }

        function setBucketNeedsRecalc(bucket) {
            bucketsNeedingNewRate[bucket] = true;
        }

        function bucketNeedsRecalc(linenum) {
            var qtyGroupKey = getBucket(linenum);
            var needsRecalc = bucketsNeedingNewRate[qtyGroupKey];
            if (isNaN(needsRecalc)) {
                needsRecalc = false;
            }

            return needsRecalc;

            function bucketChanged(linenum) {
                return fieldChanged(linenum, 'oqpbucket');
            }

            function qtyChanged(linenum) {
                return floatFieldChanged(linenum, 'quantity');
            }

            function fieldChanged(linenum, fieldname) {
                var lineCommitted = getEncodedItemValue(linenum, fieldname);
                var lineInit = getEncodedItemValue(linenum, 'init' + fieldname);
                var updated = lineInit != lineCommitted;
                return updated;
            }

            function floatFieldChanged(linenum, fieldname) {
                var lineCommitted = getEncodedItemFloat(linenum, fieldname);
                var lineInit = getEncodedItemFloat(linenum, 'init' + fieldname);
                var updated = lineInit != lineCommitted && !(isNaN(lineInit) && isNaN(lineCommitted));
                return updated;
            }


            function bucketOrQtyChanged(linenum) {
                return bucketChanged(linenum) || qtyChanged(linenum);
            }

            function setDeletedBucketsNeedUpdate() {
                for (var i = 0; i < bucketsDeleted.length; i++) {
                    setBucketNeedsRecalc(bucketsDeleted[i]);
                }
                if (bucketsDeleted.length > 0)
                    bucketsDeleted = [];
            }


            function loadBucketTotalsAndSetNeedsRecalc(linenum) {

                var updateInitValues = function(linenum) {
                    var origQtyVal = nlapiGetLineItemValue('item', 'quantity', linenum);
                    setEncodedValue('item', linenum, 'initquantity', origQtyVal);

                    if (hasItemMachField('oqpbucket')) {
                        var origOQPBucketVal = nlapiGetLineItemValue('item', 'oqpbucket', linenum);
                        setEncodedValue('item', linenum, 'initoqpbucket', origOQPBucketVal);
                    }
                };

                for (var j = linenum; j <= linecount; j++) {
                    var qty = getEncodedItemFloat(j, 'quantity');

                    if (!lineImpactsOQP(j) || qty == 0) {
                        continue;
                    }

                    var bucketKey = getBucket(j);
                    var bucketHasChanged = bucketChanged(j);
                    var qtyHasChanged = qtyChanged(j);
                    var wasChanged = (bucketHasChanged || qtyHasChanged);

                    if (isUseUnitConversionRatePreferenceEnabled) {
                        var rate = getLineValue(j, 'unitconversionrate');
                        if (!rate) rate = 1;
                        qty = qty * rate;
                    }

                    if (isNaN(bucketTotals[bucketKey])) {
                        bucketTotals[bucketKey] = qty;
                    } else {
                        bucketTotals[bucketKey] += qty;
                    }


                    if (bucketHasChanged) {
                        setOrigBucketNeedsRecalc(j);
                    }

                    if (wasChanged) {
                        setBucketNeedsRecalc(bucketKey);
                    }

                    if (existLineToUpdateInitValues(j)) {
                        updateInitValues(j);
                        removeLineToUpdateInitValues(j)
                    }

                }

            }

            function getBucketQty(linenum) {
                var bucketKey = getBucket(linenum);
                var qty = bucketTotals[bucketKey];

                if (isUseUnitConversionRatePreferenceEnabled) {
                    var rate = getLineValue(linenum, 'unitconversionrate');
                    if (!rate) rate = 1;
                    qty = qty / rate;
                }

                return qty;
            }

            function isManualRate(linenum) {
                return (getEncodedItemFloat(linenum, 'price') == -1) ||
                    (round_currency(getEncodedItemFloat(linenum, rateField) * getEncodedItemFloat(linenum, 'quantity')) !=
                        round_currency(getEncodedItemFloat(linenum, amountField)));
            }

            function lineImpactsOQP(linenum) {
                return (hasEncodedItemValue(linenum, 'oqpbucket') || hasEncodedItemValue(linenum, 'initoqpbucket'));
            }

            function lineIsFromTransform(linenum) {
                return hasEncodedItemValue(linenum, 'orderdoc');
            }

            this.handleLineRecalc = function(linenum) {
                if (!skipOQPRecalcForCurrentLine &&
                    lineImpactsOQP(linenum) &&
                    bucketNeedsRecalc(linenum) &&
                    !lineIsFromTransform(linenum) &&
                    !isManualRate(linenum) &&
                    getTransactionType() != 'rtnauth'
                ) {
                    var overallQty = getBucketQty(linenum);
                    var rateIsMarginal = 'T' == getEncodedItemValue(linenum, 'marginal');
                    var rate = getQtyRate(getEncodedItemValue(linenum, 'rateschedule'), overallQty, rateIsMarginal);
                    var amount = rate * getEncodedItemFloat(linenum, 'quantity');
                    setEncodedItemValue(linenum, rateField, format_currency(round_float(rate), true));
                    setEncodedItemValue(linenum, amountField, format_currency(amount));
                }
            }
        }



        var isVat;
        if (nlapiGetContext().getFeature('ADVTAXENGINE')) {
            var nexusCountry = nlapiGetFieldValue('nexus_country');
            isVat = nexusCountry != null && nexusCountry != 'US' && nexusCountry != 'CA';
        } else {
            var edition = nlapiGetFieldValue('edition');
            isVat = edition != null && edition != 'US' && edition != 'CA';
        }
        var vatrate;
        var amount;
        var linecount = nlapiGetLineItemCount('item');
        var ingroup = false;
        var itemqtys = [];
        var parentqtys = [];
        var scheduleqtys = [];
        var poitemqtys = [];
        var poparentqtys = [];
        var poscheduleqtys = [];


        oqpHandler.init();


        for (var i = 1; i <= linecount; i++) {


            oqpHandler.handleLineRecalc(i);


            var pooverallqtydisc = getEncodedValue('item', i, 'pooverallqtydisc');
            if (pooverallqtydisc && pooverallqtydisc.length > 0) {
                var povendor = parseInt(getEncodedValue('item', i, 'povendor'));
                var poqtygroup = parseInt(getEncodedValue('item', i, 'poqtygroup'));
                var poqty = eval('po' + pooverallqtydisc.toLowerCase() + 'qtys[createpo+"_"+povendor+"_"+poqtygroup]');
                var createpo = getEncodedValue('item', i, 'createpo');
                if (!(poqty >= 0)) {
                    poqty = 0;
                    for (var j = 1; j <= linecount; j++)
                        if (getEncodedValue('item', j, 'pooverallqtydisc') == pooverallqtydisc &&
                            parseInt(getEncodedValue('item', j, 'poqtygroup')) == poqtygroup &&
                            parseInt(getEncodedValue('item', j, 'povendor')) == povendor &&
                            ((getEncodedValue('item', j, 'createpo').length == 0 && createpo.length == 0) || getEncodedValue('item', j, 'createpo') == createpo) &&
                            parseFloat(getEncodedValue('item', j, 'quantity')) > 0) {
                            poqty += parseFloat(getEncodedValue('item', j, 'quantity'));
                        }
                    eval('po' + pooverallqtydisc.toLowerCase() + 'qtys[createpo+"_"+povendor+"_"+poqtygroup] = poqty');
                }
                var porate = getQtyRate(getEncodedValue('item', i, 'poratesched'), poqty, 'T' == getEncodedValue('item', i, 'pomarginal'));
                setEncodedValue('item', i, 'porate', format_currency(round_float(porate), true));
            }

            if (getEncodedValue('item', i, 'itemtype') == 'Discount' || getEncodedValue('item', i, 'itemtype') == 'Markup') {
                if (i == 1) {
                    if (getEncodedValue('item', i, 'rate').indexOf('%') != -1)
                        setEncodedValue('item', i, 'amount', format_currency(0));
                    continue;
                }


                var basisline = i - 1;
                for (var j = i - 1; j > 0; j--) {
                    if (getEncodedValue('item', j, 'itemtype') != 'Discount' && getEncodedValue('item', j, 'itemtype') != 'Markup') {
                        basisline = j;
                        break;
                    }
                }

                var basis = parseFloat(getEncodedValue('item', basisline, 'amount'));
                var asbasis = parseFloat(getEncodedValue('item', basisline, 'altsalesamt'));

                if (!isNaN(basis)) {
                    var rate = parseFloat(getEncodedValue('item', i, 'rate'));
                    if (!isNaN(rate)) {
                        var isRatePct = getEncodedValue('item', i, 'rate').indexOf('%') != -1;
                        var amtstr = format_currency(isRatePct ? rate * basis / 100 : rate);
                        setEncodedValue('item', i, 'amount', amtstr);
                    }

                    if (hasEncodedField('item', 'taxableamt')) {
                        var taxbasis = parseFloat(getEncodedValue('item', basisline, 'taxableamt'));
                        if (isNaN(taxbasis) && getEncodedValue('item', basisline, 'istaxable') == 'T')
                            taxbasis = basis;
                        var discamt = parseFloat(getEncodedValue('item', i, 'amount'));
                        if (!isNaN(discamt))
                            setEncodedValue('item', i, 'taxableamt', isNaN(taxbasis) ? 0 : discamt * taxbasis / basis);
                    }
                }

                if (!isNaN(asbasis)) {
                    var discBasis = (getEncodedValue('item', i, 'rate').indexOf('%') == -1) ? basis : 100;
                    var rate = parseFloat(getEncodedValue('item', i, 'rate'));
                    var asamtstr = (isNaN(rate) ? '' : format_currency(rate * asbasis / discBasis));
                    setEncodedValue('item', i, 'altsalesamt', asamtstr);
                }
            } else if (getEncodedValue('item', i, 'itemtype') == 'Subtotal') {
                if (i == 1) {
                    setEncodedValue('item', i, 'amount', format_currency(0));
                    continue;
                }

                var total = 0;
                var taxabletotal = 0;
                var asatotal = 0;
                var grosstotal = 0;
                var taxtotal = 0;
                var taxAmountFieldName;
                if (hasEncodedField('item', 'taxamount')) {
                    taxAmountFieldName = 'taxamount';
                } else {
                    taxAmountFieldName = 'tax1amt';
                }
                var dotax = hasEncodedField('item', 'taxableamt');
                var subingroup = true;
                var curingroup = true;

                for (var j = i - 1; j > 0; j--) {
                    if (getEncodedValue('item', j, 'itemtype') == 'EndGroup') {
                        subingroup = false;
                        curingroup = true;
                        continue;
                    }

                    if (j == i - 1 && (getEncodedValue('item', j, 'itemtype') == 'Discount' || getEncodedValue('item', j, 'itemtype') == 'Markup') &&
                        getEncodedValue('item', j - 1, 'itemtype') == 'Subtotal') {
                        total = parseFloat(getEncodedValue('item', j, 'amount')) + parseFloat(getEncodedValue('item', j - 1, 'amount'));
                        asatotal = parseFloat(getEncodedValue('item', j, 'altsalesamt')) + parseFloat(getEncodedValue('item', j - 1, 'altsalesamt'));
                        grosstotal = parseFloat(getEncodedValue('item', j, 'grossamt')) + parseFloat(getEncodedValue('item', j - 1, 'grossamt'));
                        taxtotal = parseFloat(getEncodedValue('item', j, taxAmountFieldName)) + parseFloat(getEncodedValue('item', j - 1, taxAmountFieldName));
                        if (dotax)
                            taxabletotal = parseFloat(getEncodedValue('item', j, 'taxableamt')) + parseFloat(getEncodedValue('item', j - 1, 'taxableamt'));
                        break;
                    }

                    if (getEncodedValue('item', j, 'itemtype') == 'Group') {

                        if (subingroup)
                            break;
                        else
                            curingroup = false;
                    } else if ((subingroup || (!subingroup && !curingroup)) && allLinesAreDiscountOrMarkupAfterSubtotal(j))
                        break;

                    if (getEncodedValue('item', j, 'itemtype') == 'Subtotal')
                        continue;

                    var amount = parseFloat(getEncodedValue('item', j, 'amount'));
                    var asamount = parseFloat(getEncodedValue('item', j, 'altsalesamt'));
                    var grossamount = parseFloat(getEncodedValue('item', j, 'grossamt'));
                    var taxAmount = parseFloat(getEncodedValue('item', j, taxAmountFieldName));
                    if (!isNaN(amount)) total += amount;
                    if (!isNaN(asamount)) asatotal += asamount;
                    if (!isNaN(grossamount)) grosstotal += grossamount;
                    if (!isNaN(grossamount)) taxtotal += taxAmount;
                    if (dotax && getEncodedValue('item', j, 'istaxable') == 'T' && !isNaN(amount))
                        taxabletotal += amount;
                }

                amtstr = (isNaN(total) ? '' : format_currency(total));
                setEncodedValue('item', i, 'amount', amtstr);
                var asamtstr = (isNaN(asatotal) ? '' : format_currency(asatotal));
                setEncodedValue('item', i, 'altsalesamt', asamtstr);
                var grossamtstr = (isNaN(grosstotal) ? '' : format_currency(grosstotal));
                setEncodedValue('item', i, 'grossamt', grossamtstr);
                var taxAmountString = (isNaN(taxtotal) ? '' : format_currency(taxtotal));
                if (hasEncodedField('item', taxAmountFieldName))
                    setEncodedValue('item', i, taxAmountFieldName, taxAmountString);

                if (dotax) {
                    amtstr = (isNaN(taxabletotal) ? '' : format_currency(taxabletotal));
                    setEncodedValue('item', i, 'taxableamt', amtstr);
                }
            } else if (i > 1 && getEncodedValue('item', i, 'itemtype') == 'EndGroup') {
                var total = 0;
                var asatotal = 0;
                var grosstotal = 0;
                var tax1total = 0;
                var taxabletotal = 0;
                var dotax = hasEncodedField('item', 'taxableamt');
                var totaldiscingroup = 0.0;

                for (var j = i - 1; j > 0; j--) {
                    if (getEncodedValue('item', j, 'itemtype') == 'Subtotal')
                        continue;
                    if (getEncodedValue('item', j, 'itemtype') == 'Group')
                        break;

                    var amount = parseFloat(getEncodedValue('item', j, 'amount'));
                    var asamount = parseFloat(getEncodedValue('item', j, 'altsalesamt'));
                    var grossamount = parseFloat(getEncodedValue('item', j, 'grossamt'));
                    var tax1amount = parseFloat(getEncodedValue('item', j, 'tax1amt'));

                    if (!isNaN(amount)) total += amount;
                    if (!isNaN(asamount)) asatotal += asamount;
                    if (!isNaN(grossamount)) grosstotal += grossamount;
                    if (!isNaN(tax1amount)) tax1total += tax1amount;

                    if (getEncodedValue('item', j, 'itemtype') == 'Discount' || getEncodedValue('item', j, 'itemtype') == 'Markup')
                        totaldiscingroup += amount;
                    if (dotax && getEncodedValue('item', j, 'istaxable') == 'T' && !isNaN(amount))
                        taxabletotal += amount;
                }

                amtstr = (isNaN(total) ? '' : format_currency(total));
                setEncodedValue('item', i, 'amount', amtstr);
                var asamtstr = (isNaN(asatotal) ? '' : format_currency(asatotal));
                setEncodedValue('item', i, 'altsalesamt', asamtstr);
                var grossamtstr = (isNaN(grosstotal) ? '' : format_currency(grosstotal));
                setEncodedValue('item', i, 'grossamt', grossamtstr);
                var tax1amtstr = (isNaN(tax1total) ? '' : format_currency(tax1total));
                if (hasEncodedField('item', 'tax1amt'))
                    setEncodedValue('item', i, 'tax1amt', tax1amtstr);

                if (dotax) {
                    amtstr = (isNaN(taxabletotal) ? '' : format_currency(taxabletotal));
                    setEncodedValue('item', i, 'taxableamt', amtstr);
                }
                ingroup = false;
            } else if (getEncodedValue('item', i, 'itemtype') == 'Group' && getEncodedValue('item', i, 'groupsetup') == 'T') {
                var noprint = getEncodedValue('item', i, 'printitems') != 'T';
                var closed = getEncodedValue('item', i, 'isclosed') == 'T';
                setEncodedValue('item', i, 'noprint', 'F');

                for (var j = i + 1; j <= linecount; j++) {
                    setEncodedValue('item', j, 'ingroup', 'T');
                    if (noprint)
                        setEncodedValue('item', j, 'noprint', 'T');
                    if (closed) {
                        setEncodedValue('item', j, 'isclosed', 'T');
                        setEncodedValue('item', j, 'groupclosed', 'T');
                    } else setEncodedValue('item', j, 'groupclosed', 'F');
                    if (getEncodedValue('item', j, 'itemtype') == 'EndGroup') {
                        if (!closed) setEncodedValue('item', j, 'isclosed', 'F');
                        break;
                    }
                }

                ingroup = true;
            } else if (nlapiGetContext().getExecutionContext() != 'virtualbrowser' || getEncodedValue('item', i, 'itemtype') != '') {
                setEncodedValue('item', i, 'taxableamt', '');
                if (!ingroup)
                    setEncodedValue('item', i, 'groupid', '');
            }

            if (isVat) {

                if (parseFloat(getEncodedValue('item', i, 'refamt')) != parseFloat(getEncodedValue('item', i, 'amount'))) {
                    amount = parseFloat(getEncodedValue('item', i, 'amount'));
                    vatrate = parseFloat(getEncodedValue('item', i, 'taxrate1'));
                    if (!isNaN(vatrate)) {
                        if (hasEncodedField('item', 'tax1amt')) {
                            setEncodedValue('item', i, 'tax1amt', format_currency((vatrate / 100) * amount));
                        }
                        setEncodedValue('item', i, 'grossamt', format_currency(parseFloat(getEncodedValue('item', i, 'tax1amt')) + amount));
                        setEncodedValue('item', i, 'refamt', getEncodedValue('item', i, 'amount'));
                    }
                }
            }
        }

        calculateAllocation();
        if ('T' == nlapiGetFieldValue('iseitf81on'))
            calculateAllocation('SOFTWARE', 'T');

        Totalling_Machine_Recalc(onload);

        // Recalculate the Fulfillment Choice of the order when changing the item machine
        if (storePickUpConnector.getAllowFulfillmentChoiceRecalcInSalesOrder())
            storePickUpConnector.setFulfillmentChoiceInSalesOrder('itemfulfillmentchoice', 'orderfulfillmentchoice');

        if (nlapiGetContext().getFeature('MULTISHIPTO')) {
            Item_Machine_Recalc_MSR();
        }
    }

    function Item_Machine_Recalc_MSR() {
        //When address book label is updated, propagate new label to all item lines which use updated address book
        var updatedAddressBookId = nlapiGetCurrentLineItemValue('item', 'shipaddress');
        if (updatedAddressBookId != '') {
            var updatedAddressDisplay = nlapiGetCurrentLineItemValue('item', 'shipaddress_display');

            for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
                if (nlapiGetLineItemValue('item', 'shipaddress', i) == updatedAddressBookId) {
                    setEncodedValue('item', i, 'shipaddress_display', updatedAddressDisplay);
                }
            }
        }
    }

    function SalesordItemHasBeenProcessed() {
        var transactionType = getTransactionType();
        return transactionType == 'salesord' && (getItemMachValue('quantityfulfilled') > 0 || getItemMachValue('quantitybilled') > 0 || getItemMachValue('itempicked') == 'T');
    }

    function GetEditLineWarning() {
        var type = getTransactionType();
        var warning = null;
        if ((type == 'purchord' || type == 'salesord' || type == 'trnfrord') && hasEncodedField('item', 'linkedshiprcpt') && hasEncodedField('item', 'linkedordbill')) {
            var shiprcptword = type == 'purchord' ? 'received' : 'fulfilled';
            var ordbillword = 'billed';
            if (getItemMachValue('linkedshiprcpt') == 'T' && getItemMachValue('linkedordbill') == 'T') {
                warning = shiprcptword + " and " + ordbillword;
            } else if (getItemMachValue('linkedordbill') == 'T') {
                warning = ordbillword;
            } else if (hasItemMachField('linkedordrvcom') && getItemMachValue('linkedordrvcom') == 'T') {
                warning = 'revenue committed';
            } else if (hasItemMachField('linkeddropship') && getItemMachValue('linkeddropship') == 'T') {
                warning = 'drop shipped or special ordered';
            } else if (type != 'purchord' && getItemMachValue('itempicked') == 'T' && !(getItemMachValue('linkedshiprcpt') == 'T')) {
                warning = (getItemMachValue('itempacked') == 'T') ? 'packed' : 'picked';
            } else if ((type != 'salesord' && getItemMachValue('linkedshiprcpt') == 'T') || SalesordItemHasBeenProcessed()) {
                warning = shiprcptword;
            } else if (type == 'salesord' && parseInt(getItemMachValue('quantityrequestedtofulfill')) > 0) {
                warning = 'requested';
            }
        } else if (type == 'workord') {
            warning = 'included in build';
        } else if (type == 'rtnauth' && hasItemMachField('linkedordrvcom') && getItemMachValue('linkedordrvcom') == 'T') {
            warning = 'revenue committed';
        } else {
            if (type == 'salesord' && !SalesordItemHasBeenProcessed()) {
                warning = null;
            } else {
                switch (type) {
                    case 'purchord':
                        warning = 'received';
                        break;
                    case 'salesord':
                        warning = 'fulfilled';
                        break;
                    case 'vendauth':
                        warning = 'returned';
                        break;
                    case 'rtnauth':
                        warning = 'Return Authorization';
                        break;
                    case 'purchcon':
                    case 'blankord':
                        warning = 'purchased';
                        break;
                    default:
                        warning = 'reimbursed';
                        break;

                }
            }
        }

        return warning;
    }



    var validateItemLinesMoss = validateItemLinesMoss || function() { return true; }

    function Item_Machine_getLineRate() {
        var rate = parseFloatOrZero(getItemMachValue('unitconversionrate'));
        if (rate == 0) {
            rate = 1;
        }
        return rate;
    }

    function Item_Machine_ValidateLineQuantity() {
        var result = true;

        if (hasEncodedField('item', 'linked') && hasItemMachField('quantitylocked') && getItemMachValue('quantitylocked') > 0) {
            var quantityLocked = parseFloat(getItemMachValue('quantitylocked'));
            var rate = Item_Machine_getLineRate()
            var itemQuantity = parseFloat(getItemMachValue('quantity'));
            itemQuantity = itemQuantity * rate;
            result = itemQuantity >= quantityLocked;
        }

        return result;
    }

    function Item_Machine_GroupItemQuantiesWarning(changed, unchanged) {
        if (changed.length == 0) {
            alert('All members of this group are associated with a wave transaction. The item quantity for each member cannot be decreased below the quantity included in a wave.');
        } else if (unchanged.length > 0) {
            var short_unchanged = unchanged.slice(0, Math.min(5, unchanged.length));
            if (short_unchanged.length < unchanged.length) {
                short_unchanged.push("...");
            }
            var names = "\n\n" + short_unchanged.join("\n") + "\n\n";
            var message = 'One or more members of this group are associated with a wave transaction. Item quantities for the members not associated with waves have been updated. Item quantities for the following members cannot be decreased below the quantities included in a wave:unchangedNamesPlaceholder';
            alert(message.replace("unchangedNamesPlaceholder", names));
        }

    }

    function Item_Machine_ValidateLine() {
        // Section of string codes such as tranTypes or field ids, brought from Java, and reused throughout this function
        var salesOrderTranType = 'salesord';
        var fulfillableFieldId = 'fulfillable';
        var itemFulfillmentChoiceFieldId = 'itemfulfillmentchoice';

        var myAmt = hasItemMachField('amount') ? getItemMachValue('amount') : '';
        if (myAmt != null && myAmt.length > 0 && itemtype == 'Description') {
            alert('You cannot have an amount for that type of item.');
            return false;
        }



        // a value for item is required when it is a new line
        if (getItemMachValue('item') == '' && !getItemMachValue('line')) {
            alert("Please choose an item to add");
            return false;
        }

        if (getTransactionType() != 'workord' && itemMachCurrentLineValueNotEmpty('orderallocationstrategy') && nlapiGetLineItemField('item', 'requesteddate') && nlapiGetCurrentLineItemValue('item', 'requesteddate') == '') {
            alert("Please enter a value for Supply Required By Date");
            return false;
        }

        if (hasItemMachField('orderschedule')) {
            if (!validateOrderScheduleSubrecord_item())
                return false;
        }

        if (!validateItemLinesMoss()) {
            return false;
        }

        if (hasEncodedField('item', 'linked')) {
            if (hasItemMachField('quantitylocked') && getItemMachValue('quantitylocked') > 0) {
                var fields = [
                    { id: 'item', msg: 'You cannot change the item for a line item associated with a wave transaction.' },
                    { id: 'units', msg: 'You cannot change the unit of measure of an item when the line item is associated with a wave transaction.' },
                    { id: 'inventorylocation', msg: 'You cannot change the location in the header or the inventory location of line items associated with a wave transaction.' }
                ];

                if (!nlapiGetContext().getFeature('CROSSSUBSIDIARYFULFILLMENT')) {
                    fields.push({ id: 'location', msg: 'You cannot change the location in the header or the inventory location of line items associated with a wave transaction.' });
                }

                for (var i = 0; i < fields.length; i++) {
                    if (fieldOnItemMachineHasChanges(fields[i].id)) {
                        alert(fields[i].msg);
                        return false;
                    }
                }

                if (!Item_Machine_ValidateLineQuantity()) {
                    var quantityLocked = parseFloat(getItemMachValue('quantitylocked'));
                    var rate = Item_Machine_getLineRate();
                    var message = 'You cannot decrease the line item quantity below the quantity released to the warehouse. Quantity of released items: quantiyLockedPlaceholder';
                    alert(message.replace("quantiyLockedPlaceholder", parseFloat((quantityLocked / rate).toFixed(8))));
                    return false;
                }
            }


            if (getItemMachValue('linked') == 'T') {
                var sPrompt;
                var type = getTransactionType();
                var warning = GetEditLineWarning();

                if (warning != null) {
                    if (typeDoesNotAllowItemChangeForAlreadyLinked(type, getItemMachValue('itempicked')) && selectedItemHasChanged()) {

                        alert("You cannot change the selected item because it has already been " + warning + ".");
                        return false;
                    }

                    if (warning == 'reimbursed') {
                        sPrompt = "Items on this line have been reimbursed. If you modify it: you will change this bill, the item will no longer appear as a billable item on your reimbursement, and your reimbursement will be inaccurate.  Are you sure you want to modify it?";
                    } else if (warning == 'Return Authorization') {
                        sPrompt = "You are editing a " + warning + " that has already been received. Changing an item that has already been received can affect reimbursement.\n\nClick OK to save your changes on the Return Authorization.\nClick Cancel to go back to the Return Authorization.";
                    } else if (warning == 'purchased') {
                        sPrompt = "Items on this line have already been ordered. Any modifications will only apply to future purchase orders. Are you sure you want to modify it?";
                    } else if (warning == 'received' && selectedItemHasChanged()) {
                        alert("You cannot change the selected item because it has already been " + warning + ".");
                        return false;
                    } else if (warning == 'requested' && selectedItemHasChanged()) {
                        alert("You cannot change the item on lines that have already been requested.");
                        return false;
                    } else {
                        sPrompt = "Items on this line have been " + warning + ".  Are you sure you want to modify it?";
                    }

                    if (!confirm(sPrompt))
                        return false;
                }
            }

            if (hasItemMachField('quantityonshipments') && getItemMachValue('quantityonshipments') > 0) {
                if (selectedItemHasChanged()) {
                    alert("You cannot change the selected item because it has already been associated with inbound shipment.");
                    return false;
                } else {
                    var itemQuantity = parseFloat(getItemMachValue('quantity'));
                    var itemShipmentQuantity = parseFloat(getItemMachValue('quantityonshipments'));
                    if (itemQuantity < itemShipmentQuantity) {
                        alert("Item quantity cannot be less than the total quantity used on existing inbound shipments.");
                        item_machine.clearline();
                        return false;
                    } else {
                        var promptMessage = "Items on this line have been associated with inbound shipment. Are you sure you want to modify it?";
                        if (!confirm(promptMessage)) {
                            return false;
                        }
                    }
                }
            }
        }

        syncQtyReceived();
        checkItemLineShippingFields();

        var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');
        if (hasItemMachField(amountField) && getTransactionType() != 'purchreq' && (getItemMachValue(amountField) == undefined || getItemMachValue(amountField).length == 0) && getItemType() != 'Description' && getItemType() != 'Group' && getItemType() != 'EndGroup' && getItemType() != 'Subtotal' && getItemType() != 'SubscriPlan') {
            var mandatoryAmountField = 'mandatory' + amountField;
            if ((!hasItemMachField(mandatoryAmountField)) || (getItemMachValue(mandatoryAmountField) != 'F')) {
                alert("Please enter a value for amount.");
                return false;
            }
        }

        if (hasItemMachField('estimatedamount') && getTransactionType() == 'purchreq' && (getItemMachValue('estimatedamount') == undefined || getItemMachValue('estimatedamount').length == 0) && getItemType() != 'Description' && getItemType() != 'Group' && getItemType() != 'Subtotal') {
            alert("Please enter a value for estimated amount.");
            return false;
        }

        if (nlapiGetField('total') && hasItemMachField('amount') && getItemType() != 'Description' && getItemType() != 'Group' && getItemType() != 'Subtotal' && (parseFloat(nlapiGetFieldValue('total')) > 1E12 || parseFloat(getItemMachValue('amount')) > 1E12)) {
            if (!checkMaxTotalLimit('total', 'item', 'amount'))
                return false;
        }

        var type = getTransactionType();
        if (type == 'salesord' && hasItemMachField('commitinventory')) {
            if (getItemMachValue('commitinventory').length == 0 && (getItemType() == 'InvtPart' || getItemType() == 'Assembly')) {
                alert("Please enter a value for commit.");
                return false;
            }
        }
        if (type == 'workord' && !workOrderConnector.validateLine()) {
            return false;
        }

        var amountHasBeenSetField = taxInclusivePricingHelper.getEditableFieldName('amounthasbeenset');
        var amountHasBeenSet = getItemMachValue(amountHasBeenSetField) == 'T'
        if (getItemType() != 'Description' && getItemType() != 'Group' && getItemType() != 'Subtotal' && amountHasBeenSet) {

            if (!(type == 'blankord' && hasItemMachField('quantityordered') && zeroIfNaN('quantityordered') != 0)) {
                var rateField = taxInclusivePricingHelper.getEditableFieldName('rate');
                var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');

                var itmcnt = parseFloat(getItemMachValue('quantity'));
                var itmcost = parseFloat(getItemMachValue(rateField));
                if ((!isNaN(itmcnt) && !isNaN(itmcost)) && hasItemMachField(amountField) && round_currency(parseFloat(getItemMachValue(amountField))) != round_currency(itmcnt * itmcost)) {
                    if (!confirm("The line total amount is not equal to the item price times the quantity.  Is this correct?"))
                        return false;
                }
            }
        }

        var i = parseInt(nlapiGetCurrentLineItemIndex('item'));
        var nextitem = nlapiGetLineItemCount('item') + 1;
        if (i < parseInt(nextitem)) {
            var itemtype = getEncodedValue('item', i, 'itemtype');
            if (itemtype == 'EndGroup') {
                alert('You cannot edit the end of group line.  You must delete the group.');
                return false;
            } else if (itemtype == 'Group') {
                if (getEncodedValue('item', i, 'item') != getItemMachValue('item')) {
                    for (var j = i + 1; j < parseInt(nextitem); j++)
                        if (getEncodedValue('item', j, 'itemtype') == 'EndGroup') { break; }
                    Machine_deleteLineItems('item', i, j);
                    setItemMachValue('groupsetup', '');
                } else if (getEncodedValue('item', i, 'quantity') != getItemMachValue('quantity')) {
                    setItemMachValue('groupsetup', 'UpdateQty');
                }
            }
        }

        if (i < parseInt(nextitem) && (getEncodedValue('item', i, 'ingroup') == 'T' || (i > 1 && (getEncodedValue('item', i - 1, 'itemtype') == 'Group' || (getEncodedValue('item', i - 1, 'ingroup') == 'T' && !getEncodedValue('item', i, 'itemtype') == 'EndGroup'))))) {
            var itemtype = getItemType();
            if (itemtype == 'Group') {
                alert('Subgroups not allowed.');
                return false;
            }
        }

        if (getItemType() == 'GiftCert') {
            if (hasItemMachField('gcfields')) {
                if (getItemMachValue('giftcertfrom').length == 0 || getItemMachValue('giftcertrecipientname').length == 0 || getItemMachValue('giftcertrecipientemail').length == 0) {
                    alert('Gift Certificate From, Recipient Name, and Recipient Email are required.');
                    return false;
                }
            }
        }

        if (hasEncodedField('item', 'matrixtype') && getItemMachValue('matrixtype') == 'PARENT') {
            alert('Please choose a child matrix item.');
            return false;
        }

        if ((type == 'salesord' || type == 'workord') && hasItemMachField('createpo') && hasItemMachField('createwo') != null &&
            getItemMachValue('createpo').length > 0 && getItemMachValue('createwo') == 'T') {
            alert('You can not create a purchase order and a work order for the same line.');
            return false;
        }
        if ((getTransactionType() == 'vendbill' || getTransactionType() == 'vendcred') && (getItemType() == 'InvtPart' || getItemType() == 'Assembly') && getItemMachValue('quantity').length > 0 && parseFloat(getItemMachValue('quantity')) == 0 && getItemMachValue('amount').length > 0 && parseFloat(getItemMachValue('amount')) != 0) {
            alert('Inventory and assembly items cannot have zero quantity and non-zero amount.');
            return false;
        }

        if (getItemType() == 'SubscriPlan' &&
            (!hasItemMachField('subscription') || getItemMachValue('subscription').length == 0)) {
            alert('You may not use a subscription plan item without choosing a subscription.');
            return false;
        }

        // Only including validateInventoryNumbers call if not WS, which breaks.  See Issue 92127 for more details.

        // if serial numbers field is invalid, line is invalid
        if (hasItemMachField('serialnumbersvalid')) {
            if (getItemMachValue('serialnumbersvalid') == 'F') {
                validateInventoryNumbers(true);
                if (getItemMachValue('serialnumbersvalid') == 'F')
                    return false;
            }
        }


        if (nlapiGetContext().getExecutionContext() != 'virtualbrowser') {
            if (!validateInventoryDetail())
                return false;
        }

        // Issue 250610 - do not check the minimum quantity when entering a workorder for assembly item
        if ((type != 'workord' && !CheckMinCount()) || !CheckCount())
            return false;

        var linenum = nlapiGetCurrentLineItemIndex('item');

        if (linenum != null && linenum > 0 && linenum <= nlapiGetLineItemCount('item')) {
            addLineToUpdateInitValues(linenum);
        }

        if ('T' == nlapiGetFieldValue('isonlinetransaction') && getItemType() == 'Discount' && !nlapiGetCurrentLineItemValue('item', 'custreferralcode')) {
            alert('Discount line can only be added by promotion code.');
            return false;
        }

        // Store Pick Up validation
        if (hasItemMachField(itemFulfillmentChoiceFieldId)) {
            if (type == salesOrderTranType &&
                getItemMachValue(itemFulfillmentChoiceFieldId).length == 0 &&
                storePickUpConnector.shouldHaveFulfillmentChoice(getItemType(), getItemMachValue(fulfillableFieldId))) {
                alert('Please enter a value for Fulfillment Choice.');
                return false;
            }
        }

        // Customer Specific Catalog validation
        if (type == salesOrderTranType) {
            var itemId = getItemMachValue('item');
            var isUserAction = hasItemMachField('__isuseraction') && getItemMachValue('__isuseraction') == 'T';

            var isItemPurchasable = nlapiServerCall('/app/site/backend/validatecatalogitempurchasability.nl', 'isItemPurchasable', [itemId, isUserAction]);

            if (!isItemPurchasable) {
                alert('This item is no longer available.');
                return false;
            }
        }

        if (!validatePromotions()) {
            return false;
        }

        return true;
    }


    function validatePromotions() {
        if (typeof promotions !== 'undefined') {
            return promotions.machineAdapter.validateLineListener('item');
        }

        return true;
    }

    function typeDoesNotAllowItemChangeForAlreadyLinked(type, itemPicked) {
        if (type == 'purchord')
            return true;
        else if (type == 'vendauth')
            return true;
        else if (type != 'purchord' && itemPicked == 'T')
            return true;
        else
            return false;
    }

    function Item_Machine_postDeleteLine(line, origLineData) {
        if (typeof promotions !== 'undefined') {
            promotions.machineAdapter.postDeleteLineListener('item', line);
        }

        if (nlapiGetField('pricingtiers') && 0 == nlapiGetLineItemCount('item')) {
            nlapiSetFieldDisabled('pricingtiers', false);
        }

        // TODO TAX: remove me; it should be handled by Record Scripting; see the Issue 459616
        if (typeof invalidateTaxes === 'function') {
            invalidateTaxes('item');
        }

        return true;
    }

    function selectedItemHasChanged() {
        var previousSelectedItem = nlapiGetLineItemValue('item', 'item', nlapiGetCurrentLineItemIndex('item'));
        if (isValEmpty(previousSelectedItem))
            previousSelectedItem = '';
        var currentSelectedItem = nlapiGetCurrentLineItemValue('item', 'item');
        if (isValEmpty(currentSelectedItem))
            currentSelectedItem = '';
        return (previousSelectedItem != currentSelectedItem);
    }

    function fieldOnItemMachineHasChanges(column) {
        var previous = nlapiGetLineItemValue('item', column, nlapiGetCurrentLineItemIndex('item'));
        if (isValEmpty(previous))
            previous = '';
        var current = nlapiGetCurrentLineItemValue('item', column);
        if (isValEmpty(current))
            current = '';
        return (previous != current);
    }

    function Item_Machine_PostProcessLine(linenum, origLineData) {
        if (getEncodedValue('item', linenum, 'itemtype') == 'Group') {
            if ('UpdateQty' == getEncodedValue('item', linenum, 'groupsetup')) {
                updateGroupQty(getEncodedValue('item', linenum, 'item'), linenum, getEncodedValue('item', linenum, 'quantity'));
                setEncodedValue('item', linenum, 'groupsetup', 'T');
            } else if (!getEncodedValue('item', linenum, 'groupsetup'))
                InsertGroup(getEncodedValue('item', linenum, 'item'), linenum, getEncodedValue('item', linenum, 'quantity'));
        }

        if (getTransactionType() == 'workord') {
            if (hasItemMachField('operationsequencenumber') && hasItemMachField('operationdisplaytext')) {
                var operation = getEncodedValue('item', linenum, 'operationdisplaytext');
                setEncodedValue('item', linenum, 'operationsequencenumber', operation);

                setComponentOperation(getComponentId(linenum), operation);

                if (hasItemMachField('plannedissuedate')) {
                    setPlannedIssueDateFromSequence(linenum);
                    nlapiRefreshLineItems('item');
                }
            }
            workOrderConnector.postProcessLine(linenum, origLineData);
        }

        NS.event.dispatchImmediate(NS.event.type.ITEM_POST_PROCESS_LINE, linenum);

        if (typeof promotions !== 'undefined') {
            // not called on server side see NLItemSublist
            promotions.machineAdapter.lineCommitListener('item', linenum);
        }
    }

    function syncSerialNumberFields() {
        // for textarea, disable the inventory numbers field and enable the quantity field after editing or creating a row
        // for select, re-enable the inventory numbers field to allow item slave off inventory number field and re-enable quantity
        if (hasItemMachField('serialnumbers')) {
            var item = getItemMachValue('item');
            var isserialitem = getItemMachValue('isserialitem');
            var islotitem = getItemMachValue('islotitem');
            var isworkord = getTransactionType() == 'workord';
            var invtnotcommittable = isworkord && hasItemMachField('notinvtcommittable') && getItemMachValue('notinvtcommittable') == 'T';
            if (nlapiGetLineItemField('item', 'serialnumbers').getType() == 'textarea') {
                setItemMachDisabled('serialnumbers', ((invtnotcommittable || (isserialitem != 'T' && islotitem != 'T' && !isValEmpty(item))) ? true : false));
                if (!isworkord)
                    setItemMachDisabled('quantity', false);
            } else {
                // if no item has been selected yet, enable both quantity and serial numbers fields
                if (invtnotcommittable) {
                    setItemMachDisabled('serialnumbers', true);
                } else if (isValEmpty(item)) {
                    setItemMachDisabled('serialnumbers', false);
                    if (!isworkord)
                        setItemMachDisabled('quantity', false);
                }
                // if selected item is not numbered, disable serial numbers and enable quantity
                else if (isserialitem != 'T' && islotitem != 'T') {
                    setItemMachDisabled('serialnumbers', true);
                    if (!isworkord)
                        setItemMachDisabled('quantity', false);
                } else {
                    if (isserialitem == 'T') {
                        if (getItemMachValue('serialnumbers').length > 0 && getItemMachValue('serialnumbers').substring(0, 6) != '<Enter') {
                            // for serial numbered items, disable the quantity field if there is a serial number entered
                            setItemMachDisabled('serialnumbers', false);
                            //this.miniform.elements['quantity'].disabled = true;
                        } else {
                            // for serial numbered items, if the quantity field is greater than 1, disable the serial number field
                            if (!isworkord)
                                setItemMachDisabled('quantity', false);
                            var quantity = parseFloat(getItemMachValue('quantity'));
                            if (isworkord)
                                setItemMachDisabled('serialnumbers', false);
                            //if (!isNaN(quantity) && quantity > 1)
                            //{
                            //	disableSelect(this.miniform.elements['serialnumbers'],true);
                            //}
                        }
                    } else {
                        // for lot numbered items, enable both the number field and quantity field
                        if (!isworkord)
                            setItemMachDisabled('quantity', false);
                        setItemMachDisabled('serialnumbers', false);
                    }
                }
            }
        }
    }

    function EnableGiftCertFields() {
        var bGiftCert = (getItemType() == 'GiftCert');
        setItemMachDisabled('gcfields', !bGiftCert);
        setItemMachDisabled('giftcertfrom', !bGiftCert);
        setItemMachDisabled('giftcertrecipientname', !bGiftCert);
        setItemMachDisabled('giftcertrecipientemail', !bGiftCert);
        setItemMachDisabled('giftcertmessage', !bGiftCert);
        setItemMachDisabled('giftcertnumber', !bGiftCert || getItemMachValue('giftcertimmutable') == 'T');
        if (bGiftCert) {
            setItemMachDisabled('quantity', bGiftCert);
        }
    }

    function DisableCommitmentFirmField() {
        var lineId = nlapiGetCurrentLineItemValue('item', 'line');
        if (lineId == '' || lineId == null)
            setItemMachDisabled('commitmentfirm', true);
        else
            setItemMachDisabled('commitmentfirm', false);
    }

    function enableDisableOperationSequenceField(line) {
        if (hasItemMachField('operationsequencenumber')) {
            setItemMachDisabled('operationdisplaytext', shouldBeOperationSequenceDisabled(line));
        }
    }

    function shouldBeOperationSequenceDisabled(line) {
        var woStatus = nlapiGetFieldValue('orderstatus');
        if (woStatus != 'A' && woStatus != 'B')
            return true;

        if (isValEmpty(nlapiGetFieldValue('manufacturingrouting')) || nlapiGetFieldValue('operationsequenceeditable') == 'F')
            return true;

        return 'Assembly' == getEncodedValue('item', line, 'itemtype') && !isAssemblyLeaf(line);
    }

    function isNonInvtItemAccruable() {
        var itemType = getItemType;
        var itemSubType = getItemSubType();
        var isFulfillable = getItemMachValue('fulfillable');
        return ('NonInvtPart == itemType' || 'OthCharge' == itemType || 'Service' == itemType) && ('Purchase' == itemSubType || 'Resale' == itemSubType) && 'T' == isFulfillable;
    }

    //For Purchase Order tranline, if it's already linked to ItemReceipt or VendBill,
    // or the line item is not Accruable NonInvt Item, column GenerateAccruals will be disabled
    function disableGenerateAccurals() {
        if (getTransactionType() == 'purchord' && hasItemMachField('generateaccruals'))
            setItemMachDisabled('generateaccruals', isLineLinked() || !isNonInvtItemAccruable());
    }

    //For VendorBill tranline, if it's linked to non dropship PO and has GenerateAccruals is 'T',
    // Amortization Schedule Fields will be disabled
    function disableAmortizationScheduleFields() {
        if (getTransactionType() == 'vendbill' && hasItemMachField('amortizationsched') && hasItemMachField('generateaccruals')) {
            if (isNonInvtItemAccruable() && parseInt(getItemMachValue('orderdoc')) > -1 && getItemMachValue('generateaccruals') == 'T' && getItemMachValue('islinkedtodropshippoline') != 'T') {
                setItemMachDisabled('amortizationsched', true);
                setItemMachValue('amortizationsched', '');
                setItemMachDisabled('amortizstartdate', true);
                setItemMachValue('amortizstartdate', '');
                setItemMachDisabled('amortizationenddate', true);
                setItemMachValue('amortizationenddate', '');
                setItemMachDisabled('amortizationresidual', true);
                setItemMachValue('amortizationresidual', '');
            }
        }
    }

    function getComponentId(index) {
        // this approach is possible because this fields are mutualy exclusive
        var value = getEncodedValue('item', index, 'component');
        return value === null ? getEncodedValue('item', index, 'bomrevisioncomponent') : value;
    }

    function getOperationSequence(index) {
        return getEncodedValue('item', index, 'operationsequencenumber');
    }

    function setOperationSequence(index, value) {
        setEncodedValue('item', index, 'operationdisplaytext', value);
        setEncodedValue('item', index, 'operationsequencenumber', value);
    }

    function getAssemblyLevel(index) {
        return parseInt(getEncodedValue('item', index, 'assemblylevel'));
    }

    function isAssemblyRoot(index) {
        return getAssemblyLevel(index) == 1;
    }

    function isAssemblyLeaf(index) {
        if (index < nlapiGetLineItemCount('item'))
            return getAssemblyLevel(index) >= getAssemblyLevel(index + 1);
        else
            return true;
    }

    function findRootLineOf(index) {
        for (var i = index; i >= 1; i--) {
            if (isAssemblyRoot(i))
                return i;
        }
        return 1;
    }

    function Item_Machine_ValidateDelete() {
        if (itemHasEncodedField('linked')) {
            var type = getTransactionType();
            if (getItemMachValue('linked') == 'T') {
                var word = (type == 'purchord' || type == 'rtnauth' ? 'received' : (type == 'salesord' || type == 'trnfrord' || type == 'vendauth' ? 'fulfilled' : 'reimbursed'));
                var sPrompt;
                if (type == 'blankord') {
                    sPrompt = "There are Purchase Order lines linked to this line. Are you sure you want to delete it?";
                    if (!confirm(sPrompt))
                        return false;
                } else if (type == 'workord') {
                    if (isItemSourcedFromTransaction()) {
                        alert('The line cannot be deleted because it has a special order associated with it. First, delete the special order and retry.');
                        return false;
                    }
                    if (parseFloat(getItemMachValue('quantityfulfilled')) != 0) {
                        alert('Items in this line have already been used in the build. To delete this line, first delete the corresponding transactions.');
                        return false;
                    }
                    return true;
                } else if (word == 'reimbursed') {
                    sPrompt = "Items on this line have been reimbursed. If you delete it: you will change this bill, the item will no longer appear as a billable item on your reimbursement, and your reimbursement will be inaccurate.  Are you sure you want to delete it?";
                    if (!confirm(sPrompt))
                        return false;
                } else if (hasItemMachField('quantitylocked') && getItemMachValue('quantitylocked') > 0) {
                    alert('You cannot delete a line item associated with a wave transaction.');
                    return false;
                } else {
                    alert("Items on this line have been " + word + ".  If you wish to delete the line, you must first delete the corresponding line(s) in the associated transaction(s).");
                    return false;
                }
            }
            if (getItemMachValue('quantityonshipments') > 0) {
                alert("Items on this line have been associated with inbound shipment. If you wish to delete the line, you must first delete the corresponding line(s) in the associated record(s).");
                return false;
            }
        }

        if (getTransactionType() == 'workord') {
            if (isLineLinked() || isOrderFinished()) {
                alert("This line cannot be removed.");
                return false;
            }
        }

        var i = parseInt(nlapiGetCurrentLineItemIndex('item'));
        var itemType = getEncodedItemValue(i, 'itemtype');
        if (itemType != null && itemType == 'EndGroup') {
            alert('You cannot delete the end of group line.  You must delete the group.');
            return false;
        }
        if (itemType == 'Group' && getEncodedItemValue(i, 'includegroupwrapper') == 'T') {
            for (var j = i + 1; j < parseInt(nlapiGetLineItemCount('item') + 1); j++)
                if (getEncodedValue('item', j, 'itemtype') == 'EndGroup') { break; }
            Machine_deleteLineItems('item', i, j);
        }

        NS.event.dispatchImmediate(NS.event.type.ITEM_VALIDATE_DELETE);

        if (hasEncodedItemValue(i, 'oqpbucket')) {
            var deletedFromBucket = getEncodedItemValue(i, 'oqpbucket');
            bucketsDeleted[bucketsDeleted.length + 1] = deletedFromBucket;
        }

        if (typeof om !== 'undefined' && om.promotions) {
            om.promotions.logger.promotionsLogger.addToContext({ flowTrace: 'Possible call to Promotions Engine due to deletion of items in ItemMachine' });
        }
        nlapiSetFieldValue('doshippingrecalc', 'T');
        if (typeof promotions !== 'undefined') {
            promotions.machineAdapter.validateDeleteListener('item');
        }

        var contractId = getItemMachValue('purchasecontract');
        var contractDetails = getItemMachValue('contractdetails');
        if (!isValEmpty(contractId) && !isValEmpty(contractDetails))
            calculateContractRateForAllLines(contractId, contractDetails, false, true);

        return true;
    }

    function Item_Machine_Sync_QtyReceived() {
        var fldnam;
        if (hasEncodedField('item', 'quantityreceived'))
            fldnam = 'quantityreceived';
        else if (hasEncodedField('item', 'quantityfulfilled'))
            fldnam = 'quantityfulfilled';
        else
            return;
        var i = parseInt(nlapiGetCurrentLineItemIndex('item'));
        var newqty = parseFloat(getItemMachValue('quantity'));
        var oldqty = parseFloat(getEncodedValue('item', i, 'quantity'));
        var received = parseFloat(getItemMachValue(fldnam));
        if (!isNaN(newqty) && !isNaN(oldqty) && !isNaN(received) && newqty != oldqty)
            setItemMachValue(fldnam, received == oldqty ? newqty : received + newqty - oldqty);
        if (hasEncodedField('item', 'percentcomplete')) {
            var ordered = parseFloat(getItemMachValue('quantityordered'));
            var qty = parseFloat(getItemMachValue(fldnam));
            if (!isNaN(ordered) && ordered != 0 && !isNaN(qty))
                setItemMachValue('percentcomplete', qty / ordered * 100 + '%');
        }
    }

    function Item_Machine_Dont_Sync_QtyReceived() {}

    function CheckRevRecSchedule() {

        if (!hasItemMachField('revrec_defrevacct')) {
            return;
        }
        var bImmutableRevRec = (getItemMachValue('hasimmutablerevrec') == 'T');
        var isFullyRecogRevRec = (getItemMachValue('isfullyrecogrevrec') == 'T');
        var bHasDeferredRevenueAccount = (getItemMachValue('revrec_defrevacct') != '');
        var bIsSalesOrder = (getTransactionType() == 'salesord');
        var bVariable = hasItemMachField('amortizationtype') && getItemMachValue('amortizationtype') == 'VARIABLE';


        var bDisableDates = bVariable || (!bIsSalesOrder && ((getItemMachValue('revrec_recurrencetype') == 'SOREVRECDATES') || bImmutableRevRec));
        var bDisableEndDate = (hasItemMachField('revrecterminmonths') && !nlapiGetLineItemField('item', 'revrecterminmonths').isHidden());


        var bDisableRevRec = (!bHasDeferredRevenueAccount || (!bIsSalesOrder && bImmutableRevRec));

        setItemMachDisabled('revrecschedule', bDisableRevRec);


        if (hasItemMachField('revrecstartdate'))
            setItemMachDisabled('revrecstartdate', bDisableDates);

        if (hasItemMachField('revrecenddate'))
            setItemMachDisabled('revrecenddate', bDisableDates || bDisableEndDate);
        if (hasItemMachField('deferrevrec'))
            setItemMachDisabled('deferrevrec', !bHasDeferredRevenueAccount || isFullyRecogRevRec);
        if (hasItemMachField('catchupperiod')) {
            setItemMachDisabled('catchupperiod', !bHasDeferredRevenueAccount || isFullyRecogRevRec || bVariable);
            if (!bHasDeferredRevenueAccount || isFullyRecogRevRec || bVariable) setItemMachValue('catchupperiod', null);
        }
        if (hasItemMachField('revrecterminmonths'))
            setItemMachDisabled('revrecterminmonths', bVariable);


    }

    function validateItemChangeWithOldRevrecSchedule() {
        if ((getTransactionType() == 'custcred' || getTransactionType() == 'custinvc' || getTransactionType() == 'cashsale' || getTransactionType() == 'cashrfnd') &&
            nlapiGetContext().getFeature('REVENUERECOGNITION') &&
            nlapiGetCurrentLineItemValue("item", "item") != nlapiGetCurrentLineItemValue("item", "olditemid") &&
            nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != null &&
            nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != '' &&
            nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != nlapiGetCurrentLineItemValue("item", "oldrevrectemplate")) {
            alert('You cannot change the item on this line because it has an existing revenue schedule. Delete the line, and enter a new line to correct the item.');
            return false;
        }
        return true;
    }

    function Item_Machine_synclinefields(line) {
        if (!line)
            line = parseInt(nlapiGetCurrentLineItemIndex('item'));
        restoreFieldDisableStatus();
        if (hasItemMachField('price')) {
            var isNotCustomPrice = getItemMachValue('price') != '-1';

            var rateField = taxInclusivePricingHelper.getEditableFieldName('rate');
            setItemMachDisabled(rateField, isNotCustomPrice);


        }
        if (hasItemMachField('createpo'))
            syncPOFields();
        if (hasItemMachField('location') && !useInventoryLocationForFulfillment())
            setItemMachDisabled('location', getItemMachValue('islinefulfilled') == 'T');
        if (hasItemMachField('inventorylocation'))
            setItemMachDisabled('inventorylocation', getInventoryLocationFieldDisableCondition());

        syncCommitInventory();
        if (hasItemMachField('isclosed'))
            setItemMachDisabled('isclosed', getItemMachValue('groupclosed') == 'T' && getItemMachValue('itemtype') != 'Group');
        if (hasItemMachField('createwo'))
            syncWOField();
        if (getTransactionType() == 'workord')
            syncWorkOrderFields();
        if (getTransactionType() == 'purchord' && nlapiGetContext().getFeature('OUTSOURCEDMFG') && !isValEmpty(nlapiGetFieldValue('id'))) {
            disableFieldsIfWorkOrderIsCreated();
        }

        syncShippingFields();
        CheckRevRecSchedule();
        disableExpenseAmortizationFields();
        CheckitemAmortizationSchedule();
        EnableGrossProfitFields();
        syncSerialNumberFields();
        syncLandedCostFields();
        EnableGiftCertFields();
        syncTransferOrderFields();
        syncThreeWayMatchingFields();
        syncVendorBillVariancePosted();
        syncInventoryDetailField();
        syncProjectFields();
        enableChargeFields();
        syncExcludeFromRateRequest();
        syncAllocationStrategyWithItemType();
        syncWithAllocationStrategyChange();
        disableOrderPriorityForSalesChannel();
        setPrintFieldDefaultValue();
        enableDisableRateAndAmountFields();
        autoLocationAssignmentModule.disableAutoLocationFieldsForIrrelevantItemTypes();
        DisableCommitmentFirmField();
        enableDisableOperationSequenceField(line);
        NS.event.dispatchImmediate(NS.event.type.ITEM_SYNC_LINE_FIELDS);
        storePickUpConnector.enableDisableFulfillmentChoiceField('itemfulfillmentchoice');
        storePickUpConnector.enableDisableExcludeRateRequestField('itemfulfillmentchoice', 'excludefromraterequest');
        autoLocationAssignmentModule.updateNoAutoAssignLocationWhenFulfillmentChoiceChange();
        disableGenerateAccurals();
        disableAmortizationScheduleFields();
        setupLineFieldMandatoryFlag();
        disableLineFieldsWhenOrderLineInWave();
        emptySupplyRequiredByDateOnCreate();
    }

    function getInventoryLocationFieldDisableCondition() {
        switch (getTransactionType()) {
            case 'vendbill':
                return true;
                break;
            default:
                return getItemMachValue('islinefulfilled') === 'T';
        }
    }

    function disableLineFieldsWhenOrderLineInWave() {
        if (getItemMachValue('quantitylocked') > 0) {
            if (hasItemMachField('item'))
                setItemMachDisabled('item', true);

            if (hasItemMachField('location') && !useInventoryLocationForFulfillment())
                setItemMachDisabled('location', true);

            if (hasItemMachField('inventorylocation'))
                setItemMachDisabled('inventorylocation', true);

            if (hasItemMachField('units'))
                setItemMachDisabled('units', true);
        }
    }

    function setupLineFieldMandatoryFlag() {
        if (!hasLegacyMachine()) {
            return;
        }

        for (var i = 0; i < item_machine.form_elems.length; i++) {
            var currentElementName = item_machine.form_elems[i];
            var currentMandatoryElementName = "mandatory" + currentElementName;
            if (nlapiGetLineItemField('item', currentMandatoryElementName, 0)) {
                nlapiSetLineItemMandatory('item', currentElementName, nlapiGetCurrentLineItemValue('item', currentMandatoryElementName) == 'T');
            }
        }
    }

    function syncExcludeFromRateRequest() {
        if (hasItemMachField('excludefromraterequest')) {
            var lineNum = nlapiGetCurrentLineItemIndex('item');
            //Field will be disabled when it is not on relevant recordType or when itemType is not relevant
            nlapiSetLineItemDisabled('item', 'excludefromraterequest', isExcludeFromRateRequestDisabledInCurrentLine(), lineNum);

        }
    }

    function syncAllocationStrategyWithItemType() {
        var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
        if (itemType == '') {
            return;
        }
        var hasAllocationStrategy = ('InvtPart' == itemType || 'Kit' == itemType || 'Assembly' == itemType) && hasItemMachField('orderallocationstrategy');
        var index = nlapiGetCurrentLineItemIndex('item');
        if (hasAllocationStrategy) {
            nlapiSetLineItemDisabled('item', 'orderallocationstrategy', false, index);
        } else {
            nlapiSetLineItemDisabled('item', 'orderallocationstrategy', true, index);
        }
    }

    function emptySupplyRequiredByDateOnCreate() {
        if (getTransactionType() == 'workord' && nlapiGetCurrentLineItemValue('item', 'itemtype') == '') {
            nlapiSetCurrentLineItemValue('item', 'requesteddate', '', true);
            nlapiSetCurrentLineItemValue('item', 'expectedshipdate', '', true);
        }
    }

    function setAllocationStrategy() {
        var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
        if (itemType == '') {
            return;
        }
        var hasAllocationStrategy = ('InvtPart' == itemType || 'Kit' == itemType || 'Assembly' == itemType) && hasItemMachField('orderallocationstrategy');
        if (hasAllocationStrategy) {
            if ('salesorder' == nlapiGetRecordType() && nlapiGetFieldValue('defaultcustomerallocationstrategy') != '') {
                nlapiSetCurrentLineItemValue('item', 'orderallocationstrategy', nlapiGetFieldValue('defaultcustomerallocationstrategy'));
            } else {
                nlapiSetCurrentLineItemValue('item', 'orderallocationstrategy', nlapiGetCurrentLineItemValue('item', 'defaultorderallocationstrategy'));
            }
        } else {
            nlapiSetCurrentLineItemValue('item', 'orderallocationstrategy', '');
        }
    }

    function syncWithAllocationStrategyChange() {
        if (!nlapiGetContext().getFeature('SUPPLYALLOCATION'))
            return;

        if ('workorder' == nlapiGetRecordType()) {
            var hasAllocationStrategy = false;

            if (itemMachCurrentLineValueNotEmpty('item') && itemMachCurrentLineValueNotEmpty('orderallocationstrategy'))
                hasAllocationStrategy = true;
            else {
                for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
                    if (!isValEmpty(nlapiGetLineItemValue('item', 'orderallocationstrategy', i))) {
                        hasAllocationStrategy = true;
                        break;
                    }
                }
            }

            if (hasAllocationStrategy) {
                nlapiSetFieldMandatory('requesteddate', true);
            } else {
                nlapiSetFieldMandatory('requesteddate', false);
            }
        } else {
            if (!itemMachCurrentLineValueNotEmpty('item'))
                return;

            var index = nlapiGetCurrentLineItemIndex('item');

            if (itemMachCurrentLineValueNotEmpty('orderallocationstrategy')) {
                if (nlapiGetLineItemField('item', 'expectedshipdate', index) != null)
                    nlapiSetLineItemDisabled('item', 'expectedshipdate', true, index);
                if (nlapiGetLineItemField('item', 'requesteddate', index) != null) {
                    nlapiSetLineItemDisabled('item', 'requesteddate', false, index);
                }

            } else {
                if (nlapiGetLineItemField('item', 'expectedshipdate', index) != null)
                    nlapiSetLineItemDisabled('item', 'expectedshipdate', false, index);
                if ('Group' == nlapiGetCurrentLineItemValue('item', 'itemtype') || 'EndGroup' == nlapiGetCurrentLineItemValue('item', 'itemtype')) {
                    if (nlapiGetLineItemField('item', 'expectedshipdate', index) != null)
                        nlapiSetLineItemDisabled('item', 'expectedshipdate', true, index);
                    if (nlapiGetLineItemField('item', 'requesteddate', index) != null) {
                        nlapiSetLineItemDisabled('item', 'requesteddate', true, index);
                        nlapiSetCurrentLineItemValue('item', 'requesteddate', '');
                    }
                }
            }
        }
    }

    function disableOrderPriorityForSalesChannel() {
        if (!hasItemMachField('orderpriority') || !nlapiGetContext().getFeature('SALESCHANNELALLOCATION'))
            return;
        var channelOrderPriority = nlapiGetFieldValue('saleschannelorderpriority');
        if ('salesorder' == nlapiGetRecordType() && ('InvtPart' == nlapiGetCurrentLineItemValue('item', 'itemtype') || 'Assembly' == nlapiGetCurrentLineItemValue('item', 'itemtype')) && !isValEmpty(channelOrderPriority))
            nlapiSetLineItemDisabled('item', 'orderpriority', true, nlapiGetCurrentLineItemIndex('item'));
        else
            nlapiSetLineItemDisabled('item', 'orderpriority', false, nlapiGetCurrentLineItemIndex('item'))
    }

    function checkCommitmentConfirmed() {
        if (nlapiGetCurrentLineItemValue('item', 'commitmentfirm') == 'T' && nlapiGetCurrentLineItemValue('item', 'oldcommitmentfirm') == 'T') {
            alert('Note that allocation for this line is Commitment Confirmed and will not be reallocated based on changes you are making on this line. To reallocate supply based on your changes, you must clear the Commitment Confirmed box for this line before you save the form.');
        }
    }

    function checkAnyLineCommitmentConfirmed() {
        for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
            if (nlapiGetLineItemValue('item', 'commitmentfirm', i) == 'T' && nlapiGetLineItemValue('item', 'oldcommitmentfirm', i) == 'T') {
                alert('Note that allocation is Commitment Confirmed for one or more component lines and will not be reallocated based on changes you are making to the Supply Required By Date. To reallocate supply of the component lines based on your change, you must clear the Commitment Confirmed box for the component line(s) before you save the form.');
            }
        }
    }

    function isExcludeFromRateRequestDisabledInCurrentLine() {
        var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
        var recordType = nlapiGetRecordType();
        var unsuitableItemType = 'InvtPart' != itemType && 'Assembly' != itemType;
        var unsuitableRecordType = 'estimate' != recordType && 'salesorder' != recordType && 'cashsale' != recordType && 'invoice' != recordType;

        return unsuitableItemType || unsuitableRecordType;
    }

    function setPrintFieldDefaultValue() {
        if (getItemType() != 'Group' && getItemType() != 'EndGroup' && getItemType() != 'Assembly' && getItemType() != 'Kit' && getItemMachValue('ingroup') != 'T' && getItemMachValue('noprint') != null) {
            setItemMachValue('noprint', 'F');
        }
    }

    var item_machine_fieldDisabled = null

    function restoreFieldDisableStatus() {
        var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');
        var fields = ['item', 'quantity', 'rate', amountField, 'units', 'class', 'department', 'location', 'inventorylocation', 'isclosed', 'matchbilltoreceipt', 'billreceipts', 'subscription', 'taxcode'];
        if (null == item_machine_fieldDisabled) {
            item_machine_fieldDisabled = {};
            for (i = 0; i < fields.length; i++) {
                item_machine_fieldDisabled[fields[i]] = getItemMachDisabled(fields[i]);
            }
        }
        for (var i = 0; i < fields.length; i++) {
            var fld = fields[i];
            if (hasItemMachField(fld)) {
                var fieldDisabled = item_machine_fieldDisabled[fld] || false;
                setItemMachDisabled(fld, fieldDisabled);
            }
        }
    }

    function disableFieldsIfWorkOrderIsCreated() {
        var createOutsourcedWoKey = getItemMachValue('createdoutsourcedwokey');
        var isClosed = getItemMachValue('isclosed') === 'T';
        var isWoCreated = !isValEmpty(createOutsourcedWoKey);
        var fields = ['assembly', 'billofmaterials', 'billofmaterialsrevision', 'productionstartdate', 'productionenddate', 'createoutsourcedwo', 'item', 'location'];
        for (var i = 0; i < fields.length; i++) {
            if (hasItemMachField(fields[i])) {
                setItemMachDisabled(fields[i], isWoCreated);
            }
        }

        if (isWoCreated && isClosed) {
            setItemMachDisabled('isclosed', true);
            if (hasItemMachField('quantity')) {
                setItemMachDisabled('quantity', true);
            }
        }
    }

    function setRevisionIfDifferent() {
        var revisionByDate = getItemMachValue('billofmaterialsrevisionbyproductiondate');
        var originalRevision = getItemMachValue('billofmaterialsrevision');
        if (revisionByDate != originalRevision) {
            nlapiSetCurrentLineItemValue('item', 'billofmaterialsrevision', revisionByDate);
        }
    }

    function setRevisionByProductionDateIfNotSet() {
        var revisionByProductionDate = getItemMachValue('billofmaterialsrevisionbyproductiondate');
        var originalRevision = getItemMachValue('billofmaterialsrevision');
        if (isValEmpty(originalRevision) && !isValEmpty(revisionByProductionDate)) {
            nlapiSetCurrentLineItemValue('item', 'billofmaterialsrevision', revisionByProductionDate);
        }
    }

    function setRevisionByCurrentDateIfNotSet() {
        var revisionByCurrentDate = getItemMachValue('billofmaterialsrevisionbycurrentdate');
        var originalRevision = getItemMachValue('billofmaterialsrevision');
        if (isValEmpty(originalRevision) && !isValEmpty(revisionByCurrentDate)) {
            nlapiSetCurrentLineItemValue('item', 'billofmaterialsrevision', revisionByCurrentDate);
        }
    }

    function forceItemValueIfNew(itemKeyBeforeSlaving) {
        var itemKeyAfterSlaving = getItemMachValue('item');
        var assembly = getItemMachValue('assembly');
        if (itemKeyBeforeSlaving != itemKeyAfterSlaving && !isValEmpty(assembly)) {
            nlapiSetCurrentLineItemValue('item', 'item', itemKeyAfterSlaving);
        }
    }

    function syncVendorBillVariancePosted() {
        var isbillvariancejournalposted = getItemMachValue('billvariancestatusallbook') == 'T';
        var fields = ['quantity', 'rate', 'amount', 'units', 'class', 'department', 'location', 'isclosed', 'billreceipts'];
        for (var i = 0; i < fields.length; i++) {
            if (hasItemMachField(fields[i])) {
                var isdisabled = getItemMachDisabled(fields[i]);
                setItemMachDisabled(fields[i], isdisabled || isbillvariancejournalposted);
            }
        }

        if (hasItemMachField('matchbilltoreceipt')) {
            var isBilled = hasItemMachField('quantitybilled') ? getItemMachValue('quantitybilled') > 0 : false;
            var isDropShipOrderLine = hasItemMachField('isdropshiporderline') ? getItemMachValue('isdropshiporderline') == 'T' : false;
            setItemMachDisabled('matchbilltoreceipt', isdisabled || isbillvariancejournalposted || isBilled || isDropShipOrderLine ||
                (getItemType() != 'InvtPart' && getItemType() != 'Assembly'));
        }

        if (hasItemMachField('billreceipts')) {
            isdisabled = getItemMachDisabled('billreceipts');
            setItemMachDisabled('billreceipts', isdisabled || getItemMachValue('allowbilltoreceiptmatching') != 'T');
        }

    }

    function syncThreeWayMatchingFields() {
        if (hasItemMachField('matchbilltoreceipt')) {
            var disableField = getItemMachValue('isdropshiporderline') == 'T' || (getItemType() != 'InvtPart' && getItemType() != 'Assembly');
            setItemMachDisabled('matchbilltoreceipt', disableField);
            if (disableField)
                setItemMachValue('matchbilltoreceipt', '');
        }

        if (hasItemMachField('billreceipts'))
            setItemMachDisabled('billreceipts', getItemMachValue('allowbilltoreceiptmatching') != 'T');
    }

    function syncLandedCostFields() {
        if (hasItemMachField('landedcostcategory') && hasItemMachField('linkedlandedcost'))
            setItemMachDisabled('landedcostcategory', getItemMachValue('linkedlandedcost') == 'T');
    }

    function disableWipWorkOrder() {
        var orderStatus = getOrderStatus();
        return nlapiGetFieldValue('iswip') == 'T' && orderStatus != 'A' && orderStatus != 'B' && orderStatus != 'D';
    }

    function shouldDisableWorkOrderFields() {
        return isLineLinked() || isOrderFinished() || disableWipWorkOrder();
    }

    function syncWorkOrderFields() {

        var isWip = nlapiGetFieldValue('iswip') == 'T';
        var useComponentYield = nlapiGetFieldValue('usecomponentyield') == 'T';

        var orderStatus = getOrderStatus();
        var isInProcess = orderStatus == 'D';
        var isBuiltOrClosed = isOrderFinished();


        var isSourcedFromTransaction = isItemSourcedFromTransaction();

        var disableWipWorkOrder = isWip && orderStatus != 'A' && orderStatus != 'B' && !isInProcess;

        setItemMachDisabled('item', isLineLinked() || isBuiltOrClosed || disableWipWorkOrder);
        setItemMachDisabled('units', isLineLinked() || isBuiltOrClosed || disableWipWorkOrder);
        setItemMachDisabled('quantity', isBuiltOrClosed || isSourcedFromTransaction || disableWipWorkOrder || useComponentYield);
        setItemMachDisabled('componentyield', isBuiltOrClosed || isSourcedFromTransaction || !useComponentYield);
        setItemMachDisabled('bomquantity', isBuiltOrClosed || isSourcedFromTransaction || !useComponentYield);

        var currentLineIndex = parseInt(nlapiGetCurrentLineItemIndex('item'), 10);
        var currentAssemblyLevel = getAssemblyLevel(currentLineIndex);

        var childItemsAreUsed = false;
        for (var lineIndex = currentLineIndex + 1; lineIndex <= nlapiGetLineItemCount('item') && getAssemblyLevel(lineIndex) > currentAssemblyLevel; lineIndex++) {
            if (parseFloatOrZero(nlapiGetLineItemValue('item', 'quantityfulfilled', lineIndex)) > 0) {
                childItemsAreUsed = true;
                break;
            }
        }
        // item source should be disabled if there is already existing transaction linked with component, component is used in build or some child (in case of PHANTOM) are used in build
        setItemMachDisabled('itemsource', isSourcedFromTransaction || (parseFloatOrZero(getItemMachValue('quantityfulfilled')) > 0) || childItemsAreUsed);

        if (!hasItemMachField('notinvtcommittable') || getItemMachValue('notinvtcommittable') == 'F')
            return;

        var woLineFields = [];
        var i = 0;
        woLineFields[i++] = 'commitinventory';
        woLineFields[i++] = 'options';
        woLineFields[i++] = 'createpo';
        for (i = 0; i < woLineFields.length; i++) {
            if (hasItemMachField(woLineFields[i])) {
                setItemMachDisabled(woLineFields[i], true);
            }
        }
    }

    function syncComponentYieldQuantity() {
        if (itemMachCurrentLineValueNotEmpty("componentyield") && itemMachCurrentLineValueNotEmpty("bomquantity")) {
            setItemMachValue("quantity", getComponentYieldQuantity());
        }
    }

    function getComponentYieldQuantity() {
        var bomQuantity = parseFloat(nlapiGetCurrentLineItemValue('item', 'bomquantity'));
        var componentYield = parseFloat(nlapiGetCurrentLineItemValue('item', 'componentyield'));
        var roundUpAsComponent = nlapiGetCurrentLineItemValue('item', 'roundupascomponent') == 'T';

        return calculateQuantityWithComponentYield(bomQuantity, componentYield, roundUpAsComponent);
    }

    function calculateQuantityWithComponentYield(bomQuantity, yield, roundUpAsComponent) {
        var result = bomQuantity * 100 / yield;
        result = (roundUpAsComponent ? Math.ceil(result) : round_float_to_n_places(result, 5));
        return result;
    }

    function syncTransferOrderFields()

    {
        if (getTransactionType() == 'trnfrord') {
            if (nlapiGetFieldValue('useitemcostastransfercost') == 'F') {
                setItemMachDisabled('rate', getItemMachValue('linked') == 'T');
                setItemMachDisabled('amount', getItemMachValue('linked') == 'T');
            }
            setItemMachDisabled('quantity', getItemMachValue('linked') == 'T');
            setItemMachDisabled('units', getItemMachValue('linked') == 'T');
            setItemMachDisabled('serialnumbers', getItemMachValue('linked') == 'T');
        }
    }

    function checkClosable() {
        if (getTransactionType() == 'trnfrord') {
            var trOrdStatus = getOrderStatus();
            var isLineBeingClosed = nlapiGetCurrentLineItemValue('item', 'isclosed');
            if (isLineBeingClosed == 'T' && nlapiGetCurrentLineItemValue('item', 'quantityreceived') != nlapiGetCurrentLineItemValue('item', 'quantityfulfilled')) {
                alert('Transfer order lines cannot be closed when there are remaining quantities to be received.');
                return false;
            }
            if (isLineBeingClosed == 'T' &&
                nlapiGetContext().getFeature('PICKPACKSHIP') &&
                getItemMachValue('quantitypicked') != getItemMachValue('quantityfulfilled') &&
                (trOrdStatus == 'B' || trOrdStatus == 'D' || trOrdStatus == 'E')

            ) {

                alert('A line on a transfer order cannot be closed if any quantity is already picked but not yet received.');
                return false;
            }
        }
        return true;
    }

    function checkClosableIS() {
        if (nlapiGetCurrentLineItemValue('item', 'isclosed') == 'T' && nlapiGetCurrentLineItemValue('item', 'closeenabled') == 'F') {
            alert('Purchase order line cannot be closed when there are opened inbound shipments.');
            return false;
        }
        return true;
    }

    function checkLinkedInboundShipment() {
        if (parseFloatOrZero(nlapiGetCurrentLineItemValue('item', 'quantityonshipments')) > 0) {
            alert('You cannot change the unit on the line associated with inbound shipment.');
            return false;
        }
        return true;
    }

    // If the current row was populated from items that belong to a project, then certain of the fields are not editable.
    function syncProjectFields() {
        var revrecstarted = hasItemMachField('linkedrevrec') && getItemMachValue('linkedrevrec') == 'T';
        if (hasItemMachField('fromjob')) {
            var isdisabled = getItemMachValue('fromjob') == 'T';


            setItemMachDisabled('job', isdisabled || revrecstarted);
            setItemMachDisabled('item', isdisabled);
            setItemMachDisabled('quantity', isdisabled);
            setItemMachDisabled('units', isdisabled);
            setItemMachDisabled('price', isdisabled);

            if (isdisabled)
                setItemMachDisabled('rate', isdisabled);
            var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');
            setItemMachDisabled(amountField, isdisabled);

            if (hasItemMachField('billingscheduletype')) {
                var isbillingscheduledisabled = getItemMachValue('fromjob') == 'T';
                setItemMachDisabled('billingschedule', isbillingscheduledisabled);
            }
        } else {
            setItemMachDisabled('job', revrecstarted);
        }
    }

    function syncCommitInventory() {
        if (hasItemMachField('commitinventory')) {
            var itemtype = getItemType();
            setItemMachDisabled('commitinventory', itemtype != 'InvtPart' && itemtype != 'Assembly');
        }
    }

    function closeRemaining() {
        var linecount = nlapiGetLineItemCount('item');
        for (var i = 1; i <= linecount; i++) {
            if (getEncodedValue('item', i, 'isopen') == 'T')
                setEncodedValue('item', i, 'isclosed', 'T');
        }
        if (hasLegacyMachine())
            item_machine.buildtable();
        i = parseInt(nlapiGetCurrentLineItemIndex('item'));
        if (i < linecount && getItemMachValue('isopen') == 'T')
            setItemMachValue('isclosed', 'T');
        NS.form.setChanged(true);
    }

    function popupScheduleDiv(schedstr, fld) {
        if (schedstr == null || schedstr.length == 0)
            return;
        var scheduleDiv = document.getElementById('ScheduleInlineDIV');
        if (scheduleDiv == null) {
            scheduleDiv = document.createElement('div');
            scheduleDiv.style.border = '1px solid black';
            scheduleDiv.style.position = 'absolute';
            scheduleDiv.style.padding = '0px';
            scheduleDiv.onclick = function() { document.getElementById('ScheduleInlineDIV').style.display = 'none'; return false; };
            scheduleDiv.id = 'ScheduleInlineDIV';
            scheduleDiv.className = 'bglt';
            scheduleDiv.style.display = 'none';
            scheduleDiv.style.zIndex = 1000;

            document.body.appendChild(scheduleDiv);
        }
        var sched = schedstr.split(String.fromCharCode(5));
        var sHtml = '<table border=0 cellpadding=0 cellspacing=0>';
        var i;
        for (i = 0; i < sched.length; i += 2)
            sHtml += '<tr><td class=text align=right>' + sched[i] + '</td><td class=text>&nbsp;</td><td class=text align=right>' + sched[i + 1] + '</td></tr>';
        scheduleDiv.innerHTML = sHtml;
        scheduleDiv.style.left = findPosX(fld) + 'px';
        scheduleDiv.style.top = findPosY(fld) + fld.offsetHeight + 'px';
        scheduleDiv.style.display = '';
        addDivToClose('ScheduleInlineDIV');
    }

    function Item_Machine_doCheckMandatoryData(fldnam, linenum) {
        if (fldnam.substring(0, 4) != 'cust')
            return true;
        var itemtype = getEncodedValue('item', linenum, 'itemtype');
        if (itemtype == 'EndGroup')
            return false;
        if (itemtype != 'Group')
            return true;
        var fldflags = splitIntoCells(nlapiGetFieldValue('itemflags'));
        if ((fldflags[this.getArrayPosition(fldnam)] & 16) == 0)
            return (getEncodedValue('item', linenum, 'groupsetup') != 'T');
        return true;
    }

    // copied from CheckStockAmounts
    function showAllInventoryLevelWarnings(useloc) {
        var warningMsg = '';
        for (var i = 1; i < parseInt(nlapiGetLineItemCount('item') + 1); i++) {
            var linetype = getEncodedValue('item', i, 'itemtype');
            var createpo = (hasEncodedField('item', 'createpo') ? getEncodedValue('item', i, 'createpo') : '');
            var createwo = (hasEncodedField('item', 'createwo') ? getEncodedValue('item', i, 'createwo') : 'F');
            var invtcommittable = !getEncodedValue('item', i, 'notinvtcommittable') || getEncodedValue('item', i, 'notinvtcommittable') == 'F';
            if ((linetype == 'InvtPart' || linetype == 'Assembly' || linetype == 'Kit') && !(createpo == 'DropShip' || createpo == 'SpecOrd') && createwo != 'T' && invtcommittable) {
                var onhand = parseFloat(getEncodedValue('item', i, 'quantityavailable'));
                if (isNaN(onhand) && linetype != 'Kit') // null available for Kits means not-applicable, i.e. a kit with all non inventory items
                    onhand = 0;
                if (onhand < parseFloat(getEncodedValue('item', i, 'quantity'))) {
                    var locID = 0;
                    if (useloc == true) {
                        var locNode = getItemMachField('location') != null ? getItemMachField('location') : nlapiGetField('location');
                        if (locNode != null) {
                            locID = useInventoryLocationForFulfillment() ? (getItemMachField('inventorylocation') != null ? getItemMachField('inventorylocation') : 0) : (getItemMachField('location') != null ? getEncodedValue('item', i, 'location') : nlapiGetFieldValue('location'));
                            if (locID == '' || locID == 'undefined')
                                locID = 0;
                        } else
                            useloc = false;
                    }

                    var itemfldtext = nlapiGetLineItemText('item', 'item', i);

                    var unittext = '';
                    if (getItemMachField('units_display') != null) {
                        unittext = (nlapiGetLineItemValue('item', 'units_display', i).length > 0) ? (' ' + nlapiGetLineItemValue('item', 'units_display', i)) : '';
                    }

                    var showedWarningId = getShowedWarningId(getEncodedValue('item', i, 'item'), locID, unittext);
                    if (showedOnHandWarning[showedWarningId] == null) {
                        showedOnHandWarning[showedWarningId] = 'true';
                        warningMsg += getOnHandWarningMessage(locID, useloc, linetype, itemfldtext, onhand, unittext, getEncodedValue('item', i, 'backordered'), getEncodedValue('item', i, 'onorder')) + '\n';
                    }
                }
            }
        }
        if (warningMsg != '')
            alert(warningMsg);
    }

    // This function sets expectedshipdate to default value, if not set yet.
    function initializeExpectedShipmentDate() {
        var currentExpectedShipDate = getItemMachValue('expectedshipdate');
        if (!isValEmpty(currentExpectedShipDate) || 'Group' == nlapiGetCurrentLineItemValue('item', 'itemtype')) {
            //value is already initialized
            return;
        }
        var defaultExpectedShipDate = getDefaultExpectedShipmentDate();
        setItemMachValue('expectedshipdate', defaultExpectedShipDate);
    }

    /**
     * Returns expected shipment date 'shipdate' if not empty, otherwise 'trandate'
     * @returns {String} expected shipment date
     */
    function getDefaultExpectedShipmentDate() {
        var defaultExpectedShipDate = nlapiGetFieldValue('shipdate');
        if (isValEmpty(defaultExpectedShipDate))
            defaultExpectedShipDate = nlapiGetFieldValue('trandate');
        return defaultExpectedShipDate;
    }


    /**
     * This function sets expectedshipdate to default value, if not set yet.
     * @param groupstart
     * @param groupend
     */
    function initializeExpectedShipmentDateForGroup(groupstart, groupend) {
        var defaultExpectedShipDate = getDefaultExpectedShipmentDate();

        for (var i = groupstart; i < groupend; i++) {
            var currentExpectedShipDate = nlapiGetLineItemValue('item', 'expectedshipdate', i);
            if (isValEmpty(currentExpectedShipDate)) {
                if ((nlapiGetContext().getFeature('MRPORDEMANDPLAN') || nlapiGetContext().getFeature('SUPPLYALLOCATION')) && getTransactionType() != 'opprtnty' && getTransactionType() != 'estimate' && !nlapiGetContext().getFeature('AVAILABLETOPROMISE')) {
                    //value is not initialized yet, so we will initialize it now.
                    nlapiSetLineItemValue('item', 'expectedshipdate', i, defaultExpectedShipDate);
                }
            }
        }
    }

    function setDefaultExpectedReceiptDate() {
        var baseDateStr = getTransactionType() == 'purchord' ? nlapiGetFieldValue('trandate') : getItemMachValue('expectedshipdate');
        var baseDate = nlapiStringToDate(baseDateStr);
        if (baseDate != null) {
            var leadTime = isValEmpty(getItemMachValue('leadtime')) ? 0 : getItemMachValue('leadtime');
            setItemMachValue('expectedreceiptdate', nlapiDateToString(nlapiAddDays(baseDate, leadTime)));
        }
    }

    function setDefaultExpectedReceiptDateForGroup(groupstart, groupend) {
        for (var i = groupstart; i < groupend; i++) {
            var baseDateStr = getTransactionType() == 'purchord' ? nlapiGetFieldValue('trandate') : nlapiGetLineItemValue('item', 'expectedshipdate', i);
            var baseDate = nlapiStringToDate(baseDateStr);
            if (baseDate != null) {
                var leadTime = isValEmpty(nlapiGetLineItemValue('item', 'leadtime', i)) ? 0 : nlapiGetLineItemValue('item', 'leadtime', i);
                nlapiSetLineItemValue('item', 'expectedreceiptdate', i, nlapiDateToString(nlapiAddDays(baseDate, leadTime)));
            }
        }
    }


    function initializeOrderAllocationStrategyForGroup(groupstart, groupend) {
        for (var i = groupstart; i < groupend + 1; i++) {
            var itemType = nlapiGetLineItemValue('item', 'itemtype', i);
            var hasAllocationStrategy = ('InvtPart' == itemType || 'Kit' == itemType || 'Assembly' == itemType) && hasItemMachField('orderallocationstrategy');
            if (hasAllocationStrategy) {
                if ('salesorder' == nlapiGetRecordType() && nlapiGetFieldValue('defaultcustomerallocationstrategy') != '') {
                    nlapiSetLineItemValue('item', 'orderallocationstrategy', i, nlapiGetFieldValue('defaultcustomerallocationstrategy'));
                } else {
                    nlapiSetLineItemValue('item', 'orderallocationstrategy', i, nlapiGetLineItemValue('item', 'defaultorderallocationstrategy', i));
                }
            } else {
                nlapiSetLineItemValue('item', 'orderallocationstrategy', i, '');
                nlapiSetLineItemDisabled('item', 'orderallocationstrategy', true, i);
            }
        }
    }

    function allLinesAreDiscountOrMarkupAfterSubtotal(linenum) {
        for (var i = linenum; i > 0; i--) {
            var itemtype = getEncodedValue('item', i, 'itemtype');

            if (itemtype == 'Subtotal')
                break;

            if (itemtype != 'Discount' && itemtype != 'Markup')
                return false;
        }
        return true;
    }

    function nlapiSetCurrentLineItemValueIfChanged(machine, field, value) {
        if (nlapiGetCurrentLineItemValue(machine, field) != value) {
            nlapiSetCurrentLineItemValue(machine, field, value);
        }
    }

    function clearItemSourceField() {
        var item = nlapiGetCurrentLineItemValue('item', 'item');
        nlapiSetCurrentLineItemValueIfChanged('item', 'itemsource', item ? 'STOCK' : '')
    }


    // refresh cost estimate rate by re-enter cost estimate type, used when entity or currency is changed
    function refreshUncommitedCostEstimateRate() {
        if (nlapiGetCurrentLineItemValue('item', 'item')) {
            var fields = ['costestimatetype'];

            for (var i = 0; i < fields.length; i++) {
                var fld = fields[i];
                var value = nlapiGetCurrentLineItemValue('item', fld);
                if (value) {
                    nlapiSetCurrentLineItemValue('item', fld, value, true, true);
                }
            }
        }

    }

    function enableChargeFields() {
        if (hasItemMachField('chargetype')) {
            var hasChargeType = itemMachCurrentLineValueNotEmpty('chargetype');
            var hasCharges = itemMachCurrentLineValueNotEmpty('charges');
            var hasChargeRuleVal = hasChargeRule();
            var hasActualChargesVal = hasActualCharges();

            // keep the fields editable if charge rule is set, but doesn't have actual charges
            var isdisabled = hasChargeType || hasCharges;
            if (hasChargeRuleVal && !hasActualChargesVal)
                isdisabled = false;

            // Issue 487240: Sales Order> Next Bill> Cannot Bill Charges Marked Ready
            var chargeType = getItemMachValue('chargetype'),
                isQuantityRateAmountDisabled = isdisabled;
            if (chargeType && (nlapiGetRecordType() === 'salesorder') && (nlapiGetContext().getCompany() === '1017942')) {
                isQuantityRateAmountDisabled = (chargeType > -10) || (chargeType < -13);
            }

            setItemMachDisabled('item', isdisabled);
            if (hasItemMachField('job')) {
                setItemMachDisabled('job', isdisabled);
            }
            if (hasItemMachField('price')) {
                setItemMachDisabled('price', isdisabled);
            }

            // charge type must not be editable when there is a charge rule set
            setItemMachDisabled('chargetype', isdisabled || hasChargeRuleVal);
            setItemMachDisabled('quantity', isQuantityRateAmountDisabled);
            setItemMachDisabled('rate', isQuantityRateAmountDisabled);
            var amountField = taxInclusivePricingHelper.getEditableFieldName('amount');
            setItemMachDisabled(amountField, isQuantityRateAmountDisabled);
            setItemMachDisabled('units', isdisabled);

            if (hasItemMachField('chargerule')) {
                var isChargeBasedProject = nlapiGetFieldValue('projectbillingtype') === 'CB';
                var isAmountPositive = getItemMachValue('amount') > 0;
                var isServiceItem = getItemMachValue('itemtype') === 'Service';
                var isItemFulfillable = getItemMachValue('fulfillable') === 'T';
                var isChargeRuleApplicable = isChargeBasedProject && isAmountPositive && isServiceItem && !isItemFulfillable;
                var isChargeRuleEditable = isChargeRuleApplicable && (!hasChargeRuleVal || !hasActualChargesVal);
                if (hasChargeRuleVal) {
                    if (!isChargeRuleApplicable) {
                        setItemMachValue('chargerule', '');
                        setItemMachValue('chargetype', '');
                    }
                    setItemMachValue('fromjob', 'F');
                    setItemMachValue('isestimate', 'F');
                }
                setItemMachDisabled('chargerule', isdisabled || !isChargeRuleEditable);
            }
        }
    }

    // does the line have charge rule field set?
    function hasChargeRule() {
        return hasItemMachField('chargerule') && itemMachCurrentLineValueNotEmpty('chargerule');
    }

    // does the charge rule set on the line have any actual charges created from it?
    function hasActualCharges() {
        // actual charges field might stay non-empty after charge rule is set to empty, therefore only check actual charges if charge rule is set
        return hasChargeRule() && hasItemMachField('actualcharges') && getItemMachValue('actualcharges') > 0;
    }

    function Item_Machine_postEditRow() {
        if (getTransactionType() == 'workord') {
            disableButton(this.name + "_copy", isOrderFinished());
            disableButton(this.name + "_remove", isLineLinked() || isOrderFinished());
            disableButton(this.name + "_insert", isOrderFinished());
        }
    }

    function isLineLinked() {
        return getItemMachValue('linked') == 'T';
    }

    function isOrderFinished() {
        return getOrderStatus() == 'G' || getOrderStatus() == 'H';
    }

    function getOrderStatus() {
        return nlapiGetFieldValue('orderstatus');
    }

    function isItemSourcedFromTransaction() {
        return !isValEmpty(getItemMachValue('poid')) || !isValEmpty(getItemMachValue('woid'));
    }

    var currentItemLineGroup; // global variable used in sorting and comparison while doing tax rounding adjustment
    var isAdjusting = false;

    function adjustLineItemTaxAmounts() {
        // In case that Tax Amount Overrides are set, do not adjust Tax Amounts, since that might bring transaction out of balance.
        if (nlapiGetField('taxamountoverride') != null && nlapiGetField('taxamount2override') != null) {
            var taxAmountOverrideValue = nlapiGetFieldValue('taxamountoverride');
            var taxAmount2OverrideValue = nlapiGetFieldValue('taxamount2override');

            if (taxAmountOverrideValue || taxAmount2OverrideValue) {
                return;
            }
        }

        if (isAdjusting) {
            return;
        }

        // if there is different rounding unit than currency precision, then don't do any adjustment
        if (nlapiGetField('taxfractionunit') != null && !isNaN(parseFloat(nlapiGetFieldValue('taxfractionunit'))) && parseFloat(nlapiGetFieldValue('taxfractionunit')) != get_precision()) {
            return;
        }

        isAdjusting = true;
        adjustLineItemTaxAmountsForMachine('item');
        adjustLineItemTaxAmountsForMachine('expcost');
        adjustLineItemTaxAmountsForMachine('time');
        adjustLineItemTaxAmountsForMachine('itemcost');
        isAdjusting = false;
    }

    function adjustLineItemTaxAmountsForMachine(machineName) {
        var linecount = nlapiGetLineItemCount(machineName);
        if (linecount < 1) {
            return;
        }

        var itemLineGroups = [];

        for (var i = 1; i <= linecount; i++) {
            var linetype = nlapiGetLineItemValue(machineName, 'itemtype', i);
            var apply = nlapiGetLineItemValue(machineName, 'apply', i);
            if (linetype != 'Subtotal' && linetype != 'EndGroup' && linetype != 'Description' && linetype != 'Group' && (apply == 'T' || apply == null)) {
                var taxcode = nlapiGetLineItemValue(machineName, 'taxcode', i);
                // since tax columns are not mandatory in some tabs, if tax code is not set, then just return without any adjustments.
                if (taxcode == '' || taxcode == null) {
                    return;
                }

                var taxrate = parseFloat(nlapiGetLineItemValue(machineName, 'taxrate1', i));
                var taxamount = nlapiGetLineItemValue(machineName, 'tax1amt', i);
                if (taxrate != 0.0) {
                    if (typeof itemLineGroups[taxcode] == 'undefined') {
                        itemLineGroups[taxcode] = new ItemLineGroup(taxrate, machineName);
                    }
                    itemLineGroups[taxcode].addIndex(i);
                }
            }
        }

        for (var taxcode in itemLineGroups) {
            currentItemLineGroup = itemLineGroups[taxcode];
            if (typeof currentItemLineGroup == 'undefined') {
                break;
            }
            itemLineGroups[taxcode].calcDelta();
            itemLineGroups[taxcode].distributeDelta();
        }
    }

    function ItemLineGroup(taxRate, machineName) {
        this.machineName = machineName;
        this.taxRate = taxRate;
        this.indices = [];
        this.currencyPrecision = parseFloat(nlapiGetFieldValue('currencyprecision'));
        this.unit = round_currency(Math.pow(10, -this.currencyPrecision), this.currencyPrecision);

        // load tax rounding preferences
        this.taxRoundingUnit = get_precision();
        if (nlapiGetField('taxfractionunit') != null && !isNaN(parseFloat(nlapiGetFieldValue('taxfractionunit')))) {
            this.taxRoundingUnit = parseFloat(nlapiGetFieldValue('taxfractionunit'));
        }
        this.taxRounding = 'OFF';
        if (nlapiGetField('taxrounding') != null) {
            this.taxRounding = nlapiGetFieldValue('taxrounding');
        }
    }

    ItemLineGroup.prototype.addIndex = function(index) {
        this.indices[this.indices.length] = index;
    };

    ItemLineGroup.prototype.sort = function() {
        // Variable 'me' is required because of scope in 'compare' method. There is the call for method from 'this' (me).
        var me = this;
        this.indices.sort(function(s1, s2) {
            return me.compare(s1, s2);
        });
    };

    /**
     * Refactored method solving math problem: 0/0=NaN. This cause exception in comparison method: 'java.lang.IllegalArgumentException: Comparison method violates its general contract!'.
     * Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Return_value
     * Issue 512877
     */
    ItemLineGroup.prototype.computeDeltaPerc = function(sign, unit, actualTaxAmount, calcTaxAmount, netAmount) {
        var numerator = actualTaxAmount + sign * unit - calcTaxAmount;
        if (numerator === 0) {
            return 0;
        }
        var deltaPerc = numerator / netAmount;
        var deltaPercAbsolute = Math.abs(deltaPerc);
        return deltaPercAbsolute;
    }

    ItemLineGroup.prototype.compare = function(i1, i2) {
        if (typeof currentItemLineGroup.machineName == 'undefined') {
            return 0;
        }

        var sign = currentItemLineGroup.delta > 0 ? 1 : -1;
        var netAmount1 = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, 'amount', i1));
        var netAmount2 = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, 'amount', i2));
        var taxrate = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, 'taxrate1', i1));
        var calcTaxAmount1 = netAmount1 * taxrate / 100; // nominal line tax amount calculated from tax rate and net amount
        var calcTaxAmount2 = netAmount2 * taxrate / 100;
        var actualTaxAmount1 = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, 'tax1amt', i1)); // what's currently in the tax amount column
        var actualTaxAmount2 = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, 'tax1amt', i2));
        var deltaPerc1 = this.computeDeltaPerc(sign, currentItemLineGroup.unit, actualTaxAmount1, calcTaxAmount1, netAmount1);
        var deltaPerc2 = this.computeDeltaPerc(sign, currentItemLineGroup.unit, actualTaxAmount2, calcTaxAmount2, netAmount2);

        var taxDelta1 = calcTaxAmount1 - actualTaxAmount1;
        var taxDelta2 = calcTaxAmount2 - actualTaxAmount2;
        var taxDeltaSign1 = taxDelta1 > 0 ? 1 : (taxDelta1 < 0 ? -1 : 0);
        var taxDeltaSign2 = taxDelta2 > 0 ? 1 : (taxDelta2 < 0 ? -1 : 0);

        // order by percentage within the same sign group
        if (taxDeltaSign1 == taxDeltaSign2) {
            if (deltaPerc1 == deltaPerc2) {
                return i2 - i1; // in case of a tie, choose the line towards the end
            } else {
                return deltaPerc1 - deltaPerc2; // put the line with the smallest percentage change in the front
            }
        } else {
            // sort into sign groups - adjustments with the same sign as delta are preferred over others
            return sign * (taxDeltaSign2 - taxDeltaSign1);
        }
    };


    ItemLineGroup.prototype.calcDelta = function() {
        if (this.indices.length < 1) {
            this.unroundedDelta = 0.0;
            this.delta = 0.0;
        } else {
            var newTotalTax = 0.0;
            var oldTotalTax = 0.0;
            var oldLineTax, netAmount;
            for (var i = 0; i < this.indices.length; i++) {
                netAmount = nlapiGetLineItemValue(this.machineName, 'amount', this.indices[i]);
                netAmount = netAmount.replace(/,/g, "");
                newTotalTax += parseFloat(netAmount) * this.taxRate / 100.0;
                oldLineTax = parseFloat(nlapiGetLineItemValue(this.machineName, 'tax1amt', this.indices[i]));
                oldTotalTax += oldLineTax;
            }
            // Note: Unrounded delta serves for detection of Tax Amount Override
            this.unroundedDelta = newTotalTax - oldTotalTax;

            // do the rounding for the new total tax
            newTotalTax = round_currency(newTotalTax, this.taxRoundingUnit, this.taxRounding);

            this.delta = round_currency(newTotalTax - oldTotalTax);
        }
    };

    ItemLineGroup.prototype.distributeDelta = function() {
        if (this.delta == 0.0 || isNaN(this.delta)) {
            return;
        }

        // Note: this condition serves to detect override in Transaction Level rounding - delta is too high to be distributed
        if (Math.abs(this.unroundedDelta) / this.unit > this.indices.length) {
            return;
        }

        this.sort();

        var sign = this.delta > 0 ? 1 : -1;
        var adjustment = sign * this.unit;

        for (var i = 0; i < this.indices.length; i++) {
            var lineTaxAmount = parseFloat(nlapiGetLineItemValue(this.machineName, 'tax1amt', this.indices[i]));
            var lineGrossAmount = parseFloat(nlapiGetLineItemValue(this.machineName, 'grossamt', this.indices[i]));
            nlapiSetLineItemValue(this.machineName, 'tax1amt', this.indices[i], format_currency(lineTaxAmount + adjustment));
            nlapiSetLineItemValue(this.machineName, 'grossamt', this.indices[i], format_currency(lineGrossAmount + adjustment));
            this.delta = round_currency(this.delta - adjustment, this.currencyPrecision);
            if (this.delta == 0) {
                break;
            }
        }
    };


    function DiscountLevel(id, minimumamount, amount, cummulativeAmount) {
        this.id = id;
        this.minimumamount = parseFloat(minimumamount);
        this.amount = parseFloat(amount);
        this.cummulativeAmount = parseFloat(cummulativeAmount);
    }

    DiscountLevel.prototype.incrementAmount = function DiscountLevel_incrementAmount(amount) {
        this.cummulativeAmount += amount;
    }

    function DiscountList(discountLevelsArray, cummulativeAmount) {
        this.discountLevels = [];
        for (var i = 0; i < discountLevelsArray.length; i++)
            this.discountLevels.push(new DiscountLevel(discountLevelsArray[i].id, discountLevelsArray[i].quantity, discountLevelsArray[i].amount, discountLevelsArray[i].cummulativeAmount));
        this.cummualiveAmount = cummulativeAmount;
        this.index = 0;
    }

    DiscountList.prototype.isEmpty = function DiscountList_isEmpty() {
        return this.discountLevels.length == 0;
    }

    DiscountList.prototype.incrementCummulativeAmount = function DiscountList_incrementCummulativeAmount(amount) {
        this.cummualiveAmount += amount;
    }

    DiscountList.prototype.getCurrentDiscountLevel = function DiscountList_getCurrentDiscountLevel() {
        for (; this.index < this.discountLevels.length - 1; this.index++) {
            var level = this.discountLevels[this.index + 1];
            if (level.minimumamount > this.cummualiveAmount)
                break;
        }
        return this.discountLevels[this.index];
    }

    function ItemRateElement(discountLevel, quantity, amount) {
        this.discountLevel = discountLevel;
        this.quantity = quantity;
        this.amount = amount;
    }

    function ItemRateElements(elements) {
        this.elements = elements;
    }

    ItemRateElements.prototype.calculateAmount = function ItemRateElements_calculateAmount(priceUsingType) {
        if (priceUsingType == 'LOTRATE')
            return this.elements[0].amount;
        else {
            var amount = 0;
            for (var i = 0; i < this.elements.length; i++)
                amount += this.elements[i].quantity * this.elements[i].amount;
            return amount;
        }
    }

    function PurchaseContract(id, discountList) {
        this.id = id;
        this.discountList = discountList;
    }

    PurchaseContract.prototype.getHeaderDiscount = function PurchaseContract_getHeaderDiscount(amount, quantity) {
        if (!this.discountList.isEmpty()) {
            return this.calculateDiscountedAmount(amount, quantity);
        } else {
            return new ItemRateElements([new ItemRateElement(null, 1, amount)]);
        }
    }

    PurchaseContract.prototype.calculateDiscountedAmount = function PurchaseContract_calculateDiscountedAmount(amount, quantity) {
        var elements = [];
        var discountList = this.discountList;
        var rate = amount / quantity;
        var quantityPurchased = 0;
        var previousLevel = discountList.discountLevels[0];
        var discountedRate = rate * (1 + previousLevel.amount);
        for (var i = 1; i < discountList.discountLevels.length; i++) {
            var level = discountList.discountLevels[i];
            var tierAmount = level.minimumamount - (previousLevel.minimumamount + previousLevel.cummulativeAmount);
            if (tierAmount > 0) {
                var qtyCanPurchase = tierAmount / discountedRate;
                if (quantityPurchased + qtyCanPurchase > quantity) {
                    break;
                } else {
                    quantityPurchased += qtyCanPurchase;
                    previousLevel.incrementAmount(tierAmount);
                    elements.push(new ItemRateElement(previousLevel, 1, tierAmount));
                }
            }
            previousLevel = level;
            discountedRate = rate * (1 + level.amount);
        }
        previousLevel.incrementAmount((quantity - quantityPurchased) * discountedRate);
        elements.push(new ItemRateElement(previousLevel, 1, (quantity - quantityPurchased) * discountedRate));
        return new ItemRateElements(elements);
    }

    function PurchaseContractItem(id, baseRate, priceUsingType, calculateDiscountUsing, discountList) {
        this.id = id;
        this.baseRate = baseRate;
        this.priceUsingType = priceUsingType;
        this.calculateDiscountUsing = calculateDiscountUsing;
        this.discountList = discountList;
    }

    PurchaseContractItem.prototype.calculatePurchaseAmount = function PurchaseContractItem_calculatePurchaseAmount(quantity) {
        var elements = [];
        if (this.discountList.isEmpty()) {
            elements.push(new ItemRateElement(null, quantity, this.baseRate));
        } else if (this.priceUsingType == 'MARGINALRATE') {
            var quantityPurchased = 0;
            var previousLevel = this.discountList.discountLevels[0];
            for (var i = 1; i < this.discountList.discountLevels.length && quantityPurchased < quantity; i++) {
                var level = this.discountList.discountLevels[i];
                var qtyToPurchase = level.minimumamount - (previousLevel.minimumamount + previousLevel.cummulativeAmount);
                if (qtyToPurchase > 0) {
                    var levelQuantity = Math.min(qtyToPurchase, quantity - quantityPurchased);
                    elements.push(new ItemRateElement(previousLevel, levelQuantity, previousLevel.amount));
                    quantityPurchased += levelQuantity;
                    previousLevel.incrementAmount(levelQuantity);
                }
                previousLevel = level;
            }
            if (quantityPurchased < quantity)
                elements.push(new ItemRateElement(previousLevel, quantity - quantityPurchased, previousLevel.amount));
        } else {
            this.discountList.incrementCummulativeAmount(quantity);
            var level = this.discountList.getCurrentDiscountLevel();
            elements.push(new ItemRateElement(level, quantity, level.amount));
        }
        return new ItemRateElements(elements);
    }

    function RateCalculator(contract, item, itemCount) {
        this.contract = contract;
        this.item = item;
        this.itemCount = itemCount;
        this.itemCountOrdered = itemCount;
        this.amount = null;
        this.rate = null;
        this.rateElements = null;
        this.contractDiscount = null;
    }

    RateCalculator.prototype.calculateAmount = function RateCalculator_calculateAmount() {
        if (this.amount == null) {
            this.rateElements = this.item.calculatePurchaseAmount(this.itemCount);
            var itemAmount = this.rateElements.calculateAmount(this.item.priceUsingType);
            this.contractDiscount = this.contract.getHeaderDiscount(itemAmount, this.itemCount);
            this.amount = this.contractDiscount.calculateAmount('');
            this.headerDiscount = this.amount - itemAmount;
            this.rate = this.amount / this.itemCount;
        }
    }

    RateCalculator.prototype.addLine = function RateCalculator_addLine(quantity) {
        this.itemCount += quantity;
        this.itemCountOrdered += quantity;
    }

    RateCalculator.prototype.getAmountForQuantity = function RateCalculator_getAmountForQuantity(quantity) {
        var lineAmount;
        if (quantity == this.itemCountOrdered) {
            //Precision needs to be set to 8 to properly calculate the rate (rate precision is 8)
            return round_currency(this.amount, 8);
        } else if (this.item.priceUsingType == "LOTRATE") {
            //Here we need the amount precision (2), as the amount can be divided in several lines if the contract is lot based
            lineAmount = round_currency(this.rate * quantity);
        } else {
            lineAmount = round_currency(this.rate * quantity, 8);
        }

        this.amount -= lineAmount;
        this.itemCountOrdered -= quantity;
        return lineAmount;
    }

    function ItemRate(lineIndex, itemCount, rateCalculator) {
        this.lineIndex = lineIndex;
        this.itemCount = itemCount;
        this.rateCalculator = rateCalculator;
    }

    ItemRate.prototype.numberOfDecimalPlaces = function ItemRate_numberOfDecimalPlaces() {
        var itemCountStr = this.itemCount + '';
        var decimalIndex = itemCountStr.indexOf('.');
        if (decimalIndex >= 0) {
            return Math.max(2, itemCountStr.length - decimalIndex - 1);
        }
        return 2;
    }

    ItemRate.prototype.setRateAndAmount = function ItemRate_setRateAndAmount() {
        this.rateCalculator.calculateAmount();
        var amount = this.rateCalculator.getAmountForQuantity(this.itemCount);
        var rate = amount / parseFloat(getLineValue(this.lineIndex, 'quantity'));
        this.setValue('amount', round_currency(amount));
        this.setValue('rate', round_currency(rate, 8));

        var contractItem = this.rateCalculator.item;
        var rateDetails = '{ "priceUsingType" : "' + contractItem.priceUsingType + '", "calculateDiscountType" : "' + contractItem.calculateDiscountUsing + '", "headerDiscount" : "' + this.rateCalculator.headerDiscount;
        rateDetails += '", "contractDiscountLevels" : [ ';
        for (var i = 0; i < this.rateCalculator.contractDiscount.elements.length; i++) {
            if (i > 0)
                rateDetails += ', ';
            var level = this.rateCalculator.contractDiscount.elements[i];
            rateDetails += '{ "id" : ' + level.discountLevel.id + ', "amount" : ' + level.amount + '}';
        }
        rateDetails += ' ]';
        if (contractItem.discountList.isEmpty())
            rateDetails += ', "discountLevels" : [ {"id" : -1, "quantity" : ' + this.itemCount + ', "rate" : ' + contractItem.baseRate + ', "seqnum" : 0, "tierquantity" : 0 }]';
        else {
            rateDetails += ', "discountLevels" : [ ';
            var idx = 0;
            for (var i = 0; i < contractItem.discountList.discountLevels.length; i++) {
                if (i > 0)
                    rateDetails += ', ';
                var discountLevel = contractItem.discountList.discountLevels[i];
                if (idx == this.rateCalculator.rateElements.elements.length) {
                    rateDetails += '{ "id" : ' + discountLevel.id + ', "quantity" : 0, "rate" : ' + discountLevel.amount + ', "seqnum" : ' + i + ', "tierquantity" : ' + discountLevel.minimumamount + '}';
                } else {
                    var itemRateElement = this.rateCalculator.rateElements.elements[idx];
                    if (discountLevel.id == itemRateElement.discountLevel.id) {
                        var qty = (this.itemCount == this.rateCalculator.itemCount) ? itemRateElement.quantity : round_currency(itemRateElement.quantity * this.itemCount / this.rateCalculator.itemCount, this.numberOfDecimalPlaces());
                        rateDetails += '{ "id" : ' + discountLevel.id + ', "quantity" : ' + qty + ', "rate" : ' + discountLevel.amount + ', "seqnum" : ' + i + ', "tierquantity" : ' + discountLevel.minimumamount + ' }';
                        idx++;
                    } else
                        rateDetails += '{ "id" : ' + discountLevel.id + ', "quantity" : 0, "rate" : ' + discountLevel.amount + ', "seqnum" : ' + i + ', "tierquantity" : ' + discountLevel.minimumamount + '}';
                }
            }
            rateDetails += ' ]';
        }
        rateDetails += ' }';
        this.setValue('ratedetails', rateDetails);
    }

    ItemRate.prototype.setValue = function ItemRate_setValue(field, value) {
        if (this.lineIndex == nlapiGetCurrentLineItemIndex('item'))
            setItemMachValue(field, value);
        else
            setEncodedItemValue(this.lineIndex, field, value);
    }

    function getLineValue(index, field) {
        if (index == nlapiGetCurrentLineItemIndex('item'))
            return getItemMachValue(field);
        else
            return getEncodedItemValue(index, field);
    }

    function calculateRateAndAmountForLine(updateContract) {
        var contractId = getItemMachValue('purchasecontract');
        var contractDetails = getItemMachValue('contractdetails');
        calculateContractRateForAllLines(contractId, contractDetails, updateContract, false);
    }

    function recalculateLinesForOldContract() {
        var oldContractId = getItemMachValue('previouspurchasecontract');
        if (isValEmpty(oldContractId))
            return;

        if (oldContractId == getItemMachValue('purchasecontract'))
            return;

        var oldContractDetails = null;
        for (var i = 1; i <= nlapiGetCurrentLineItemIndex('item'); i++) {
            if (getEncodedItemValue(i, 'purchasecontract') == oldContractId) {
                oldContractDetails = getEncodedItemValue(i, 'contractdetails');
                break;
            }
        }

        if (oldContractDetails != null)
            calculateContractRateForAllLines(oldContractId, oldContractDetails, false, true);
    }

    function calculateContractRateForAllLines(contractId, contractDetails, updateContract, excludeCurrentLine) {
        var contractObject = JSON.parse(contractDetails);
        var contract = new PurchaseContract(contractId, new DiscountList(contractObject.discountList, 0));

        var contractsToCalculate = [];
        var calculatorCache = {};
        var itemCount = Math.max(nlapiGetCurrentLineItemIndex('item'), nlapiGetLineItemCount('item'));
        for (var i = 1; i <= itemCount; i++) {
            if (excludeCurrentLine && i == nlapiGetCurrentLineItemIndex('item'))
                continue;

            if (i == nlapiGetCurrentLineItemIndex('item') || getEncodedItemValue(i, 'purchasecontract') == contractId) {
                var item = getLineValue(i, 'item');
                if (updateContract && i != nlapiGetCurrentLineItemIndex('item')) {
                    setEncodedItemValue(i, 'contractdetails', contractDetails);
                    if (item == getItemMachValue('item'))
                        setEncodedItemValue(i, 'itemcontractdetails', getItemMachValue('itemcontractdetails'));
                }

                var quantity = parseFloat(getLineValue(i, 'quantity'));
                if (hasItemMachField('unitconversionrate')) {
                    if (getLineValue(i, 'unitconversionrate') != '')
                        quantity = quantity * getLineValue(i, 'unitconversionrate');
                }

                var contractItemObject = JSON.parse(getLineValue(i, 'itemcontractdetails'));
                var contractItem = new PurchaseContractItem(item, contractItemObject.baseRate, contractItemObject.pricingUsingType, contractItemObject.calculateDiscountType, new DiscountList(contractItemObject.discountList, 0));
                var rateCalculator;
                if (contractItem.calculateDiscountUsing == 'OVERALL' || contractItem.calculateDiscountUsing == 'OVERALLPO') {
                    rateCalculator = calculatorCache['item' + item];
                    if (typeof rateCalculator == 'undefined') {
                        rateCalculator = new RateCalculator(contract, contractItem, quantity);
                        calculatorCache['item' + item] = rateCalculator;
                    } else
                        rateCalculator.addLine(quantity);
                } else
                    rateCalculator = new RateCalculator(contract, contractItem, quantity);
                contractsToCalculate.push(new ItemRate(i, quantity, rateCalculator));
            }
        }

        for (var i = 0; i < contractsToCalculate.length; i++) {
            contractsToCalculate[i].setRateAndAmount();
        }
    }

    var autoLocationAssignmentModule = (function() {
        var relevantItemTypesArr = ["Assembly", "GiftCert", "InvtPart", "Kit", "NonInvtPart", "Service"];
        var noautoassignlocationField = 'noautoassignlocation';
        var keepnoautoassignlocationsettofalseField = 'keepnoautoassignlocationsettofalse';
        var itemMachine = 'item';
        var itemTypeField = 'itemtype';
        var itemfulfillmentchoiceField = 'itemfulfillmentchoice';

        var disableAutoLocationFieldsForIrrelevantItemTypes = function() {
            nlapiSetLineItemDisabled(itemMachine, noautoassignlocationField, !isRelevantItemType(nlapiGetCurrentLineItemValue(itemMachine, itemTypeField)));
        };

        var updateNoAutoAssignLocationWhenFulfillmentChoiceChange = function() {
            if (hasItemMachField(noautoassignlocationField)) {
                var isStorePickUpSelected = isStorePickUpFulfillmentChoiceSelected(itemfulfillmentchoiceField);

                if (isStorePickUpSelected) {
                    nlapiSetCurrentLineItemValue(itemMachine, noautoassignlocationField, 'F', true, true);
                }
                setItemMachDisabled(noautoassignlocationField, isStorePickUpSelected);
            }
        };

        var updateDoNotAutoAssignLocationWhenLocationChange = function(locationField) {
            var isStorePickUpSelected = isStorePickUpFulfillmentChoiceSelected(itemfulfillmentchoiceField);

            if (!isStorePickUpSelected) {
                if (isRelevantItemType(nlapiGetCurrentLineItemValue(itemMachine, itemTypeField))) {
                    if (!nlapiGetCurrentLineItemValue(itemMachine, keepnoautoassignlocationsettofalseField)) {
                        nlapiSetCurrentLineItemValue(itemMachine, noautoassignlocationField, !!nlapiGetCurrentLineItemValue(itemMachine, locationField) ? 'T' : 'F', true, true);
                    }
                }
            }
        };

        var isStorePickUpFulfillmentChoiceSelected = function() {
            return (nlapiGetCurrentLineItemValue(itemMachine, itemfulfillmentchoiceField) == 2);
        };

        var isRelevantItemType = function(itemType) {
            if (!!relevantItemTypesArr) {
                return relevantItemTypesArr.indexOf(itemType) >= 0;
            }

            return false;
        };

        return {
            disableAutoLocationFieldsForIrrelevantItemTypes: disableAutoLocationFieldsForIrrelevantItemTypes,
            isRelevantItemType: isRelevantItemType,
            updateNoAutoAssignLocationWhenFulfillmentChoiceChange: updateNoAutoAssignLocationWhenFulfillmentChoiceChange,
            updateDoNotAutoAssignLocationWhenLocationChange: updateDoNotAutoAssignLocationWhenLocationChange
        }
    })();

    var storePickUpConnector = (function() {
        var machineName = 'item';
        var itemFulfillmentChoiceField = 'itemfulfillmentchoice';
        var storePickUpFulfillmentChoiceId = '2';
        var itemMachLocationPrevValue = '';
        var locationPrevValue = '';
        var allowFulfillmentChoiceRecalcInSalesOrder = true;
        var fulfillmentLocationField = 'location';
        var fieldExcludeFromRateRequest = 'excludefromraterequest';

        var isFulfillableLine = function(index) {
            var itemType = getLineValue(index, 'itemtype');
            var fulfillableFlag = getLineValue(index, 'fulfillable');
            return shouldHaveFulfillmentChoice(itemType, fulfillableFlag);
        };

        var canHaveFulfillmentChoice = function(itemType, fulfillableFlag) {
            return shouldHaveFulfillmentChoice(itemType, fulfillableFlag) || 'Group' == itemType;
        };

        var shouldHaveFulfillmentChoice = function(itemType, fulfillableFlag) {
            if ('Assembly' == itemType || 'InvtPart' == itemType) {
                return true;
            } else if (('Service' == itemType || 'OthCharge' == itemType || 'GiftCert' == itemType || 'NonInvtPart' == itemType || 'Kit' == itemType || 'DwnLdItem' == itemType) && fulfillableFlag == 'T') {
                return true;
            }

            return false;
        };

        // Triggered when the Fulfillment Choice in the order level changes and when adding items by Add Multiple button
        var setFulfillmentChoiceInItemMachine = function(itemFulfillmentChoiceField, fulfillmentChoiceField) {
            var value = nlapiGetFieldValue(fulfillmentChoiceField);
            if (value != "") {
                var count = nlapiGetLineItemCount(machineName);
                for (var i = 1; i <= count; i++) {
                    if (isFulfillableLine(i)) {
                        if (nlapiGetLineItemValue(machineName, itemFulfillmentChoiceField, i) != value) {
                            // We go line by line updating FulfillmentChoice value and restoring the value in Location.
                            // The var allowFulfillmentChoiceRecalcInSalesOrder is used in order to break the infinite loop:
                            // 		* When SalesOrd level FulfillmentChoice changes, we cascade its value down to the Item Mach level FulfillmentChoices
                            //		* When a Line is commited in the Item Mach, SalesOrd level FulfillmentChoice is recalculated
                            // Note: when selecting a line, if another was selected, it will be commited and the order fulfillment choice recalculated. So it's important to disable the recalc before the selection
                            allowFulfillmentChoiceRecalcInSalesOrder = false;
                            var locationPrevValue = nlapiGetLineItemValue(machineName, fulfillmentLocationField, i);
                            nlapiSelectLineItem(machineName, i, false);
                            nlapiSetCurrentLineItemValue(machineName, itemFulfillmentChoiceField, value, true, true);
                            nlapiSetCurrentLineItemValue(machineName, fulfillmentLocationField, locationPrevValue, true, true);
                            nlapiCommitLineItem(machineName);
                            allowFulfillmentChoiceRecalcInSalesOrder = true;
                        }
                    }
                }
            }
        };

        // Triggered when commiting a line in the machine (add, Add Multiple, update, remove...) or loading the page in edit mode
        var setFulfillmentChoiceInSalesOrder = function(machineField, fulfillmentChoiceField) {
            var itemfulfillmentChoiceField =
                nlapiGetField(fulfillmentChoiceField);
            if (itemfulfillmentChoiceField && !itemfulfillmentChoiceField.isHidden()) {
                var prevValue = "",
                    value = "";
                var existsFulfillableItem = false;
                var count = nlapiGetLineItemCount(machineName);
                var index;

                // Before changing the Fulfillment Choice value, let's save the the current Location value, so we can restore it after slaving happens
                saveLocationPrevValue(fulfillmentLocationField);

                for (index = 1; index <= count; index++) {
                    // Only fulfillable items are taken into account
                    if (isFulfillableLine(index)) {
                        existsFulfillableItem = true;
                        value = nlapiGetLineItemValue(machineName, machineField, index); // Do no use getLineValue() because we don't want to take into account the selected line when removing
                        if (value != prevValue && prevValue != "") {
                            // We found some some lines with different values
                            nlapiSetFieldValue(fulfillmentChoiceField, "", true, true);
                            break;
                        }
                        prevValue = value;
                    }
                }

                if (index == count + 1 && value == prevValue && value != nlapiGetFieldValue(fulfillmentChoiceField)) {
                    // We left the loop and all values were equal
                    nlapiSetFieldValue(fulfillmentChoiceField, value, true, true);
                }

                // Enable or disable the field if there are fulfillable items (or machine is empty) or not.
                if (existsFulfillableItem || count == 0)
                    nlapiSetFieldDisabled(fulfillmentChoiceField, false);
                else
                    nlapiSetFieldDisabled(fulfillmentChoiceField, true);
            }
        };

        // Triggered both when selecting an item in the dropdown and clicking on an existing line to modify it
        var enableDisableFulfillmentChoiceField = function(machineField) {
            // It also checks that the field exists in the machine
            var hasDownstreamFulfillmentTransaction = parseInt(getItemMachValue('quantityrequestedtofulfill')) > 0 || getItemMachValue('itempicked') == 'T';
            setItemMachDisabled(machineField, !canHaveFulfillmentChoice(getItemType(), getItemMachValue('fulfillable')) || hasDownstreamFulfillmentTransaction);
        };

        // Triggered when selecting an item in the dropdown, but not when clicking on an existing line to modify it
        var setDefaultFulfillmentChoice = function(itemFulfillmentChoiceField, fulfillmentChoiceField, fallbackValue) {
            var currentLineFulfillmentChoice = nlapiGetCurrentLineItemValue(machineName, itemFulfillmentChoiceField);
            if (canHaveFulfillmentChoice(getItemType(), getItemMachValue('fulfillable'))) {
                if (currentLineFulfillmentChoice == '') {
                    var orderFulfillmentChoice = nlapiGetFieldValue(fulfillmentChoiceField);
                    var newLineFulfillmentChoiceValue = (orderFulfillmentChoice == '' || orderFulfillmentChoice == null) ? fallbackValue : orderFulfillmentChoice;
                    nlapiSetCurrentLineItemValue(machineName, itemFulfillmentChoiceField, newLineFulfillmentChoiceValue, true);
                }
            } else {
                nlapiSetCurrentLineItemValue(machineName, itemFulfillmentChoiceField, '', true);
            }
        };

        var setExcludeFromRateRequest = function(itemFulfillmentChoiceField, excludeFromRateRequestField) {
            var doNotApplyShipping = isExcludeFromRateRequestForced(itemFulfillmentChoiceField);

            nlapiSetCurrentLineItemValue(machineName, excludeFromRateRequestField, (doNotApplyShipping ? 'T' : 'F'));
            enableDisableExcludeRateRequestField(itemFulfillmentChoiceField, excludeFromRateRequestField);
        };

        var enableDisableExcludeRateRequestField = function(itemFulfillmentChoiceField, excludeFromRateRequestField) {
            if (!isExcludeFromRateRequestDisabledInCurrentLine()) {
                setItemMachDisabled(excludeFromRateRequestField, isExcludeFromRateRequestForced(itemFulfillmentChoiceField));
            }
        };

        var forceExcludeFromRateRequestWhenStorePickUp = function(itemFulfillmentChoiceField, excludeFromRateRequestField) {
            if (isExcludeFromRateRequestForced(itemFulfillmentChoiceField) && nlapiGetCurrentLineItemValue(machineName, excludeFromRateRequestField) == 'F') {
                nlapiSetCurrentLineItemValue(machineName, excludeFromRateRequestField, 'T');
            }
        };

        var isExcludeFromRateRequestForced = function(itemFulfillmentChoiceField) {
            var itemType = nlapiGetCurrentLineItemValue(machineName, 'itemtype');
            return (nlapiGetCurrentLineItemValue(machineName, itemFulfillmentChoiceField) == storePickUpFulfillmentChoiceId) &&
                (itemType != 'Group');
        };

        var emptyItemMachLocationPrevValue = function() {
            itemMachLocationPrevValue = '';
        };

        //Triggers when fulfillmentchoice changes, storing location current value before refreshed by slaving
        var saveItemMachLocationPrevValue = function() {
            if (itemMachLocationPrevValue == '')
                itemMachLocationPrevValue = nlapiGetCurrentLineItemValue(machineName, fulfillmentLocationField);
        };

        //Triggers as it's a slave of fulfillmentchoice, restoring to its previous value (before is refreshed by slaving)
        var restoreItemMachLocationPrevValue = function() {
            if (itemMachLocationPrevValue != '') {
                try {
                    nlapiSetCurrentLineItemValue(machineName, fulfillmentLocationField, itemMachLocationPrevValue, nlapiGetCurrentLineItemValue(machineName, fulfillmentLocationField) != itemMachLocationPrevValue, true);
                } catch (e) {
                    // If fulfillmentchoice is storepickup and previous location does not allow store pickup INVALID_KEY_OR_REF exception is thrown.
                    // We catch the exception but location field will stay empty if no new value is set to it in the request.
                    // Which would cause an exception further in the save function (all lines for store pickup must have a location).
                    if ((typeof e.code == 'undefined') || (e.code != 'INVALID_KEY_OR_REF')) throw e;
                }
                emptyItemMachLocationPrevValue();
            }
        };

        // Triggered when Fulfillment Choice (order level) changes, storing the Location (order level) current value before refreshed by slaving
        var saveLocationPrevValue = function(locationField) {
            locationPrevValue = nlapiGetFieldValue(locationField);
        };

        // Triggered after the slaving of the Location (order level) field, restoring to its previous value (before is refreshed by slaving)
        var restoreLocationPrevValue = function(locationField) {
            if (locationPrevValue)
                nlapiSetFieldValue(locationField, locationPrevValue, true);
        };

        var allSpfLinesHaveLocationSet = function() {
            var fulfillmentLocationField = om.salesorder.staticcontent.fulfillmentLocationField;
            var count = nlapiGetLineItemCount(machineName);
            for (var i = 1; i <= count; i++) {
                // If location is shown, is a fulfillable line and spf then we must have a value in the location select
                if (nlapiGetLineItemField(machineName, fulfillmentLocationField, i) &&
                    nlapiGetLineItemValue(machineName, itemFulfillmentChoiceField, i) == storePickUpFulfillmentChoiceId &&
                    isFulfillableLine(i) &&
                    !nlapiGetLineItemValue(machineName, fulfillmentLocationField, i)) {
                    return false;
                }
            }
            return true;
        };

        //Triggered after bulk inserting items for item group
        var setExcludeFromRateRequestMultiple = function(groupstart, groupend) {
            for (var i = groupstart; i < groupend; i++) {
                var fulfillmentChoice = nlapiGetLineItemValue(machineName, itemFulfillmentChoiceField, i);
                var doNotApplyShipping = (fulfillmentChoice == storePickUpFulfillmentChoiceId);
                setEncodedValue(machineName, i, fieldExcludeFromRateRequest, doNotApplyShipping ? 'T' : 'F');
                setItemMachDisabled(fieldExcludeFromRateRequest, doNotApplyShipping);
            }
        }

        var getStorePickUpLocation = function(linenum) {
            if (hasEncodedField(machineName, itemFulfillmentChoiceField)) {
                var fulfillmentChoice = nlapiGetLineItemValue(machineName, itemFulfillmentChoiceField, linenum);

                if (fulfillmentChoice == storePickUpFulfillmentChoiceId) {
                    return nlapiGetLineItemValue(machineName, fulfillmentLocationField, linenum);
                }
            }

            return null;
        };

        return {
            canHaveFulfillmentChoice: canHaveFulfillmentChoice,
            shouldHaveFulfillmentChoice: shouldHaveFulfillmentChoice,
            setFulfillmentChoiceInItemMachine: setFulfillmentChoiceInItemMachine,
            setFulfillmentChoiceInSalesOrder: setFulfillmentChoiceInSalesOrder,
            enableDisableFulfillmentChoiceField: enableDisableFulfillmentChoiceField,
            setDefaultFulfillmentChoice: setDefaultFulfillmentChoice,
            setExcludeFromRateRequest: setExcludeFromRateRequest,
            enableDisableExcludeRateRequestField: enableDisableExcludeRateRequestField,
            forceExcludeFromRateRequestWhenStorePickUp: forceExcludeFromRateRequestWhenStorePickUp,
            saveItemMachLocationPrevValue: saveItemMachLocationPrevValue,
            restoreItemMachLocationPrevValue: restoreItemMachLocationPrevValue,
            saveLocationPrevValue: saveLocationPrevValue,
            restoreLocationPrevValue: restoreLocationPrevValue,
            setAllowFulfillmentChoiceRecalcInSalesOrder: function(val) { allowFulfillmentChoiceRecalcInSalesOrder = val; },
            getAllowFulfillmentChoiceRecalcInSalesOrder: function() { return allowFulfillmentChoiceRecalcInSalesOrder; },
            isFulfillableLine: isFulfillableLine,
            allSpfLinesHaveLocationSet: allSpfLinesHaveLocationSet,
            setExcludeFromRateRequestMultiple: setExcludeFromRateRequestMultiple,
            getStorePickUpLocation: getStorePickUpLocation
        }
    })();

    function workOrder_LineInit() {
        Item_Machine_synclinefields();
        workOrderConnector.initItemLine();
    }

    function workOrder_PostDeleteLine(line, origLineData) {
        Item_Machine_postDeleteLine(line, origLineData)
        workOrderConnector.postDeleteLine(line, origLineData);
    }

    function isNewLine(line) {
        var val = getEncodedItemValue(line, 'line');
        return val == '-1' || isValEmpty(val);
    }

    var workOrderConnector = (function() {
        var isInternalExecution = false;
        var addChildOf = null;
        var isExistingRecord = false;
        var originalLineData = {};
        var fieldNamesToSave = ['itemtype', 'item', 'itemsource', 'quantity', 'bomquantity', 'assemblylevel'];

        function initialize() {
            if (initialize.initialized)
                return;
            initialize.initialized = true;
            isExistingRecord = !isValEmpty(nlapiGetRecordId());
            var orderStatus = getOrderStatus();

            if (hasLegacyMachine()) {
                NS.event.bind(NS.event.type.ROW_UPDATE_BUTTONS, function(event, data) {
                    if (data.machineName != 'item')
                        return;

                    var isInsertOrCopy = item_machine.isinserting || data.isCopyPrevious;
                    var isNotPhantomAssembly = nlapiGetCurrentLineItemValue('item', 'itemtype') != 'Assembly' ||
                        getEncodedItemValue(nlapiGetCurrentLineItemIndex('item'), 'itemsource') != 'PHANTOM';
                    var disableAddChildButton = isInsertOrCopy ||
                        isNotPhantomAssembly ||
                        isOrderFinished();
                    disableButton('item_addchild', disableAddChildButton);
                });
            }
        }


        function handleItemSourceChange(lineId, itemHasChanged, origLineData) {
            if (getEncodedItemValue(lineId, 'itemtype') != 'Assembly' || (parseFloatOrZero(getEncodedItemValue(lineId, 'quantityfulfilled')) > 0))
                return false;

            var itemId = getEncodedItemValue(lineId, 'item');
            var itemSource = getEncodedItemValue(lineId, 'itemsource');
            var initItemSource = getOrigLineData(origLineData, 'itemsource');
            var isNewLine = isValEmpty(getOrigLineData(origLineData, 'item'));



            if (itemSource == 'PHANTOM' && (itemHasChanged || initItemSource != 'PHANTOM')) {
                setInventoryNumbersFieldsDisabled(true, lineId);


                var params = createParameterMap({ item: itemId });

                var rawData = nlapiServerCall('/app/accounting/transactions/manufacturing/assemblycomponents.nl', 'get', [params]);
                var data = JSON.parse(rawData);

                if (insertDataAfter(data.components, lineId, isNewLine, params.fieldNames !== undefined) > 0) {
                    if (typeof handleAssemblyExpand != "undefined")
                        handleAssemblyExpand(lineId);
                    return true;
                }
            } else if (itemSource != 'PHANTOM') {
                if (nlapiGetFieldValue('expandassembly') == 'T') {
                    nlapiSetFieldValue('expandassembly', 'F');
                }
                if (initItemSource == 'PHANTOM') // for new lines initItemSource is not set
                {
                    setInventoryNumbersFieldsDisabled(false, lineId);
                    return collapseAssembly(lineId);
                }
            }
            return false;
        }

        function handleLineQuantityChange(lineId, origLineData) {
            var quantityField = (nlapiGetFieldValue('usecomponentyield') == 'T' ? 'bomquantity' : 'quantity');
            var origQuantity = parseFloat(getOrigLineData(origLineData, quantityField));
            var quantity = parseFloat(getEncodedItemValue(lineId, quantityField));
            if (origQuantity == quantity || getEncodedItemValue(lineId, 'itemtype') != 'Assembly')
                return false;
            recomputeQuantity(lineId, false);

            return true;
        }

        function recomputeQuantity(lineId, haveComponentsChanged) {

            function getOriginalLineQuantity(line, useComponentYield) {
                var origLineQty = getEncodedItemFloat(line, 'origassemblyqty');
                return useComponentYield ? ifNaNThen(getEncodedItemFloat(line, 'origassemblybomqty'), origLineQty) : origLineQty;
            }


            var useComponentYield = nlapiGetFieldValue('usecomponentyield') == 'T';
            var quantityField = (useComponentYield ? 'bomquantity' : 'quantity');

            var defaultYield = haveComponentsChanged ? nvl(getEncodedItemFloat(lineId, 'componentyield'), 100) : 100;
            var assemblyLevel = getAssemblyLevel(lineId);
            var quantity = getEncodedItemFloat(lineId, quantityField);
            var origQuantityRatio = quantity / getOriginalLineQuantity(lineId, useComponentYield);
            origQuantityRatio = isFinite(origQuantityRatio) ? origQuantityRatio : 1;
            var qtyMultiplier = {};

            qtyMultiplier[assemblyLevel] = quantity;
            for (var i = lineId + 1, count = nlapiGetLineItemCount('item'); i <= count; i++) {
                var currentLevel = getAssemblyLevel(i);
                if (currentLevel <= assemblyLevel)
                    break;
                var origLineQuantity = getOriginalLineQuantity(i, useComponentYield);
                var multiplier = (!isExistingRecord || haveComponentsChanged || isNewLine(i) ? qtyMultiplier[currentLevel - 1] : origQuantityRatio);
                var newQuantity = origLineQuantity * multiplier;
                var lineYield = getEncodedItemFloat(i, 'componentyield');
                setEncodedItemValue(i, quantityField, newQuantity);
                if (useComponentYield) {
                    if (!lineYield) {
                        lineYield = defaultYield;
                        setEncodedItemValue(i, 'componentyield', format_percent(lineYield));
                    }
                    var roundUpAsComponent = getEncodedItemValue(i, 'roundupascomponent') == 'T';
                    setEncodedItemValue(i, 'quantity', calculateQuantityWithComponentYield(newQuantity, lineYield, roundUpAsComponent));
                } else {
                    if (lineYield)
                        setEncodedItemValue(i, 'componentyield', '');
                    if (getEncodedItemValue(i, 'bomquantity'))
                        setEncodedItemValue(i, 'bomquantity', '');
                }

                if (getEncodedItemValue(i, 'itemtype') == 'Assembly')
                    qtyMultiplier[currentLevel] = newQuantity;
            }
        }

        function postDeleteLine(line, origLineData) {
            if (getOrigLineData(origLineData, 'itemtype') == 'Assembly') {
                var deletedAssemblyLevel = parseInt(getOrigLineData(origLineData, 'assemblylevel'));
                var toLine = null;
                for (var i = line, count = nlapiGetLineItemCount('item'); i <= count; i++) {
                    var assemblyLevel = getAssemblyLevel(i);
                    if (assemblyLevel <= deletedAssemblyLevel)
                        break;
                    toLine = i;
                }
                if (toLine !== null) {
                    Machine_deleteLineItems('item', line - 1, toLine);
                    if (hasLegacyMachine()) {
                        item_machine.setupLineData(line);
                        item_machine.buildtable();
                    }
                }
            }
        }

        function getOrigLineData(origLineData, fieldName) {

            if (!hasLegacyMachine())
                return originalLineData[fieldName];

            return origLineData ? item_machine.getLineFieldValue(origLineData, fieldName) : null;
        }

        function postProcessLine(lineId, origLineData) {
            if (isInternalExecution || isOrderFinished())
                return;

            var itemId = getEncodedItemValue(lineId, 'item');
            var initItemId = getOrigLineData(origLineData, 'item');
            var rebuildTable = false;

            // be carefull when you will try to remove "isValEmpty(getEncodedValue('item', lineId, 'assemblylevel'))" see issue: 410078
            if (itemId != initItemId && getOrigLineData(origLineData, 'itemtype') == 'Assembly' && !isValEmpty(getEncodedValue('item', lineId, 'assemblylevel'))) {
                rebuildTable = collapseAssembly(lineId);
            }

            rebuildTable = setupAssemblyLevel(lineId) || rebuildTable;

            isInternalExecution = true;
            var componentsHaveChanged = handleItemSourceChange(lineId, itemId != initItemId, origLineData);
            rebuildTable = componentsHaveChanged || rebuildTable;
            if (componentsHaveChanged)
                recomputeQuantity(lineId, true);
            else
                rebuildTable = handleLineQuantityChange(lineId, origLineData) || rebuildTable;
            isInternalExecution = false;
            if (rebuildTable) {
                Item_Machine_Recalc();
                if (hasLegacyMachine()) {
                    item_machine.buildtable();
                    selectNextLine(lineId);
                }
            }
        }

        function selectNextLine(lineId) {
            var currentIndex = nlapiGetCurrentLineItemIndex('item');
            if (currentIndex <= nlapiGetLineItemCount('item')) {
                item_machine.loadline(currentIndex);
            } else if (lineId + 1 <= nlapiGetLineItemCount('item')) {
                nlapiSelectLineItem('item', lineId + 1);
            }
        }

        function setupAssemblyLevel(lineId) {
            if (getAssemblyLevel(lineId))
                return false;
            var targetAssemblyLevel = lineId < nlapiGetLineItemCount('item') ?
                ifNaNThen(getAssemblyLevel(lineId + 1), 1) :
                1;
            setEncodedItemValue(lineId, 'assemblylevel', targetAssemblyLevel);
            setEncodedItemValue(lineId, 'indentlevel', targetAssemblyLevel - 1);
            return true;
        }

        function collapseAssembly(lineId) {
            if (typeof handleAssemblyCollapse != "undefined")
                handleAssemblyCollapse(lineId);
            return deleteChildrenOf(lineId);
        }

        function getLastChildOf(lineId) {
            var r = 0;
            var assemblyLevel = getAssemblyLevel(lineId);
            for (var i = lineId + 1, count = nlapiGetLineItemCount('item'); i <= count; i++) {
                var currentLevel = getAssemblyLevel(i);
                if (currentLevel <= assemblyLevel)
                    break;
                r = i;
            }
            return r;
        }

        function deleteChildrenOf(lineId) {
            var lastChild = getLastChildOf(lineId);
            if (lastChild > 0) {
                Machine_deleteLineItems('item', lineId, lastChild);
                return true;
            }
            return false;
        }

        function insertDataAfter(data, lineId, isNewLine, isRawData) {
            if (isValEmpty(data) || isValEmpty(lineId))
                return 0;
            var targetAssemblyLevel = ifNaNThen(getAssemblyLevel(isNewLine ? lineId + 1 : lineId), 1);
            var numOfAddedRows = 0;
            if (isRawData) {
                item_machine.insertdata(data, lineId + 1);
                numOfAddedRows = splitIntoRows(data).length;
            } else {
                numOfAddedRows = insertDataFromMap(data, lineId);
            }
            if (numOfAddedRows > 0) {
                increaseIndentation(lineId + 1, lineId + numOfAddedRows, targetAssemblyLevel);
            }
            return numOfAddedRows;
        }

        function insertDataFromMap(data, lineId) {
            var lastIndex = data.length - 1;
            for (var i = lastIndex; i >= 0; i--) {

                if (i == lastIndex && lineId == nlapiGetLineItemCount('item'))
                    nlapiSelectNewLineItem('item');
                else
                    nlapiInsertLineItem('item', lineId + 1);
                var rowData = data[i];
                for (var k in rowData) {
                    if (rowData.hasOwnProperty(k))
                        nlapiSetCurrentLineItemValue('item', k, rowData[k], false, false);
                }
                nlapiCommitLineItem('item');
            }
            return data.length;
        }

        function increaseIndentation(fromLine, toLine, increase) {
            increase = ifNaNThen(increase, 1);
            for (var i = fromLine; i <= toLine; i++) {
                var asmLevel = ifNaNThen(getAssemblyLevel(i), 1);
                setEncodedItemValue(i, 'indentlevel', asmLevel - 1 + increase);
                setEncodedItemValue(i, 'assemblylevel', asmLevel + increase);
            }
        }

        function addChildComponent() {
            if (!hasLegacyMachine() || isOrderFinished())
                return;
            // this check is here, because user could change item source on active line and THEN click on Add Child without committing the line first
            if (getItemMachValue('itemsource') == 'PHANTOM') {
                addChildOf = item_machine.getMachineIndex();
                item_machine.setMachineIndex(addChildOf + 1);
                item_machine.insertline();
            }
        }

        function markAllPhantom() {
            if (nlapiGetFieldValue('expandassembly') != 'T')
                return;

            // if customer has some active row we must process it separately and commit it before main loop
            if (nlapiGetCurrentLineItemValue('item', 'item')) //if there is allready selected item we try to save current row
            {
                var currentLineItemIndex = nlapiGetCurrentLineItemIndex('item');
                var currentItemSource = nlapiGetCurrentLineItemValue('item', 'itemsource');
                if (nlapiGetCurrentLineItemValue('item', 'itemtype') == 'Assembly' && currentItemSource != 'PHANTOM') {
                    nlapiSetCurrentLineItemValue('item', 'itemsource', 'PHANTOM', true, true);
                    setInventoryNumbersFieldsDisabled(true);
                    nlapiCommitLineItem('item');

                    // dirty hack, which check if commit was sucesfull, for example if all mandatory fields are set. there is no easy way how to validate that.
                    // on succes commit currentLine is moved to next line so we check that we have moved => we have sucessfull commit.
                    if (nlapiGetCurrentLineItemIndex('item') == currentLineItemIndex) {
                        // commit was unsuccesfull
                        nlapiSetFieldValue('expandassembly', 'F');
                        setInventoryNumbersFieldsDisabled(false);
                        nlapiSetCurrentLineItemValue('item', 'itemsource', currentItemSource, true, true);
                        return;
                    }
                }
            }
            isInternalExecution = true;

            var items = [];


            var lineIds = [];
            for (var i = 1, count = nlapiGetLineItemCount('item'); i <= count; i++) {
                if (getEncodedItemValue(i, 'itemtype') == 'Assembly' && getEncodedItemValue(i, 'itemsource') != 'PHANTOM' && (parseFloatOrZero(getEncodedItemValue(i, 'quantityfulfilled')) == 0)) {
                    items.push(getEncodedItemValue(i, 'item'));



                    lineIds.push(i);
                    nlapiSelectLineItem('item', i);
                    nlapiSetCurrentLineItemValue('item', 'itemsource', 'PHANTOM', true, true);
                    setInventoryNumbersFieldsDisabled(true);
                    nlapiCommitLineItem('item');
                }
            }
            if (items.length === 0) {
                isInternalExecution = false;
                return;
            }

            var params = createParameterMap({ items: items, expandassembly: 'T' });

            var rawData = nlapiServerCall('/app/accounting/transactions/manufacturing/assemblycomponents.nl', 'getMulti', [params]);
            var data = JSON.parse(rawData);
            if (data.components.length === lineIds.length) {

                for (i = lineIds.length - 1; i >= 0; i--) {
                    var insertedRows = insertDataAfter(data.components[i], lineIds[i], false, params.fieldNames !== undefined);
                    if (insertedRows > 0) {
                        if (typeof handleAssemblyExpand != "undefined")
                            handleAssemblyExpand(lineIds[i]);
                        recomputeQuantity(lineIds[i], true);
                    }
                }
            }
            nlapiCancelLineItem('item');


            isInternalExecution = false;
            Item_Machine_Recalc();
        }

        function createParameterMap(params) {
            var parameters = {
                trandate: nlapiGetFieldValue('trandate'),
                startdate: nlapiGetFieldValue('startdate'),
                subsidiary: nlapiGetFieldValue('subsidiary'),
                expandassembly: nlapiGetFieldValue('expandassembly'),
                usecomponentyield: nlapiGetFieldValue('usecomponentyield'),
                location: nlapiGetFieldValue('location'),
                cf: nlapiGetFieldValue('customform')
            };
            if (hasLegacyMachine())
                parameters.fieldNames = item_machine.getFormFieldNames();
            if (nlapiGetFieldValue('id') > 0)
                parameters.id = nlapiGetFieldValue('id');
            for (var key in params) {
                if (params.hasOwnProperty(key))
                    parameters[key] = params[key];
            }
            return parameters;
        }

        function initAssemblyLevel() {
            if (addChildOf) {
                if (getEncodedItemValue(addChildOf, 'itemtype') == 'Assembly') {
                    var assemblyLevel = ifNaNThen(getAssemblyLevel(addChildOf), 0);
                    setItemMachValue('assemblylevel', assemblyLevel + 1);
                    setItemMachValue('indentlevel', assemblyLevel);
                }
                addChildOf = null;
            } else if (hasLegacyMachine() && nlapiGetCurrentLineItemIndex('item') > nlapiGetLineItemCount('item') && !isValEmpty(getItemMachValue('assemblylevel'))) {
                setItemMachValue('assemblylevel', 1);
                setItemMachValue('indentlevel', 0);
            }
        }

        function initItemLine() {
            initAssemblyLevel();

            if (hasLegacyMachine() && item_machine.ischanged)
                return;

            for (var i in fieldNamesToSave) {
                if (fieldNamesToSave.hasOwnProperty(i)) {
                    var fieldName = fieldNamesToSave[i];
                    originalLineData[fieldName] = getItemMachValue(fieldName);
                }
            }
        }

        function slaveComponentYieldFields() {
            var useComponentYield = nlapiGetFieldValue('usecomponentyield') == 'T';
            var currentComponentYield = getItemMachValue('componentyield');
            var currentBomQuantity = getItemMachValue('bomquantity');
            if (useComponentYield) {
                if (isValEmpty(currentComponentYield))
                    nlapiSetCurrentLineItemValue('item', 'componentyield', '100', true);
                if (isValEmpty(currentBomQuantity))
                    nlapiSetCurrentLineItemValue('item', 'bomquantity', '1', true);
            } else {
                setItemMachValue('componentyield', '');
                setItemMachValue('bomquantity', '');
            }
        }

        function validateLine() {
            if (isInternalExecution)
                return true;

            var useComponentYield = nlapiGetFieldValue('usecomponentyield');
            if (useComponentYield == 'T' && (isValEmpty(getItemMachValue('componentyield')) || isValEmpty(getItemMachValue('bomquantity')))) {
                alert('Please enter Component Yield and BoM Quantity. on line ' + nlapiGetCurrentLineItemIndex('item'));
                return false;
            }
            return true;
        }


        function isInternal() {
            return isInternalExecution;
        }



        function setInventoryNumbersFieldsDisabled(disable, lineId) {
            if (lineId) {
                nlapiSelectLineItem('item', lineId);
            }
            setItemMachValue('notinvtcommittable', (disable ? 'T' : 'F'));
            if (hasItemMachField('inventorydetail') && getItemMachValue('isnumbered') == 'T') {
                if (disable) {
                    disableInventoryDetailSubrecord();
                    removeMachineSubrecord();
                } else {
                    enableInventoryDetailSubrecord();
                }
            }
            if (hasItemMachField('serialnumbers') && getItemMachValue('isserialorlotitem') == 'T' && disable) {
                setItemMachValue('serialnumbers', '');
            }
            if (lineId) {
                nlapiCommitLineItem('item', lineId);
            }
        }

        function updateItemsStockQuantitiesForLocation() {
            var locationKey = nlapiGetFieldValue('location');
            var itemsCount = nlapiGetLineItemCount('item');
            if (itemsCount > 0) {
                var items = {};
                for (var i = 1; i <= itemsCount; i++) {
                    var itemKey = parseInt(getEncodedItemValue(i, 'item'), 10);
                    var unitKey = parseInt(getEncodedItemValue(i, 'units'), 10);
                    unitKey = isNaN(unitKey) ? null : unitKey;
                    items[itemKey] = unitKey;
                }
                var response = nlapiServerCall('/app/accounting/transactions/manufacturing/workorderformhandler.nl', 'selectMachineValuesForLocation', [items, locationKey]);
                var lines = response.list;
                if (!lines || lines.length === 0) {
                    return;
                }
                nlapiSelectLineItem('item', 1);
                for (var i = 1; i <= itemsCount; i++) {
                    var itemKey = getEncodedItemValue(i, 'item');
                    for (var k = 0; k < lines.length; k++) {
                        if (lines[k].key == itemKey && lines[k].availableQuantity != null && lines[k].onHandQuantity != null) {
                            nlapiSetLineItemValue('item', 'quantityavailable', i, lines[k].availableQuantity);
                            nlapiSetLineItemValue('item', 'quantityonhand', i, lines[k].onHandQuantity);
                            break;
                        }
                    }
                }
                nlapiCancelLineItem('item', -1);
            }
        }

        return {
            addChildComponent: addChildComponent,
            initialize: initialize,
            initItemLine: initItemLine,
            isInternal: isInternal,
            markAllPhantom: markAllPhantom,
            postDeleteLine: postDeleteLine,
            postProcessLine: postProcessLine,
            slaveComponentYieldFields: slaveComponentYieldFields,
            validateLine: validateLine,
            updateItemsStockQuantitiesForLocation: updateItemsStockQuantitiesForLocation
        };
    })();