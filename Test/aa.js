var itemcoupontotal = 0;
var linesToUpdateInitValues = [];

function existLineToUpdateInitValues(a) {
    return linesToUpdateInitValues.indexOf(a) > -1;
}

function addLineToUpdateInitValues(a) {
    if (!existLineToUpdateInitValues(a)) {
        linesToUpdateInitValues.push(a);
    }
}

function removeLineToUpdateInitValues(b) {
    var a = linesToUpdateInitValues.indexOf(b);
    if (existLineToUpdateInitValues(b)) {
        linesToUpdateInitValues.splice(a, 1);
    }
}

function hasLegacyMachine() {
    return nlapiGetContext().getExecutionContext() == "userinterface" && document.forms.item_form;
}

function getItemType() {
    return nlapiGetCurrentLineItemValue("item", "itemtype");
}

function getItemSubType() {
    return nlapiGetCurrentLineItemValue("item", "itemsubtype");
}

function getTransactionType() {
    return nlapiGetFieldValue("type").toLowerCase();
}

function useInventoryLocationForFulfillment() {
    return nlapiGetContext().getFeature("CROSSSUBSIDIARYFULFILLMENT") && (getTransactionType() == "salesord" || getTransactionType() == "rtnauth");
}

function getItemMachDisabled(a) {
    return nlapiGetLineItemDisabled("item", a);
}

function setItemMachDisabled(b, a) {
    if (hasItemMachField(b)) {
        nlapiSetLineItemDisabled("item", b, a);
    }
}

function hasItemMachField(a) {
    return nlapiGetLineItemField("item", a) != null;
}

function getItemMachField(a) {
    return nlapiGetLineItemField("item", a);
}

function getItemMachValue(a) {
    return nlapiGetCurrentLineItemValue("item", a);
}

function setItemMachValue(a, b) {
    return nlapiSetCurrentLineItemValue("item", a, b, false);
}

function getItemMachFloat(a) {
    return parseFloat(nlapiGetCurrentLineItemValue("item", a));
}

function itemMachCurrentLineValueNotEmpty(b) {
    var a = nlapiGetCurrentLineItemValue("item", b);
    return a != null && a.length > 0;
}

function getEncodedItemValue(b, a) {
    return getEncodedValue("item", b, a);
}

function getEncodedItemFloat(b, a) {
    return parseFloat(getEncodedItemValue(b, a));
}

function getEncodedItemInt(b, a) {
    return parseInt(getEncodedItemValue(b, a));
}

function setEncodedItemValue(b, a, c) {
    setEncodedValue("item", b, a, c);
}

function itemHasEncodedField(a) {
    return hasEncodedField("item", a);
}

function hasEncodedItemValue(c, b) {
    var a = getEncodedItemValue(c, b);
    return a != null && a.length > 0;
}
var taxInclusivePricingHelper = {
    fieldNames: {
        rate: "rateincludingtax",
        amount: "grossamt",
        amounthasbeenset: "grossamthasbeenset"
    },
    checkFieldName: function(a) {
        if (!(a in this.fieldNames)) {
            throw "Unknown field '" + a + "' retrieved.";
        }
    },
    getEditableFieldName: function(b) {
        var a = (nlapiGetFieldValue("pricesincludetax") === "T");
        return this.getFieldName(b, a);
    },
    getCalculatedFieldName: function(b) {
        var a = !(nlapiGetFieldValue("pricesincludetax") === "T");
        return this.getFieldName(b, a);
    },
    getFieldName: function(b, a) {
        this.checkFieldName(b);
        return (a ? this.fieldNames[b] : b);
    }
};

function DoProduct(k) {
    var g = taxInclusivePricingHelper.getEditableFieldName("rate");
    var d = taxInclusivePricingHelper.getEditableFieldName("amount");
    var i = nlapiGetLineItemField("item", d) != null ? nlapiGetCurrentLineItemValue("item", d) : "";
    var j = nlapiGetLineItemField("item", "vsoeamount") != null ? nlapiGetCurrentLineItemValue("item", "vsoeamount") : "";
    var a = nlapiGetLineItemField("item", "costestimate") != null ? nlapiGetCurrentLineItemValue("item", "costestimate") : "";
    CheckCount();
    var e = getItemType();
    if (e == "Subtotal") {
        i = "0.00";
        j = "";
        a = "";
    } else {
        if (k != "amount" && (e == "Discount" || e == "Markup")) {
            var h = parseFloat(nlapiGetCurrentLineItemValue("item", g));
            if (nlapiGetCurrentLineItemValue("item", g).indexOf("%") != -1 && nlapiGetCurrentLineItemIndex("item") > 1) {
                var l = nlapiGetCurrentLineItemIndex("item") - 1;
                var f = nlapiGetLineItemValue("item", "amount", l);
                i = format_currency(h * 0.01 * f);
            } else {
                i = shouldCalculateAmount("item") ? format_currency(h) : i;
            }
            j = "";
            a = "";
        } else {
            var m = parseFloat(nlapiGetCurrentLineItemValue("item", "quantity"));
            var c = parseFloat(nlapiGetCurrentLineItemValue("item", g));
            if (isNaN(m)) {
                m = 1;
            }
            if (getTransactionType() == "blankord" && (isNaN(i) || k == "quantity" || k == g || k == null) && (hasItemMachField("quantityordered") && zeroIfNaN("quantityordered") != 0)) {
                var n = parseFloat(getItemMachValue("quantityordered"));
                var b = zeroIfNaN("amountordered");
                i = format_currency((m - n) * c + b);
            } else {
                if (k != "amount" && ((hasItemMachField("costestimaterate") && k != "costestimaterate") || !hasItemMachField("costestimaterate")) && (isNaN(i) || k == "quantity" || k == g || k == null)) {
                    i = shouldCalculateAmount("item") ? ((isNaN(m) || isNaN(c)) ? "" : format_currency(m * c)) : i;
                }
                if (k != "amount" && k != "costestimaterate" && hasItemMachField("vsoeamount") && hasItemMachField("vsoeprice") && k != "vsoeamount" && (isNaN(getItemMachValue("vsoeamount")) || k == "quantity" || k == "vsoeprice" || k == null)) {
                    j = shouldCalculateVSOEAmount() ? (isNaN(m) || isNaN(getItemMachValue("vsoeprice")) || getItemMachValue("vsoeprice") == "") ? "" : format_currency(m * getItemMachValue("vsoeprice")) : j;
                }
                if (k != "amount" && k != "vsoeprice" && hasItemMachField("costestimate") && hasItemMachField("costestimaterate") && (isNaN(getItemMachValue("costestimate")) || k == "quantity" || k == "costestimaterate" || k == null)) {
                    a = shouldCalculateCostEstimate() ? (isNaN(m) || isNaN(getItemMachValue("costestimaterate")) || getItemMachValue("costestimaterate") == "") ? "" : format_currency(m * getItemMachValue("costestimaterate")) : a;
                }
            }
        }
    }
    if (hasItemMachField(d)) {
        setItemMachValue(d, i);
    }
    if (hasItemMachField("vsoeamount")) {
        setItemMachValue("vsoeamount", j);
    }
    if (hasItemMachField("costestimate")) {
        setItemMachValue("costestimate", a);
    }
    if (k != null && !isNaN(parseFloat(nlapiGetCurrentLineItemValue("item", "taxrate1")))) {
        syncVatLine(k, "item");
    }
    syncAnnualRev(k);
}

function zeroIfNaN(b) {
    var a = parseFloat(getItemMachValue(b));
    if (isNaN(a)) {
        a = 0;
    }
    return a;
}

function ifNaNThen(b, a) {
    return isNaN(b) ? a : b;
}

function syncPctQty() {
    var a = nlapiGetLineItemField("item", "quantityordered") != null ? nlapiGetCurrentLineItemValue("item", "quantityordered") : "";
    var c = nlapiGetCurrentLineItemValue("item", "currentpercent");
    var b = false;
    if (c.length == 0) {
        nlapiSetCurrentLineItemValue("item", "quantity", "", false);
    } else {
        if (a.length > 0) {
            nlapiSetCurrentLineItemValue("item", "quantity", parseFloat(c) / 100 * parseFloat(a), false);
            b = true;
        } else {
            alert("There is no order quantity for this line");
            nlapiSetCurrentLineItemValue("item", "currentpercent", "", false);
        }
    }
    DoProduct();
    if (nlapiGetLineItemField("item", "amountordered") != null && b) {
        nlapiSetCurrentLineItemValue("item", "amount", format_currency(parseFloat(c) / 100 * parseFloat(nlapiGetCurrentLineItemValue("item", "amountordered"))), false);
    }
}

function syncQty() {
    var a = nlapiGetCurrentLineItemValue("item", "quantityordered");
    var b = nlapiGetCurrentLineItemValue("item", "quantity");
    if (b.length == 0 || parseFloat(a) == 0) {
        nlapiSetCurrentLineItemValue("item", "currentpercent", "", false);
    } else {
        if (a.length > 0) {
            nlapiSetCurrentLineItemValue("item", "currentpercent", parseFloat(b) / parseFloat(a) * 100, false);
        }
    }
}

function getOnHandWarningMessage(e, d, a, h, c, g, b, f) {
    if (a == "Kit") {
        if (e > 0) {
            return "" + h + ": You only have parts for this number of kits available for commitment at this location: " + c + "" + g + ".";
        }
        if (d == true) {
            return "" + h + ": You only have parts for this number of kits available for commitment across all locations: " + c + "" + g + ".";
        }
        return "" + h + ": You only have parts for this number of kits available for commitment: " + c + "" + g + ".";
    }
    if (e > 0) {
        return "" + h + ": You have only " + c + "" + g + " available for commitment at this location (" + b + " back ordered, " + f + " on order).";
    }
    if (d == true) {
        return "" + h + ": You have only " + c + "" + g + " available for commitment across all locations (" + b + " back ordered, " + f + " on order).";
    }
    return "" + h + ": You have only " + c + "" + g + " available for commitment, (" + b + " back ordered, " + f + " on order).";
}

function getReorderWarningMessage(e, d, a, h, b, g, c, f) {
    if (a == "Assembly") {
        if (e > 0) {
            return "" + h + ": Time to build. This transaction will leave you with " + b + "" + g + " available at this location with a build point of " + c + "" + g + " and " + f + " on order.";
        }
        if (d == true) {
            return "" + h + ": Time to build. This transaction will leave you with " + b + "" + g + " available across all locations with a build point of " + c + "" + g + " and " + f + " on order.";
        }
        return "" + h + ": Time to build. This transaction will leave you with " + b + "" + g + " available with a build point of " + c + "" + g + " and " + f + " on order.";
    }
    if (e > 0) {
        return "" + h + ": Time to reorder. This transaction will leave you with " + b + "" + g + " available at this location with a reorder point of " + c + "" + g + " and " + f + " on order.";
    }
    if (d == true) {
        return "" + h + ": Time to reorder. This transaction will leave you with " + b + "" + g + " available across all locations with a reorder point of " + c + "" + g + " and " + f + " on order.";
    }
    return "" + h + ": Time to reorder. This transaction will leave you with " + b + "" + g + " available with a reorder point of " + c + "" + g + " and " + f + " on order.";
}

function getShowedWarningId(c, a, b) {
    return c + "_%_" + a + b;
}
var showedReorderWarning = {};
var showedOnHandWarning = {};

function CheckStockAmounts(c, k, j, b, d, e, l, a, g, f, m) {
    if ((l != "InvtPart" && l != "Assembly" && l != "Kit") || (f == "DropShip" || f == "SpecOrd") || m == "T") {
        return;
    }
    var i = 0;
    if (a == true) {
        i = useInventoryLocationForFulfillment() ? (nlapiGetLineItemField("item", "inventorylocation") != null ? nlapiGetCurrentLineItemValue("item", "inventorylocation") : "") : (nlapiGetLineItemField("item", "location") != null ? nlapiGetCurrentLineItemValue("item", "location") : (nlapiGetField("location") ? nlapiGetFieldValue("location") : ""));
        if (i == "" || i == "undefined") {
            i = 0;
        }
    }
    if (isNaN(k)) {
        return;
    }
    if (isNaN(j)) {
        j = 0;
    }
    var h = getShowedWarningId(c, i, g);
    if (j < k && showedOnHandWarning[h] == null) {
        showedOnHandWarning[h] = "true";
        alert(getOnHandWarningMessage(i, a, l, c, j, g, e, d));
    } else {
        if (l != "Kit" && !isNaN(b) && j - k <= b && showedReorderWarning[h] == null && showedOnHandWarning[h] == null) {
            showedReorderWarning[h] = "true";
            alert(getReorderWarningMessage(i, a, l, c, j - k, g, b, d));
        }
    }
}

function CheckStock(d) {
    var a = getItemType();
    if (a == "InvtPart" || a == "Assembly" || a == "Kit") {
        if (nlapiGetLineItemField("item", "quantityavailable") == null || nlapiGetCurrentLineItemValue("item", "quantityavailable") == "") {
            return;
        }
        if (nlapiGetLineItemField("item", "matrixtype") != null && nlapiGetCurrentLineItemValue("item", "matrixtype") == "PARENT") {
            return;
        }
        var b = nlapiGetCurrentLineItemText("item", "item");
        var f = "";
        if (nlapiGetLineItemField("item", "units_display") != null) {
            f = (nlapiGetCurrentLineItemValue("item", "units_display").length > 0) ? (" " + nlapiGetCurrentLineItemValue("item", "units_display")) : "";
        }
        var c = (nlapiGetLineItemField("item", "createpo") != null ? nlapiGetCurrentLineItemValue("item", "createpo") : "");
        var e = (nlapiGetLineItemField("item", "createwo") != null ? nlapiGetCurrentLineItemValue("item", "createwo") : "F");
        CheckStockAmounts(b, parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")), parseFloat(nlapiGetCurrentLineItemValue("item", "quantityavailable")), parseFloat(nlapiGetCurrentLineItemValue("item", "reorder")), parseFloat(nlapiGetCurrentLineItemValue("item", "onorder")), parseFloat(nlapiGetCurrentLineItemValue("item", "backordered")), a, d, f, c, e);
    }
}

function CheckDistrib() {
    var a = getItemType();
    if (a == "InvtPart" || a == "Assembly") {
        if (nlapiGetCurrentLineItemValue("item", "ddistrib") == null || nlapiGetCurrentLineItemValue("item", "ddistrib") == "") {
            alert("The item you selected has not been distributed as of the date of this transaction. Consequently any location associated with the item will be erased when the transaction is saved.");
        }
    }
}

function CheckRate(b) {
    var a = getItemType();
    if ((a == "Group" || a == "Subtotal" || a == "Description") && nlapiGetCurrentLineItemValue("item", b).length > 0) {
        alert("Rate not allowed for this item.");
        nlapiSetCurrentLineItemValue("item", b, "", false);
    }
}

function SyncQtyRate() {
    if (!(hasItemMachField("rateschedule") && hasItemMachField("quantity"))) {
        return;
    }
    if (itemMachCurrentLineValueNotEmpty("orderdoc") || itemMachCurrentLineValueNotEmpty("srcline")) {
        return;
    }
    var i = getItemMachFloat("quantity");
    if (itemMachCurrentLineValueNotEmpty("oqpbucket")) {
        var g = getItemMachValue("oqpbucket");
        var b = nlapiGetLineItemCount("item");
        var f = nlapiGetCurrentLineItemIndex("item");
        for (var d = 1; d <= b; d++) {
            var k = getEncodedItemFloat(d, "quantity");
            if (d != f && getEncodedItemValue(d, "oqpbucket") == g && k > 0) {
                i += k;
            }
        }
    }
    var a = hasItemMachField("price") && getItemMachFloat("price") == -1;
    if (itemMachCurrentLineValueNotEmpty("rateschedule") && !isNaN(i) && !a) {
        var h = getItemMachValue("rateschedule");
        var c = "T" == getItemMachValue("marginal");
        var e = taxInclusivePricingHelper.getEditableFieldName("rate");
        nlapiSetCurrentLineItemValue("item", e, format_rate(round_float(getQtyRate(h, i, c))), true);
    }
}

function SyncQtyPurchRate() {
    if (!(nlapiGetLineItemField("item", "poratesched") != null && nlapiGetLineItemField("item", "quantity") != null)) {
        return;
    }
    var g = nlapiGetCurrentLineItemValue("item", "poratesched");
    var k = parseFloat(nlapiGetCurrentLineItemValue("item", "quantity"));
    var b = "T" == nlapiGetCurrentLineItemValue("item", "pomarginal");
    var h = nlapiGetCurrentLineItemValue("item", "pooverallqtydisc");
    if (h.length > 0) {
        var a = nlapiGetLineItemCount("item");
        var e = nlapiGetCurrentLineItemIndex("item");
        var i = parseInt(nlapiGetCurrentLineItemValue("item", "povendor"));
        var f = parseInt(nlapiGetCurrentLineItemValue("item", "poqtygroup"));
        var d = nlapiGetCurrentLineItemValue("item", "createpo");
        if (i > 0) {
            for (var c = 1; c <= a; c++) {
                if (c != e && getEncodedValue("item", c, "pooverallqtydisc") == h && parseInt(getEncodedValue("item", c, "poqtygroup")) == f && parseInt(getEncodedValue("item", c, "povendor")) == i && ((getEncodedValue("item", c, "createpo").length == 0 && d.length == 0) || getEncodedValue("item", c, "createpo") == d) && parseFloat(getEncodedValue("item", c, "quantity")) > 0) {
                    k += parseFloat(getEncodedValue("item", c, "quantity"));
                }
            }
        }
    }
    if (g.length > 0 && !isNaN(k)) {
        nlapiSetCurrentLineItemValue("item", "porate", format_currency(round_float(getQtyRate(g, k, b)), true));
    }
}

function CheckAmount() {
    var a = getItemType();
    if (a == "Payment") {
        nlapiSetCurrentLineItemValue("item", "amount", format_currency(-Math.abs(parseFloat(nlapiGetCurrentLineItemValue("item", "amount")))), false);
    } else {
        if ((a == "Group" || a == "Subtotal" || a == "Description") && nlapiGetCurrentLineItemValue("item", "amount").length > 0) {
            alert("Amount not allowed for this item.");
            nlapiSetCurrentLineItemValue("item", "amount", "", false);
        }
    }
}

function CheckBillingSchedule() {
    var a = getItemType();
    if (!billingScheduleIsAllowedForItemType(a) && nlapiGetCurrentLineItemValue("item", "billingschedule").length > 0) {
        alert("Billing Schedule not allowed for this item.");
        nlapiSetCurrentLineItemValue("item", "billingschedule", "", false);
    }
}

function billingScheduleIsAllowedForItemType(a) {
    return !(a == "Group" || a == "Subtotal" || a == "Description" || a == "Discount" || a == "Markup" || a == "Payment");
}

function CheckCount() {
    var a = getItemType();
    if ((a == "InvtPart" || a == "Assembly") && nlapiGetCurrentLineItemValue("item", "quantity").length > 0 && parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) < 0) {
        if (a == "InvtPart") {
            alert("Inventory items must have a positive quantity.");
        } else {
            alert("Assemblies must have a positive quantity.");
        }
        nlapiSetCurrentLineItemValue("item", "quantity", "", false);
        return false;
    }
    if (getTransactionType() == "trnfrord" && nlapiGetCurrentLineItemValue("item", "quantity").length > 0 && parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) <= 0) {
        alert("Transfer Order items must have a positive count.");
        nlapiSetCurrentLineItemValue("item", "quantity", "", false);
        return false;
    }
    if (getTransactionType() == "purchreq" && (a == "InvtPart" || a == "Assembly")) {
        if (nlapiGetLineItemField("item", "estimatedamount") != null && nlapiGetCurrentLineItemValue("item", "estimatedamount").length > 0 && parseFloat(nlapiGetCurrentLineItemValue("item", "estimatedamount")) < 0) {
            if (a == "InvtPart") {
                alert("Inventory items must have a positive amount.");
            } else {
                alert("Assemblies must have a positive amount.");
            }
            nlapiSetCurrentLineItemValue("item", "estimatedamount", "", false);
            return false;
        }
    }
    var b = nlapiGetField("checkcommitted") != null && nlapiGetFieldValue("checkcommitted") == "T";
    if (b && (a == "InvtPart" || a == "Assembly") && nlapiGetCurrentLineItemValue("item", "quantity").length > 0 && parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) > parseFloat(nlapiGetCurrentLineItemValue("item", "quantitycommitted"))) {
        alert("You cannot fulfill more than the committed quantity.");
        nlapiSetCurrentLineItemValue("item", "quantity", nlapiGetCurrentLineItemValue("item", "quantitycommitted"), false);
        return false;
    }
    if ((a == "InvtPart" || a == "Assembly") && nlapiGetLineItemField("item", "amount") != null && nlapiGetCurrentLineItemValue("item", "amount").length > 0 && parseFloat(nlapiGetCurrentLineItemValue("item", "amount")) < 0) {
        if (a == "InvtPart") {
            alert("Inventory items must have a positive amount.");
        } else {
            alert("Assemblies must have a positive amount.");
        }
        nlapiSetCurrentLineItemValue("item", "amount", "", false);
        return false;
    } else {
        if (a == "GiftCert") {
            if (nlapiGetCurrentLineItemValue("item", "quantity").length == 0) {
                nlapiSetCurrentLineItemValue("item", "quantity", "1", false);
            } else {
                if (parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) != 1) {
                    alert("Gift Certificate quantity must equal 1");
                    nlapiSetCurrentLineItemValue("item", "quantity", "1", false);
                    return false;
                }
            }
        } else {
            if (!(a == "EndGroup" || a == "Payment" || a == "Subtotal" || a == "Discount" || a == "Markup" || a == "Description" || a.length == 0)) {
                if (nlapiGetCurrentLineItemValue("item", "quantity").length == 0) {
                    nlapiSetCurrentLineItemValue("item", "quantity", nlapiGetLineItemField("item", "minqty") != null && nlapiGetCurrentLineItemValue("item", "minqty").length > 0 ? nlapiGetCurrentLineItemValue("item", "minqty") : "1", false);
                    if (hasLegacyMachine() && document.activeElement == document.forms.item_form.elements.quantity) {
                        document.forms.item_form.elements.quantity.select();
                    }
                }
            } else {
                if (a.length != 0) {
                    if (nlapiGetCurrentLineItemValue("item", "quantity").length > 0) {
                        alert("Quantity not allowed for this item.");
                        nlapiSetCurrentLineItemValue("item", "quantity", "", false);
                        return false;
                    }
                }
            }
        }
    }
    if (nlapiGetLineItemField("item", "quantity") != null && nlapiGetCurrentLineItemValue("item", "quantity").length > 0) {
        var c = parseFloat(nlapiGetCurrentLineItemValue("item", "quantity"));
        if (c != Math.round(c * 100000) / 100000) {
            alert("Quantity can not have more than 5 decimal places.");
            nlapiSetCurrentLineItemValue("item", "quantity", Math.round(c * 100000) / 100000, false);
            return false;
        }
    }
    return true;
}

function CheckDropShipSpecialOrderQty(b, a) {
    if ((((hasItemMachField("isdropshiporderline") && getItemMachValue("isdropshiporderline") == "T") || (hasItemMachField("isspecialorderline") && getItemMachValue("isspecialorderline") == "T")) && getItemMachValue("dropshipwarningdisplayed") != "T") && ((hasItemMachField("quantity") && getItemMachValue("quantity").length > 0 && getItemMachValue("quantity") != getItemMachValue("origquantity")) || (hasItemMachField("units") && getItemMachValue("units").length > 0 && getItemMachValue("units") != getItemMachValue("origunits")))) {
        if ((!b && !a) || getItemMachValue("dropshiporderhasbeenshiprecv") == "T") {
            alert("If you edit the quantity of a drop-ship or special order item on either a sales order or a purchase order, verify that the sales order and corresponding purchase order both show the same quantity. If the sales order and purchase order quantities do not match, the item is no longer treated as a drop shipment or special order and your inventory may be affected.");
        } else {
            if (getTransactionType() == "salesord") {
                alert("When you change the sales order quantity, the purchase order quantity and price will be adjusted based on this change.");
            } else {
                if (getTransactionType() == "purchord") {
                    alert("When you change the purchase order quantity, the sales order quantity and price will be adjusted based on this change.");
                }
            }
        }
        setItemMachValue("dropshipwarningdisplayed", "T");
    }
}

function CheckInterCompanyQty() {
    if (hasItemMachField("isintercoorderline") && getItemMachValue("isintercoorderline") == "T" && getItemMachValue("intercowarningdisplayed") != "T" && (hasItemMachField("quantity") && getItemMachValue("quantity").length > 0 && getItemMachValue("quantity") != getItemMachValue("intercoorderorigqty"))) {
        if (getTransactionType() == "salesord") {
            alert("When you change the intercompany sales order quantity, the intercompany purchase order quantity and price will be adjusted based on this change.");
        } else {
            if (getTransactionType() == "purchord") {
                alert("When you change the intercompany purchase order quantity, the intercompany sales order quantity and price will be adjusted based on this change.");
            }
        }
        setItemMachValue("intercowarningdisplayed", "T");
    }
}

function CheckMinCount(c) {
    if (nlapiGetLineItemField("item", "minqty") != null && nlapiGetCurrentLineItemValue("item", "minqty").length > 0) {
        if (nlapiGetCurrentLineItemValue("item", "quantity").length == 0 || parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) < parseFloat(nlapiGetCurrentLineItemValue("item", "minqty")) && shouldDoMinCountCheck()) {
            var b = "The minimum quantity for this item is {1}.";
            alert(b.replace(/\{1\}/, nlapiGetCurrentLineItemValue("item", "minqty")));
            if (c && hasLegacyMachine()) {
                var a = document.forms.item_form;
                a.elements.quantity.focus();
                a.elements.quantity.select();
                NS.form.setValid(false);
            }
            return false;
        }
    } else {
        if (getTransactionType() == "blankord" && nlapiGetLineItemField("item", "quantityordered") != null) {
            var d = parseFloat(getItemMachValue("quantityordered"));
            if (nlapiGetCurrentLineItemValue("item", "quantity").length == 0 || parseFloat(nlapiGetCurrentLineItemValue("item", "quantity")) < d) {
                alert("The quantity cannot be less than the quantity ordered.");
                if (c && hasLegacyMachine()) {
                    var a = document.forms.item_form;
                    a.elements.quantity.focus();
                    a.elements.quantity.select();
                    NS.form.setValid(false);
                }
                return false;
            }
        }
    }
    return true;
}

function shouldDoMinCountCheck() {
    var a = getTransactionType();
    return !(a == "custcred" || a == "cashrfnd" || ((a == "custinvc" || a == "cashsale") && nlapiGetCurrentLineItemValue("item", "orderline") != null && nlapiGetCurrentLineItemValue("item", "orderline").length != 0) || (a == "rtnauth" && nlapiGetContext().getPreference("ENFORCE_MIN_QUANTITY_RET_AUTH") == "F"));
}

function CheckStockMultiple(d, a, c) {
    for (var b = d; b < a; b++) {
        var e = "";
        if (hasEncodedField("item", "units_display")) {
            e = getEncodedValue("item", b, "units_display");
            if (e.length != 0) {
                e = " " + e;
            }
        }
        CheckStockAmounts(hasEncodedField("item", "item_display") ? getEncodedValue("item", b, "item_display") : nlapiGetLineItemText("item", "item", b), parseFloat(getEncodedValue("item", b, "quantity")), parseFloat(getEncodedValue("item", b, "quantityavailable")), parseFloat(getEncodedValue("item", b, "reorder")), parseFloat(getEncodedValue("item", b, "onorder")), parseFloat(getEncodedValue("item", b, "backordered")), getEncodedValue("item", b, "itemtype"), c, e, (hasEncodedField("item", "createpo") ? getEncodedValue("item", b, "createpo") : ""), (hasEncodedField("item", "createwo") ? getEncodedValue("item", b, "createwo") : "F"));
    }
}

function checkComponentQuantityChange() {
    var b = parseFloat(nlapiGetCurrentLineItemValue("item", "quantity"));
    var a = parseFloat(getItemMachValue("quantityfulfilled"));
    return checkComponentQuantity(b, a);
}

function checkComponentYieldQuantityChange() {
    if (itemMachCurrentLineValueNotEmpty("componentyield") && itemMachCurrentLineValueNotEmpty("bomquantity")) {
        var b = getComponentYieldQuantity();
        var a = parseFloat(nlapiGetCurrentLineItemValue("item", "quantityfulfilled"));
        return checkComponentQuantity(b, a);
    }
    return true;
}

function checkComponentQuantity(b, a) {
    if (b < a) {
        alert("The selected item is used in other builds associated with this work order. The item quantity cannot be lower than what has already been issued to these related builds. To proceed, amend the relevant issue component transaction on the related build.");
        return false;
    }
    return true;
}

function checkItemIsChangedAfterRevenueElementCreation() {
    if (itemMachCurrentLineValueNotEmpty("attachedtorevenueelement") && nlapiGetCurrentLineItemValue("item", "attachedtorevenueelement") == "T") {
        alert("You cannot change the item on this line because it has an existing revenue element. Delete the line, and enter a new line to correct the item.");
        return false;
    }
    return true;
}

function SetupGroup(h, f, a) {
    var e;
    if (hasEncodedField("item", "class")) {
        var l = item_machine.getElementRequired("class");
        var j = l ? f + 1 : f;
        for (e = h; e < j; e++) {
            if (getEncodedValue("item", h - 1, "class").length != 0) {
                setEncodedValue("item", e, "class", getEncodedValue("item", h - 1, "class"));
            }
        }
        if (!l) {
            setEncodedValue("item", h - 1, "class", "");
        }
    }
    if (hasEncodedField("item", "department")) {
        var l = item_machine.getElementRequired("department");
        var j = l ? f + 1 : f;
        for (e = h; e < j; e++) {
            if (getEncodedValue("item", h - 1, "department").length != 0) {
                setEncodedValue("item", e, "department", getEncodedValue("item", h - 1, "department"));
            }
        }
        if (!l) {
            setEncodedValue("item", h - 1, "department", "");
        }
    }
    if (hasEncodedField("item", "location")) {
        var l = item_machine.getElementRequired("location");
        var j = l ? f + 1 : f;
        for (e = h; e < j; e++) {
            if (getEncodedValue("item", h - 1, "location").length != 0) {
                setEncodedValue("item", e, "location", getEncodedValue("item", h - 1, "location"));
                setEncodedValue("item", e, "location_display", getEncodedValue("item", h - 1, "location_display"));
            }
        }
        if (!l) {
            setEncodedValue("item", h - 1, "location", "");
            setEncodedValue("item", h - 1, "location_display", "");
        }
    }
    if (useInventoryLocationForFulfillment() && hasEncodedField("item", "inventorylocation")) {
        var j = f;
        for (e = h; e < j; e++) {
            if (getEncodedValue("item", h - 1, "inventorylocation").length != 0) {
                setEncodedValue("item", e, "inventorylocation", getEncodedValue("item", h - 1, "inventorylocation"));
                setEncodedValue("item", e, "inventorylocation_display", getEncodedValue("item", h - 1, "inventorylocation_display"));
            }
        }
        setEncodedValue("item", h - 1, "inventorylocation", "");
        setEncodedValue("item", h - 1, "inventorylocation_display", "");
    }
    if (useInventoryLocationForFulfillment() && hasEncodedField("item", "inventorysubsidiary")) {
        var j = f;
        for (e = h; e < j; e++) {
            if (getEncodedValue("item", h - 1, "inventorysubsidiary").length != 0) {
                setEncodedValue("item", e, "inventorysubsidiary", getEncodedValue("item", h - 1, "inventorysubsidiary"));
            }
        }
        setEncodedValue("item", h - 1, "inventorysubsidiary", "");
    }
    if (hasEncodedField("item", "isbillable")) {
        for (e = h; e < f; e++) {
            setEncodedValue("item", e, "isbillable", getEncodedValue("item", h - 1, "isbillable"));
        }
        setEncodedValue("item", h - 1, "isbillable", "F");
    }
    if (hasEncodedField("item", "customer")) {
        for (e = h; e < f; e++) {
            setEncodedValue("item", e, "billto", getEncodedValue("item", h - 1, "billto"));
        }
        setEncodedValue("item", h - 1, "billto", "");
    }
    if (hasEncodedField("item", "job")) {
        for (e = h; e < f; e++) {
            setEncodedValue("item", e, "job_display", getEncodedValue("item", h - 1, "job_display"));
            setEncodedValue("item", e, "job", getEncodedValue("item", h - 1, "job"));
        }
        setEncodedValue("item", h - 1, "job", "");
        setEncodedValue("item", h - 1, "job_display", "");
    }
    var g = getFieldNamesArray("item");
    var b = splitIntoCells(nlapiGetFieldValue("itemflags"));
    var c;
    for (c = 0; c < g.length; c++) {
        if (g[c].indexOf("custcol") == 0) {
            for (e = h; e < f; e++) {
                if (getEncodedValue("item", h - 1, g[c]).length > 0 && getEncodedValue("item", h - 1, g[c]) != "F" && getEncodedValue("item", e, g[c]).length == 0) {
                    setEncodedValue("item", e, g[c], getEncodedValue("item", h - 1, g[c]));
                }
            }
            if ((b[c] & 16) == 0) {
                setEncodedValue("item", h - 1, g[c], "");
            }
        }
    }
    if (hasEncodedField("item", "expectedshipdate")) {
        initializeExpectedShipmentDateForGroup(h, f);
    }
    if (hasEncodedField("item", "expectedreceiptdate")) {
        setDefaultExpectedReceiptDateForGroup(h, f);
    }
    if (hasEncodedField("item", "orderallocationstrategy")) {
        initializeOrderAllocationStrategyForGroup(h, f);
    }
    setEncodedValue("item", h - 1, "amount", "");
    setEncodedValue("item", h - 1, "groupsetup", "T");
    if (nlapiGetContext().getFeature("STOREPICKUP")) {
        var d = "itemfulfillmentchoice";
        if (hasEncodedField("item", d)) {
            var l = item_machine.getElementRequired(d);
            var j = l ? f + 1 : f;
            var k = getEncodedValue("item", h - 1, d);
            if (k.length != 0) {
                for (e = h; e < j; e++) {
                    if (storePickUpConnector.isFulfillableLine(e)) {
                        setEncodedValue("item", e, d, k);
                    }
                }
            }
            if (!l) {
                setEncodedValue("item", h - 1, d, "");
            }
            storePickUpConnector.setExcludeFromRateRequestMultiple(h, f);
        }
    }
}

function FillPctQty(f) {
    var e = nlapiGetLineItemCount("item");
    var d = prompt("Please enter a numeric percentage:", "100");
    if (d == "" || d == null) {
        return;
    }
    d = parseFloat(d);
    if (isNaN(d)) {
        alert("The percentage you entered was invalid.");
        return;
    }
    for (var b = 1; b <= e; b++) {
        var a = parseFloat(getEncodedValue("item", b, "quantityordered"));
        if (!isNaN(a)) {
            var h = d / 100 * a;
            h = Math.round(h * 100000) / 100000;
            var g = parseFloat(getEncodedValue("item", b, "quantity"));
            setEncodedValue("item", b, "currentpercent", d + "%");
            setEncodedValue("item", b, "quantity", h);
            if (f) {
                if (hasEncodedField("item", "quantityfulfilled")) {
                    var c = parseFloat(getEncodedValue("item", b, "quantityfulfilled"));
                    if (isNaN(g)) {
                        g = 0;
                    }
                    if (isNaN(c)) {
                        c = 0;
                    }
                    c = c + h - g;
                    setEncodedValue("item", b, "quantityfulfilled", c);
                    if (hasEncodedField("item", "percentcomplete") && a > 0) {
                        setEncodedValue("item", b, "percentcomplete", c / a * 100 + "%");
                    }
                }
            }
            setEncodedValue("item", b, "amount", format_currency(getEncodedValue("item", b, "rate") * getEncodedValue("item", b, "quantity")));
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
    if (getTransactionType() == "workord" && workOrderConnector.isInternal()) {
        return;
    }
    var oqpHandler = new function() {
        var rateField = taxInclusivePricingHelper.getEditableFieldName("rate");
        var amountField = taxInclusivePricingHelper.getEditableFieldName("amount");
        var bucketTotals = [];
        var bucketsNeedingNewRate = [];
        var isUseUnitConversionRatePreferenceEnabled = nlapiGetContext().getPreference("USE_UNIT_CONVERSION_RATE") === "T";
        var skipOQPRecalcForCurrentLine;
        var isDynamic;
        var currentLine;
        this.init = function() {
            currentLine = nlapiGetCurrentLineItemIndex("item");
            isDynamic = currentLine > 0 && currentLine <= linecount;
            skipOQPRecalcForCurrentLine = isDynamic && bucketsDeleted.length == 0 && !(lineImpactsOQP(currentLine) && bucketOrQtyChanged(currentLine));
            if (!skipOQPRecalcForCurrentLine) {
                setDeletedBucketsNeedUpdate();
                loadBucketTotalsAndSetNeedsRecalc(1);
            }
        };

        function getBucket(linenum) {
            return getEncodedItemValue(linenum, "oqpbucket");
        }

        function getOrigBucket(linenum) {
            return getEncodedItemValue(linenum, "initoqpbucket");
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
        }

        function bucketChanged(linenum) {
            return fieldChanged(linenum, "oqpbucket");
        }

        function qtyChanged(linenum) {
            return floatFieldChanged(linenum, "quantity");
        }

        function fieldChanged(linenum, fieldname) {
            var lineCommitted = getEncodedItemValue(linenum, fieldname);
            var lineInit = getEncodedItemValue(linenum, "init" + fieldname);
            var updated = lineInit != lineCommitted;
            return updated;
        }

        function floatFieldChanged(linenum, fieldname) {
            var lineCommitted = getEncodedItemFloat(linenum, fieldname);
            var lineInit = getEncodedItemFloat(linenum, "init" + fieldname);
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
            if (bucketsDeleted.length > 0) {
                bucketsDeleted = [];
            }
        }

        function loadBucketTotalsAndSetNeedsRecalc(linenum) {
            var updateInitValues = function(linenum) {
                var origQtyVal = nlapiGetLineItemValue("item", "quantity", linenum);
                setEncodedValue("item", linenum, "initquantity", origQtyVal);
                if (hasItemMachField("oqpbucket")) {
                    var origOQPBucketVal = nlapiGetLineItemValue("item", "oqpbucket", linenum);
                    setEncodedValue("item", linenum, "initoqpbucket", origOQPBucketVal);
                }
            };
            for (var j = linenum; j <= linecount; j++) {
                var qty = getEncodedItemFloat(j, "quantity");
                if (!lineImpactsOQP(j) || qty == 0) {
                    continue;
                }
                var bucketKey = getBucket(j);
                var bucketHasChanged = bucketChanged(j);
                var qtyHasChanged = qtyChanged(j);
                var wasChanged = (bucketHasChanged || qtyHasChanged);
                if (isUseUnitConversionRatePreferenceEnabled) {
                    var rate = getLineValue(j, "unitconversionrate");
                    if (!rate) {
                        rate = 1;
                    }
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
                    removeLineToUpdateInitValues(j);
                }
            }
        }

        function getBucketQty(linenum) {
            var bucketKey = getBucket(linenum);
            var qty = bucketTotals[bucketKey];
            if (isUseUnitConversionRatePreferenceEnabled) {
                var rate = getLineValue(linenum, "unitconversionrate");
                if (!rate) {
                    rate = 1;
                }
                qty = qty / rate;
            }
            return qty;
        }

        function isManualRate(linenum) {
            return (getEncodedItemFloat(linenum, "price") == -1) || (round_currency(getEncodedItemFloat(linenum, rateField) * getEncodedItemFloat(linenum, "quantity")) != round_currency(getEncodedItemFloat(linenum, amountField)));
        }

        function lineImpactsOQP(linenum) {
            return (hasEncodedItemValue(linenum, "oqpbucket") || hasEncodedItemValue(linenum, "initoqpbucket"));
        }

        function lineIsFromTransform(linenum) {
            return hasEncodedItemValue(linenum, "orderdoc");
        }
        this.handleLineRecalc = function(linenum) {
            if (!skipOQPRecalcForCurrentLine && lineImpactsOQP(linenum) && bucketNeedsRecalc(linenum) && !lineIsFromTransform(linenum) && !isManualRate(linenum) && getTransactionType() != "rtnauth") {
                var overallQty = getBucketQty(linenum);
                var rateIsMarginal = "T" == getEncodedItemValue(linenum, "marginal");
                var rate = getQtyRate(getEncodedItemValue(linenum, "rateschedule"), overallQty, rateIsMarginal);
                var amount = rate * getEncodedItemFloat(linenum, "quantity");
                setEncodedItemValue(linenum, rateField, format_currency(round_float(rate), true));
                setEncodedItemValue(linenum, amountField, format_currency(amount));
            }
        };
    };
    var isVat;
    if (nlapiGetContext().getFeature("ADVTAXENGINE")) {
        var nexusCountry = nlapiGetFieldValue("nexus_country");
        isVat = nexusCountry != null && nexusCountry != "US" && nexusCountry != "CA";
    } else {
        var edition = nlapiGetFieldValue("edition");
        isVat = edition != null && edition != "US" && edition != "CA";
    }
    var vatrate;
    var amount;
    var linecount = nlapiGetLineItemCount("item");
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
        var pooverallqtydisc = getEncodedValue("item", i, "pooverallqtydisc");
        if (pooverallqtydisc && pooverallqtydisc.length > 0) {
            var povendor = parseInt(getEncodedValue("item", i, "povendor"));
            var poqtygroup = parseInt(getEncodedValue("item", i, "poqtygroup"));
            var poqty = eval("po" + pooverallqtydisc.toLowerCase() + 'qtys[createpo+"_"+povendor+"_"+poqtygroup]');
            var createpo = getEncodedValue("item", i, "createpo");
            if (!(poqty >= 0)) {
                poqty = 0;
                for (var j = 1; j <= linecount; j++) {
                    if (getEncodedValue("item", j, "pooverallqtydisc") == pooverallqtydisc && parseInt(getEncodedValue("item", j, "poqtygroup")) == poqtygroup && parseInt(getEncodedValue("item", j, "povendor")) == povendor && ((getEncodedValue("item", j, "createpo").length == 0 && createpo.length == 0) || getEncodedValue("item", j, "createpo") == createpo) && parseFloat(getEncodedValue("item", j, "quantity")) > 0) {
                        poqty += parseFloat(getEncodedValue("item", j, "quantity"));
                    }
                }
                eval("po" + pooverallqtydisc.toLowerCase() + 'qtys[createpo+"_"+povendor+"_"+poqtygroup] = poqty');
            }
            var porate = getQtyRate(getEncodedValue("item", i, "poratesched"), poqty, "T" == getEncodedValue("item", i, "pomarginal"));
            setEncodedValue("item", i, "porate", format_currency(round_float(porate), true));
        }
        if (getEncodedValue("item", i, "itemtype") == "Discount" || getEncodedValue("item", i, "itemtype") == "Markup") {
            if (i == 1) {
                if (getEncodedValue("item", i, "rate").indexOf("%") != -1) {
                    setEncodedValue("item", i, "amount", format_currency(0));
                }
                continue;
            }
            var basisline = i - 1;
            for (var j = i - 1; j > 0; j--) {
                if (getEncodedValue("item", j, "itemtype") != "Discount" && getEncodedValue("item", j, "itemtype") != "Markup") {
                    basisline = j;
                    break;
                }
            }
            var basis = parseFloat(getEncodedValue("item", basisline, "amount"));
            var asbasis = parseFloat(getEncodedValue("item", basisline, "altsalesamt"));
            if (!isNaN(basis)) {
                var rate = parseFloat(getEncodedValue("item", i, "rate"));
                if (!isNaN(rate)) {
                    var isRatePct = getEncodedValue("item", i, "rate").indexOf("%") != -1;
                    var amtstr = format_currency(isRatePct ? rate * basis / 100 : rate);
                    setEncodedValue("item", i, "amount", amtstr);
                }
                if (hasEncodedField("item", "taxableamt")) {
                    var taxbasis = parseFloat(getEncodedValue("item", basisline, "taxableamt"));
                    if (isNaN(taxbasis) && getEncodedValue("item", basisline, "istaxable") == "T") {
                        taxbasis = basis;
                    }
                    var discamt = parseFloat(getEncodedValue("item", i, "amount"));
                    if (!isNaN(discamt)) {
                        setEncodedValue("item", i, "taxableamt", isNaN(taxbasis) ? 0 : discamt * taxbasis / basis);
                    }
                }
            }
            if (!isNaN(asbasis)) {
                var discBasis = (getEncodedValue("item", i, "rate").indexOf("%") == -1) ? basis : 100;
                var rate = parseFloat(getEncodedValue("item", i, "rate"));
                var asamtstr = (isNaN(rate) ? "" : format_currency(rate * asbasis / discBasis));
                setEncodedValue("item", i, "altsalesamt", asamtstr);
            }
        } else {
            if (getEncodedValue("item", i, "itemtype") == "Subtotal") {
                if (i == 1) {
                    setEncodedValue("item", i, "amount", format_currency(0));
                    continue;
                }
                var total = 0;
                var taxabletotal = 0;
                var asatotal = 0;
                var grosstotal = 0;
                var taxtotal = 0;
                var taxAmountFieldName;
                if (hasEncodedField("item", "taxamount")) {
                    taxAmountFieldName = "taxamount";
                } else {
                    taxAmountFieldName = "tax1amt";
                }
                var dotax = hasEncodedField("item", "taxableamt");
                var subingroup = true;
                var curingroup = true;
                for (var j = i - 1; j > 0; j--) {
                    if (getEncodedValue("item", j, "itemtype") == "EndGroup") {
                        subingroup = false;
                        curingroup = true;
                        continue;
                    }
                    if (j == i - 1 && (getEncodedValue("item", j, "itemtype") == "Discount" || getEncodedValue("item", j, "itemtype") == "Markup") && getEncodedValue("item", j - 1, "itemtype") == "Subtotal") {
                        total = parseFloat(getEncodedValue("item", j, "amount")) + parseFloat(getEncodedValue("item", j - 1, "amount"));
                        asatotal = parseFloat(getEncodedValue("item", j, "altsalesamt")) + parseFloat(getEncodedValue("item", j - 1, "altsalesamt"));
                        grosstotal = parseFloat(getEncodedValue("item", j, "grossamt")) + parseFloat(getEncodedValue("item", j - 1, "grossamt"));
                        taxtotal = parseFloat(getEncodedValue("item", j, taxAmountFieldName)) + parseFloat(getEncodedValue("item", j - 1, taxAmountFieldName));
                        if (dotax) {
                            taxabletotal = parseFloat(getEncodedValue("item", j, "taxableamt")) + parseFloat(getEncodedValue("item", j - 1, "taxableamt"));
                        }
                        break;
                    }
                    if (getEncodedValue("item", j, "itemtype") == "Group") {
                        if (subingroup) {
                            break;
                        } else {
                            curingroup = false;
                        }
                    } else {
                        if ((subingroup || (!subingroup && !curingroup)) && allLinesAreDiscountOrMarkupAfterSubtotal(j)) {
                            break;
                        }
                    }
                    if (getEncodedValue("item", j, "itemtype") == "Subtotal") {
                        continue;
                    }
                    var amount = parseFloat(getEncodedValue("item", j, "amount"));
                    var asamount = parseFloat(getEncodedValue("item", j, "altsalesamt"));
                    var grossamount = parseFloat(getEncodedValue("item", j, "grossamt"));
                    var taxAmount = parseFloat(getEncodedValue("item", j, taxAmountFieldName));
                    if (!isNaN(amount)) {
                        total += amount;
                    }
                    if (!isNaN(asamount)) {
                        asatotal += asamount;
                    }
                    if (!isNaN(grossamount)) {
                        grosstotal += grossamount;
                    }
                    if (!isNaN(grossamount)) {
                        taxtotal += taxAmount;
                    }
                    if (dotax && getEncodedValue("item", j, "istaxable") == "T" && !isNaN(amount)) {
                        taxabletotal += amount;
                    }
                }
                amtstr = (isNaN(total) ? "" : format_currency(total));
                setEncodedValue("item", i, "amount", amtstr);
                var asamtstr = (isNaN(asatotal) ? "" : format_currency(asatotal));
                setEncodedValue("item", i, "altsalesamt", asamtstr);
                var grossamtstr = (isNaN(grosstotal) ? "" : format_currency(grosstotal));
                setEncodedValue("item", i, "grossamt", grossamtstr);
                var taxAmountString = (isNaN(taxtotal) ? "" : format_currency(taxtotal));
                if (hasEncodedField("item", taxAmountFieldName)) {
                    setEncodedValue("item", i, taxAmountFieldName, taxAmountString);
                }
                if (dotax) {
                    amtstr = (isNaN(taxabletotal) ? "" : format_currency(taxabletotal));
                    setEncodedValue("item", i, "taxableamt", amtstr);
                }
            } else {
                if (i > 1 && getEncodedValue("item", i, "itemtype") == "EndGroup") {
                    var total = 0;
                    var asatotal = 0;
                    var grosstotal = 0;
                    var tax1total = 0;
                    var taxabletotal = 0;
                    var dotax = hasEncodedField("item", "taxableamt");
                    var totaldiscingroup = 0;
                    for (var j = i - 1; j > 0; j--) {
                        if (getEncodedValue("item", j, "itemtype") == "Subtotal") {
                            continue;
                        }
                        if (getEncodedValue("item", j, "itemtype") == "Group") {
                            break;
                        }
                        var amount = parseFloat(getEncodedValue("item", j, "amount"));
                        var asamount = parseFloat(getEncodedValue("item", j, "altsalesamt"));
                        var grossamount = parseFloat(getEncodedValue("item", j, "grossamt"));
                        var tax1amount = parseFloat(getEncodedValue("item", j, "tax1amt"));
                        if (!isNaN(amount)) {
                            total += amount;
                        }
                        if (!isNaN(asamount)) {
                            asatotal += asamount;
                        }
                        if (!isNaN(grossamount)) {
                            grosstotal += grossamount;
                        }
                        if (!isNaN(tax1amount)) {
                            tax1total += tax1amount;
                        }
                        if (getEncodedValue("item", j, "itemtype") == "Discount" || getEncodedValue("item", j, "itemtype") == "Markup") {
                            totaldiscingroup += amount;
                        }
                        if (dotax && getEncodedValue("item", j, "istaxable") == "T" && !isNaN(amount)) {
                            taxabletotal += amount;
                        }
                    }
                    amtstr = (isNaN(total) ? "" : format_currency(total));
                    setEncodedValue("item", i, "amount", amtstr);
                    var asamtstr = (isNaN(asatotal) ? "" : format_currency(asatotal));
                    setEncodedValue("item", i, "altsalesamt", asamtstr);
                    var grossamtstr = (isNaN(grosstotal) ? "" : format_currency(grosstotal));
                    setEncodedValue("item", i, "grossamt", grossamtstr);
                    var tax1amtstr = (isNaN(tax1total) ? "" : format_currency(tax1total));
                    if (hasEncodedField("item", "tax1amt")) {
                        setEncodedValue("item", i, "tax1amt", tax1amtstr);
                    }
                    if (dotax) {
                        amtstr = (isNaN(taxabletotal) ? "" : format_currency(taxabletotal));
                        setEncodedValue("item", i, "taxableamt", amtstr);
                    }
                    ingroup = false;
                } else {
                    if (getEncodedValue("item", i, "itemtype") == "Group" && getEncodedValue("item", i, "groupsetup") == "T") {
                        var noprint = getEncodedValue("item", i, "printitems") != "T";
                        var closed = getEncodedValue("item", i, "isclosed") == "T";
                        setEncodedValue("item", i, "noprint", "F");
                        for (var j = i + 1; j <= linecount; j++) {
                            setEncodedValue("item", j, "ingroup", "T");
                            if (noprint) {
                                setEncodedValue("item", j, "noprint", "T");
                            }
                            if (closed) {
                                setEncodedValue("item", j, "isclosed", "T");
                                setEncodedValue("item", j, "groupclosed", "T");
                            } else {
                                setEncodedValue("item", j, "groupclosed", "F");
                            }
                            if (getEncodedValue("item", j, "itemtype") == "EndGroup") {
                                if (!closed) {
                                    setEncodedValue("item", j, "isclosed", "F");
                                }
                                break;
                            }
                        }
                        ingroup = true;
                    } else {
                        if (nlapiGetContext().getExecutionContext() != "virtualbrowser" || getEncodedValue("item", i, "itemtype") != "") {
                            setEncodedValue("item", i, "taxableamt", "");
                            if (!ingroup) {
                                setEncodedValue("item", i, "groupid", "");
                            }
                        }
                    }
                }
            }
        }
        if (isVat) {
            if (parseFloat(getEncodedValue("item", i, "refamt")) != parseFloat(getEncodedValue("item", i, "amount"))) {
                amount = parseFloat(getEncodedValue("item", i, "amount"));
                vatrate = parseFloat(getEncodedValue("item", i, "taxrate1"));
                if (!isNaN(vatrate)) {
                    if (hasEncodedField("item", "tax1amt")) {
                        setEncodedValue("item", i, "tax1amt", format_currency((vatrate / 100) * amount));
                    }
                    setEncodedValue("item", i, "grossamt", format_currency(parseFloat(getEncodedValue("item", i, "tax1amt")) + amount));
                    setEncodedValue("item", i, "refamt", getEncodedValue("item", i, "amount"));
                }
            }
        }
    }
    calculateAllocation();
    if ("T" == nlapiGetFieldValue("iseitf81on")) {
        calculateAllocation("SOFTWARE", "T");
    }
    Totalling_Machine_Recalc(onload);
    if (storePickUpConnector.getAllowFulfillmentChoiceRecalcInSalesOrder()) {
        storePickUpConnector.setFulfillmentChoiceInSalesOrder("itemfulfillmentchoice", "orderfulfillmentchoice");
    }
    if (nlapiGetContext().getFeature("MULTISHIPTO")) {
        Item_Machine_Recalc_MSR();
    }
}

function Item_Machine_Recalc_MSR() {
    var c = nlapiGetCurrentLineItemValue("item", "shipaddress");
    if (c != "") {
        var a = nlapiGetCurrentLineItemValue("item", "shipaddress_display");
        for (var b = 1; b <= nlapiGetLineItemCount("item"); b++) {
            if (nlapiGetLineItemValue("item", "shipaddress", b) == c) {
                setEncodedValue("item", b, "shipaddress_display", a);
            }
        }
    }
}

function SalesordItemHasBeenProcessed() {
    var a = getTransactionType();
    return a == "salesord" && (getItemMachValue("quantityfulfilled") > 0 || getItemMachValue("quantitybilled") > 0 || getItemMachValue("itempicked") == "T");
}

function GetEditLineWarning() {
    var c = getTransactionType();
    var b = null;
    if ((c == "purchord" || c == "salesord" || c == "trnfrord") && hasEncodedField("item", "linkedshiprcpt") && hasEncodedField("item", "linkedordbill")) {
        var d = c == "purchord" ? "received" : "fulfilled";
        var a = "billed";
        if (getItemMachValue("linkedshiprcpt") == "T" && getItemMachValue("linkedordbill") == "T") {
            b = d + " and " + a;
        } else {
            if (getItemMachValue("linkedordbill") == "T") {
                b = a;
            } else {
                if (hasItemMachField("linkedordrvcom") && getItemMachValue("linkedordrvcom") == "T") {
                    b = "revenue committed";
                } else {
                    if (hasItemMachField("linkeddropship") && getItemMachValue("linkeddropship") == "T") {
                        b = "drop shipped or special ordered";
                    } else {
                        if (c != "purchord" && getItemMachValue("itempicked") == "T" && !(getItemMachValue("linkedshiprcpt") == "T")) {
                            b = (getItemMachValue("itempacked") == "T") ? "packed" : "picked";
                        } else {
                            if ((c != "salesord" && getItemMachValue("linkedshiprcpt") == "T") || SalesordItemHasBeenProcessed()) {
                                b = d;
                            } else {
                                if (c == "salesord" && parseInt(getItemMachValue("quantityrequestedtofulfill")) > 0) {
                                    b = "requested";
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        if (c == "workord") {
            b = "included in build";
        } else {
            if (c == "rtnauth" && hasItemMachField("linkedordrvcom") && getItemMachValue("linkedordrvcom") == "T") {
                b = "revenue committed";
            } else {
                if (c == "salesord" && !SalesordItemHasBeenProcessed()) {
                    b = null;
                } else {
                    switch (c) {
                        case "purchord":
                            b = "received";
                            break;
                        case "salesord":
                            b = "fulfilled";
                            break;
                        case "vendauth":
                            b = "returned";
                            break;
                        case "rtnauth":
                            b = "Return Authorization";
                            break;
                        case "purchcon":
                        case "blankord":
                            b = "purchased";
                            break;
                        default:
                            b = "reimbursed";
                            break;
                    }
                }
            }
        }
    }
    return b;
}
var validateItemLinesMoss = validateItemLinesMoss || function() {
    return true;
};

function Item_Machine_getLineRate() {
    var a = parseFloatOrZero(getItemMachValue("unitconversionrate"));
    if (a == 0) {
        a = 1;
    }
    return a;
}

function Item_Machine_ValidateLineQuantity() {
    var a = true;
    if (hasEncodedField("item", "linked") && hasItemMachField("quantitylocked") && getItemMachValue("quantitylocked") > 0) {
        var c = parseFloat(getItemMachValue("quantitylocked"));
        var b = Item_Machine_getLineRate();
        var d = parseFloat(getItemMachValue("quantity"));
        d = d * b;
        a = d >= c;
    }
    return a;
}

function Item_Machine_GroupItemQuantiesWarning(e, d) {
    if (e.length == 0) {
        alert("All members of this group are associated with a wave transaction. The item quantity for each member cannot be decreased below the quantity included in a wave.");
    } else {
        if (d.length > 0) {
            var a = d.slice(0, Math.min(5, d.length));
            if (a.length < d.length) {
                a.push("...");
            }
            var c = "\n\n" + a.join("\n") + "\n\n";
            var b = "One or more members of this group are associated with a wave transaction. Item quantities for the members not associated with waves have been updated. Item quantities for the following members cannot be decreased below the quantities included in a wave:unchangedNamesPlaceholder";
            alert(b.replace("unchangedNamesPlaceholder", c));
        }
    }
}

function Item_Machine_ValidateLine() {
    var p = "salesord";
    var y = "fulfillable";
    var h = "itemfulfillmentchoice";
    var C = hasItemMachField("amount") ? getItemMachValue("amount") : "";
    if (C != null && C.length > 0 && A == "Description") {
        alert("You cannot have an amount for that type of item.");
        return false;
    }
    if (getItemMachValue("item") == "" && !getItemMachValue("line")) {
        alert("Please choose an item to add");
        return false;
    }
    if (getTransactionType() != "workord" && itemMachCurrentLineValueNotEmpty("orderallocationstrategy") && nlapiGetLineItemField("item", "requesteddate") && nlapiGetCurrentLineItemValue("item", "requesteddate") == "") {
        alert("Please enter a value for Supply Required By Date");
        return false;
    }
    if (hasItemMachField("orderschedule")) {
        if (!validateOrderScheduleSubrecord_item()) {
            return false;
        }
    }
    if (!validateItemLinesMoss()) {
        return false;
    }
    if (hasEncodedField("item", "linked")) {
        if (hasItemMachField("quantitylocked") && getItemMachValue("quantitylocked") > 0) {
            var s = [{
                id: "item",
                msg: "You cannot change the item for a line item associated with a wave transaction."
            }, {
                id: "units",
                msg: "You cannot change the unit of measure of an item when the line item is associated with a wave transaction."
            }, {
                id: "inventorylocation",
                msg: "You cannot change the location in the header or the inventory location of line items associated with a wave transaction."
            }];
            if (!nlapiGetContext().getFeature("CROSSSUBSIDIARYFULFILLMENT")) {
                s.push({
                    id: "location",
                    msg: "You cannot change the location in the header or the inventory location of line items associated with a wave transaction."
                });
            }
            for (var B = 0; B < s.length; B++) {
                if (fieldOnItemMachineHasChanges(s[B].id)) {
                    alert(s[B].msg);
                    return false;
                }
            }
            if (!Item_Machine_ValidateLineQuantity()) {
                var f = parseFloat(getItemMachValue("quantitylocked"));
                var E = Item_Machine_getLineRate();
                var n = "You cannot decrease the line item quantity below the quantity released to the warehouse. Quantity of released items: quantiyLockedPlaceholder";
                alert(n.replace("quantiyLockedPlaceholder", parseFloat((f / E).toFixed(8))));
                return false;
            }
        }
        if (getItemMachValue("linked") == "T") {
            var q;
            var e = getTransactionType();
            var x = GetEditLineWarning();
            if (x != null) {
                if (typeDoesNotAllowItemChangeForAlreadyLinked(e, getItemMachValue("itempicked")) && selectedItemHasChanged()) {
                    alert("You cannot change the selected item because it has already been " + x + ".");
                    return false;
                }
                if (x == "reimbursed") {
                    q = "Items on this line have been reimbursed. If you modify it: you will change this bill, the item will no longer appear as a billable item on your reimbursement, and your reimbursement will be inaccurate.  Are you sure you want to modify it?";
                } else {
                    if (x == "Return Authorization") {
                        q = "You are editing a " + x + " that has already been received. Changing an item that has already been received can affect reimbursement.\n\nClick OK to save your changes on the Return Authorization.\nClick Cancel to go back to the Return Authorization.";
                    } else {
                        if (x == "purchased") {
                            q = "Items on this line have already been ordered. Any modifications will only apply to future purchase orders. Are you sure you want to modify it?";
                        } else {
                            if (x == "received" && selectedItemHasChanged()) {
                                alert("You cannot change the selected item because it has already been " + x + ".");
                                return false;
                            } else {
                                if (x == "requested" && selectedItemHasChanged()) {
                                    alert("You cannot change the item on lines that have already been requested.");
                                    return false;
                                } else {
                                    q = "Items on this line have been " + x + ".  Are you sure you want to modify it?";
                                }
                            }
                        }
                    }
                }
                if (!confirm(q)) {
                    return false;
                }
            }
        }
        if (hasItemMachField("quantityonshipments") && getItemMachValue("quantityonshipments") > 0) {
            if (selectedItemHasChanged()) {
                alert("You cannot change the selected item because it has already been associated with inbound shipment.");
                return false;
            } else {
                var k = parseFloat(getItemMachValue("quantity"));
                var t = parseFloat(getItemMachValue("quantityonshipments"));
                if (k < t) {
                    alert("Item quantity cannot be less than the total quantity used on existing inbound shipments.");
                    item_machine.clearline();
                    return false;
                } else {
                    var d = "Items on this line have been associated with inbound shipment. Are you sure you want to modify it?";
                    if (!confirm(d)) {
                        return false;
                    }
                }
            }
        }
    }
    syncQtyReceived();
    checkItemLineShippingFields();
    var c = taxInclusivePricingHelper.getEditableFieldName("amount");
    if (hasItemMachField(c) && getTransactionType() != "purchreq" && (getItemMachValue(c) == undefined || getItemMachValue(c).length == 0) && getItemType() != "Description" && getItemType() != "Group" && getItemType() != "EndGroup" && getItemType() != "Subtotal" && getItemType() != "SubscriPlan") {
        var g = "mandatory" + c;
        if ((!hasItemMachField(g)) || (getItemMachValue(g) != "F")) {
            alert("Please enter a value for amount.");
            return false;
        }
    }
    if (hasItemMachField("estimatedamount") && getTransactionType() == "purchreq" && (getItemMachValue("estimatedamount") == undefined || getItemMachValue("estimatedamount").length == 0) && getItemType() != "Description" && getItemType() != "Group" && getItemType() != "Subtotal") {
        alert("Please enter a value for estimated amount.");
        return false;
    }
    if (nlapiGetField("total") && hasItemMachField("amount") && getItemType() != "Description" && getItemType() != "Group" && getItemType() != "Subtotal" && (parseFloat(nlapiGetFieldValue("total")) > 1000000000000 || parseFloat(getItemMachValue("amount")) > 1000000000000)) {
        if (!checkMaxTotalLimit("total", "item", "amount")) {
            return false;
        }
    }
    var e = getTransactionType();
    if (e == "salesord" && hasItemMachField("commitinventory")) {
        if (getItemMachValue("commitinventory").length == 0 && (getItemType() == "InvtPart" || getItemType() == "Assembly")) {
            alert("Please enter a value for commit.");
            return false;
        }
    }
    if (e == "workord" && !workOrderConnector.validateLine()) {
        return false;
    }
    var w = taxInclusivePricingHelper.getEditableFieldName("amounthasbeenset");
    var v = getItemMachValue(w) == "T";
    if (getItemType() != "Description" && getItemType() != "Group" && getItemType() != "Subtotal" && v) {
        if (!(e == "blankord" && hasItemMachField("quantityordered") && zeroIfNaN("quantityordered") != 0)) {
            var m = taxInclusivePricingHelper.getEditableFieldName("rate");
            var c = taxInclusivePricingHelper.getEditableFieldName("amount");
            var l = parseFloat(getItemMachValue("quantity"));
            var a = parseFloat(getItemMachValue(m));
            if ((!isNaN(l) && !isNaN(a)) && hasItemMachField(c) && round_currency(parseFloat(getItemMachValue(c))) != round_currency(l * a)) {
                if (!confirm("The line total amount is not equal to the item price times the quantity.  Is this correct?")) {
                    return false;
                }
            }
        }
    }
    var B = parseInt(nlapiGetCurrentLineItemIndex("item"));
    var b = nlapiGetLineItemCount("item") + 1;
    if (B < parseInt(b)) {
        var A = getEncodedValue("item", B, "itemtype");
        if (A == "EndGroup") {
            alert("You cannot edit the end of group line.  You must delete the group.");
            return false;
        } else {
            if (A == "Group") {
                if (getEncodedValue("item", B, "item") != getItemMachValue("item")) {
                    for (var z = B + 1; z < parseInt(b); z++) {
                        if (getEncodedValue("item", z, "itemtype") == "EndGroup") {
                            break;
                        }
                    }
                    Machine_deleteLineItems("item", B, z);
                    setItemMachValue("groupsetup", "");
                } else {
                    if (getEncodedValue("item", B, "quantity") != getItemMachValue("quantity")) {
                        setItemMachValue("groupsetup", "UpdateQty");
                    }
                }
            }
        }
    }
    if (B < parseInt(b) && (getEncodedValue("item", B, "ingroup") == "T" || (B > 1 && (getEncodedValue("item", B - 1, "itemtype") == "Group" || (getEncodedValue("item", B - 1, "ingroup") == "T" && !getEncodedValue("item", B, "itemtype") == "EndGroup"))))) {
        var A = getItemType();
        if (A == "Group") {
            alert("Subgroups not allowed.");
            return false;
        }
    }
    if (getItemType() == "GiftCert") {
        if (hasItemMachField("gcfields")) {
            if (getItemMachValue("giftcertfrom").length == 0 || getItemMachValue("giftcertrecipientname").length == 0 || getItemMachValue("giftcertrecipientemail").length == 0) {
                alert("Gift Certificate From, Recipient Name, and Recipient Email are required.");
                return false;
            }
        }
    }
    if (hasEncodedField("item", "matrixtype") && getItemMachValue("matrixtype") == "PARENT") {
        alert("Please choose a child matrix item.");
        return false;
    }
    if ((e == "salesord" || e == "workord") && hasItemMachField("createpo") && hasItemMachField("createwo") != null && getItemMachValue("createpo").length > 0 && getItemMachValue("createwo") == "T") {
        alert("You can not create a purchase order and a work order for the same line.");
        return false;
    }
    if ((getTransactionType() == "vendbill" || getTransactionType() == "vendcred") && (getItemType() == "InvtPart" || getItemType() == "Assembly") && getItemMachValue("quantity").length > 0 && parseFloat(getItemMachValue("quantity")) == 0 && getItemMachValue("amount").length > 0 && parseFloat(getItemMachValue("amount")) != 0) {
        alert("Inventory and assembly items cannot have zero quantity and non-zero amount.");
        return false;
    }
    if (getItemType() == "SubscriPlan" && (!hasItemMachField("subscription") || getItemMachValue("subscription").length == 0)) {
        alert("You may not use a subscription plan item without choosing a subscription.");
        return false;
    }
    if (hasItemMachField("serialnumbersvalid")) {
        if (getItemMachValue("serialnumbersvalid") == "F") {
            validateInventoryNumbers(true);
            if (getItemMachValue("serialnumbersvalid") == "F") {
                return false;
            }
        }
    }
    if (nlapiGetContext().getExecutionContext() != "virtualbrowser") {
        if (!validateInventoryDetail()) {
            return false;
        }
    }
    if ((e != "workord" && !CheckMinCount()) || !CheckCount()) {
        return false;
    }
    var r = nlapiGetCurrentLineItemIndex("item");
    if (r != null && r > 0 && r <= nlapiGetLineItemCount("item")) {
        addLineToUpdateInitValues(r);
    }
    if ("T" == nlapiGetFieldValue("isonlinetransaction") && getItemType() == "Discount" && !nlapiGetCurrentLineItemValue("item", "custreferralcode")) {
        alert("Discount line can only be added by promotion code.");
        return false;
    }
    if (hasItemMachField(h)) {
        if (e == p && getItemMachValue(h).length == 0 && storePickUpConnector.shouldHaveFulfillmentChoice(getItemType(), getItemMachValue(y))) {
            alert("Please enter a value for Fulfillment Choice.");
            return false;
        }
    }
    if (e == p) {
        var o = getItemMachValue("item");
        var D = hasItemMachField("__isuseraction") && getItemMachValue("__isuseraction") == "T";
        var u = nlapiServerCall("/app/site/backend/validatecatalogitempurchasability.nl", "isItemPurchasable", [o, D]);
        if (!u) {
            alert("This item is no longer available.");
            return false;
        }
    }
    if (!validatePromotions()) {
        return false;
    }
    return true;
}

function validatePromotions() {
    if (typeof promotions !== "undefined") {
        return promotions.machineAdapter.validateLineListener("item");
    }
    return true;
}

function typeDoesNotAllowItemChangeForAlreadyLinked(b, a) {
    if (b == "purchord") {
        return true;
    } else {
        if (b == "vendauth") {
            return true;
        } else {
            if (b != "purchord" && a == "T") {
                return true;
            } else {
                return false;
            }
        }
    }
}

function Item_Machine_postDeleteLine(a, b) {
    if (typeof promotions !== "undefined") {
        promotions.machineAdapter.postDeleteLineListener("item", a);
    }
    if (nlapiGetField("pricingtiers") && 0 == nlapiGetLineItemCount("item")) {
        nlapiSetFieldDisabled("pricingtiers", false);
    }
    if (typeof invalidateTaxes === "function") {
        invalidateTaxes("item");
    }
    return true;
}

function selectedItemHasChanged() {
    var a = nlapiGetLineItemValue("item", "item", nlapiGetCurrentLineItemIndex("item"));
    if (isValEmpty(a)) {
        a = "";
    }
    var b = nlapiGetCurrentLineItemValue("item", "item");
    if (isValEmpty(b)) {
        b = "";
    }
    return (a != b);
}

function fieldOnItemMachineHasChanges(a) {
    var b = nlapiGetLineItemValue("item", a, nlapiGetCurrentLineItemIndex("item"));
    if (isValEmpty(b)) {
        b = "";
    }
    var c = nlapiGetCurrentLineItemValue("item", a);
    if (isValEmpty(c)) {
        c = "";
    }
    return (b != c);
}

function Item_Machine_PostProcessLine(b, c) {
    if (getEncodedValue("item", b, "itemtype") == "Group") {
        if ("UpdateQty" == getEncodedValue("item", b, "groupsetup")) {
            updateGroupQty(getEncodedValue("item", b, "item"), b, getEncodedValue("item", b, "quantity"));
            setEncodedValue("item", b, "groupsetup", "T");
        } else {
            if (!getEncodedValue("item", b, "groupsetup")) {
                InsertGroup(getEncodedValue("item", b, "item"), b, getEncodedValue("item", b, "quantity"));
            }
        }
    }
    if (getTransactionType() == "workord") {
        if (hasItemMachField("operationsequencenumber") && hasItemMachField("operationdisplaytext")) {
            var a = getEncodedValue("item", b, "operationdisplaytext");
            setEncodedValue("item", b, "operationsequencenumber", a);
            setComponentOperation(getComponentId(b), a);
            if (hasItemMachField("plannedissuedate")) {
                setPlannedIssueDateFromSequence(b);
                nlapiRefreshLineItems("item");
            }
        }
        workOrderConnector.postProcessLine(b, c);
    }
    NS.event.dispatchImmediate(NS.event.type.ITEM_POST_PROCESS_LINE, b);
    if (typeof promotions !== "undefined") {
        promotions.machineAdapter.lineCommitListener("item", b);
    }
}

function syncSerialNumberFields() {
    if (hasItemMachField("serialnumbers")) {
        var e = getItemMachValue("item");
        var a = getItemMachValue("isserialitem");
        var b = getItemMachValue("islotitem");
        var c = getTransactionType() == "workord";
        var d = c && hasItemMachField("notinvtcommittable") && getItemMachValue("notinvtcommittable") == "T";
        if (nlapiGetLineItemField("item", "serialnumbers").getType() == "textarea") {
            setItemMachDisabled("serialnumbers", ((d || (a != "T" && b != "T" && !isValEmpty(e))) ? true : false));
            if (!c) {
                setItemMachDisabled("quantity", false);
            }
        } else {
            if (d) {
                setItemMachDisabled("serialnumbers", true);
            } else {
                if (isValEmpty(e)) {
                    setItemMachDisabled("serialnumbers", false);
                    if (!c) {
                        setItemMachDisabled("quantity", false);
                    }
                } else {
                    if (a != "T" && b != "T") {
                        setItemMachDisabled("serialnumbers", true);
                        if (!c) {
                            setItemMachDisabled("quantity", false);
                        }
                    } else {
                        if (a == "T") {
                            if (getItemMachValue("serialnumbers").length > 0 && getItemMachValue("serialnumbers").substring(0, 6) != "<Enter") {
                                setItemMachDisabled("serialnumbers", false);
                            } else {
                                if (!c) {
                                    setItemMachDisabled("quantity", false);
                                }
                                var f = parseFloat(getItemMachValue("quantity"));
                                if (c) {
                                    setItemMachDisabled("serialnumbers", false);
                                }
                            }
                        } else {
                            if (!c) {
                                setItemMachDisabled("quantity", false);
                            }
                            setItemMachDisabled("serialnumbers", false);
                        }
                    }
                }
            }
        }
    }
}

function EnableGiftCertFields() {
    var a = (getItemType() == "GiftCert");
    setItemMachDisabled("gcfields", !a);
    setItemMachDisabled("giftcertfrom", !a);
    setItemMachDisabled("giftcertrecipientname", !a);
    setItemMachDisabled("giftcertrecipientemail", !a);
    setItemMachDisabled("giftcertmessage", !a);
    setItemMachDisabled("giftcertnumber", !a || getItemMachValue("giftcertimmutable") == "T");
    if (a) {
        setItemMachDisabled("quantity", a);
    }
}

function DisableCommitmentFirmField() {
    var a = nlapiGetCurrentLineItemValue("item", "line");
    if (a == "" || a == null) {
        setItemMachDisabled("commitmentfirm", true);
    } else {
        setItemMachDisabled("commitmentfirm", false);
    }
}

function enableDisableOperationSequenceField(a) {
    if (hasItemMachField("operationsequencenumber")) {
        setItemMachDisabled("operationdisplaytext", shouldBeOperationSequenceDisabled(a));
    }
}

function shouldBeOperationSequenceDisabled(a) {
    var b = nlapiGetFieldValue("orderstatus");
    if (b != "A" && b != "B") {
        return true;
    }
    if (isValEmpty(nlapiGetFieldValue("manufacturingrouting")) || nlapiGetFieldValue("operationsequenceeditable") == "F") {
        return true;
    }
    return "Assembly" == getEncodedValue("item", a, "itemtype") && !isAssemblyLeaf(a);
}

function isNonInvtItemAccruable() {
    var c = getItemType;
    var b = getItemSubType();
    var a = getItemMachValue("fulfillable");
    return ("NonInvtPart == itemType" || "OthCharge" == c || "Service" == c) && ("Purchase" == b || "Resale" == b) && "T" == a;
}

function disableGenerateAccurals() {
    if (getTransactionType() == "purchord" && hasItemMachField("generateaccruals")) {
        setItemMachDisabled("generateaccruals", isLineLinked() || !isNonInvtItemAccruable());
    }
}

function disableAmortizationScheduleFields() {
    if (getTransactionType() == "vendbill" && hasItemMachField("amortizationsched") && hasItemMachField("generateaccruals")) {
        if (isNonInvtItemAccruable() && parseInt(getItemMachValue("orderdoc")) > -1 && getItemMachValue("generateaccruals") == "T" && getItemMachValue("islinkedtodropshippoline") != "T") {
            setItemMachDisabled("amortizationsched", true);
            setItemMachValue("amortizationsched", "");
            setItemMachDisabled("amortizstartdate", true);
            setItemMachValue("amortizstartdate", "");
            setItemMachDisabled("amortizationenddate", true);
            setItemMachValue("amortizationenddate", "");
            setItemMachDisabled("amortizationresidual", true);
            setItemMachValue("amortizationresidual", "");
        }
    }
}

function getComponentId(a) {
    var b = getEncodedValue("item", a, "component");
    return b === null ? getEncodedValue("item", a, "bomrevisioncomponent") : b;
}

function getOperationSequence(a) {
    return getEncodedValue("item", a, "operationsequencenumber");
}

function setOperationSequence(a, b) {
    setEncodedValue("item", a, "operationdisplaytext", b);
    setEncodedValue("item", a, "operationsequencenumber", b);
}

function getAssemblyLevel(a) {
    return parseInt(getEncodedValue("item", a, "assemblylevel"));
}

function isAssemblyRoot(a) {
    return getAssemblyLevel(a) == 1;
}

function isAssemblyLeaf(a) {
    if (a < nlapiGetLineItemCount("item")) {
        return getAssemblyLevel(a) >= getAssemblyLevel(a + 1);
    } else {
        return true;
    }
}

function findRootLineOf(a) {
    for (var b = a; b >= 1; b--) {
        if (isAssemblyRoot(b)) {
            return b;
        }
    }
    return 1;
}

function Item_Machine_ValidateDelete() {
    if (itemHasEncodedField("linked")) {
        var h = getTransactionType();
        if (getItemMachValue("linked") == "T") {
            var a = (h == "purchord" || h == "rtnauth" ? "received" : (h == "salesord" || h == "trnfrord" || h == "vendauth" ? "fulfilled" : "reimbursed"));
            var k;
            if (h == "blankord") {
                k = "There are Purchase Order lines linked to this line. Are you sure you want to delete it?";
                if (!confirm(k)) {
                    return false;
                }
            } else {
                if (h == "workord") {
                    if (isItemSourcedFromTransaction()) {
                        alert("The line cannot be deleted because it has a special order associated with it. First, delete the special order and retry.");
                        return false;
                    }
                    if (parseFloat(getItemMachValue("quantityfulfilled")) != 0) {
                        alert("Items in this line have already been used in the build. To delete this line, first delete the corresponding transactions.");
                        return false;
                    }
                    return true;
                } else {
                    if (a == "reimbursed") {
                        k = "Items on this line have been reimbursed. If you delete it: you will change this bill, the item will no longer appear as a billable item on your reimbursement, and your reimbursement will be inaccurate.  Are you sure you want to delete it?";
                        if (!confirm(k)) {
                            return false;
                        }
                    } else {
                        if (hasItemMachField("quantitylocked") && getItemMachValue("quantitylocked") > 0) {
                            alert("You cannot delete a line item associated with a wave transaction.");
                            return false;
                        } else {
                            alert("Items on this line have been " + a + ".  If you wish to delete the line, you must first delete the corresponding line(s) in the associated transaction(s).");
                            return false;
                        }
                    }
                }
            }
        }
        if (getItemMachValue("quantityonshipments") > 0) {
            alert("Items on this line have been associated with inbound shipment. If you wish to delete the line, you must first delete the corresponding line(s) in the associated record(s).");
            return false;
        }
    }
    if (getTransactionType() == "workord") {
        if (isLineLinked() || isOrderFinished()) {
            alert("This line cannot be removed.");
            return false;
        }
    }
    var d = parseInt(nlapiGetCurrentLineItemIndex("item"));
    var f = getEncodedItemValue(d, "itemtype");
    if (f != null && f == "EndGroup") {
        alert("You cannot delete the end of group line.  You must delete the group.");
        return false;
    }
    if (f == "Group" && getEncodedItemValue(d, "includegroupwrapper") == "T") {
        for (var c = d + 1; c < parseInt(nlapiGetLineItemCount("item") + 1); c++) {
            if (getEncodedValue("item", c, "itemtype") == "EndGroup") {
                break;
            }
        }
        Machine_deleteLineItems("item", d, c);
    }
    NS.event.dispatchImmediate(NS.event.type.ITEM_VALIDATE_DELETE);
    if (hasEncodedItemValue(d, "oqpbucket")) {
        var g = getEncodedItemValue(d, "oqpbucket");
        bucketsDeleted[bucketsDeleted.length + 1] = g;
    }
    if (typeof om !== "undefined" && om.promotions) {
        om.promotions.logger.promotionsLogger.addToContext({
            flowTrace: "Possible call to Promotions Engine due to deletion of items in ItemMachine"
        });
    }
    nlapiSetFieldValue("doshippingrecalc", "T");
    if (typeof promotions !== "undefined") {
        promotions.machineAdapter.validateDeleteListener("item");
    }
    var b = getItemMachValue("purchasecontract");
    var e = getItemMachValue("contractdetails");
    if (!isValEmpty(b) && !isValEmpty(e)) {
        calculateContractRateForAllLines(b, e, false, true);
    }
    return true;
}

function Item_Machine_Sync_QtyReceived() {
    var b;
    if (hasEncodedField("item", "quantityreceived")) {
        b = "quantityreceived";
    } else {
        if (hasEncodedField("item", "quantityfulfilled")) {
            b = "quantityfulfilled";
        } else {
            return;
        }
    }
    var c = parseInt(nlapiGetCurrentLineItemIndex("item"));
    var e = parseFloat(getItemMachValue("quantity"));
    var d = parseFloat(getEncodedValue("item", c, "quantity"));
    var g = parseFloat(getItemMachValue(b));
    if (!isNaN(e) && !isNaN(d) && !isNaN(g) && e != d) {
        setItemMachValue(b, g == d ? e : g + e - d);
    }
    if (hasEncodedField("item", "percentcomplete")) {
        var a = parseFloat(getItemMachValue("quantityordered"));
        var f = parseFloat(getItemMachValue(b));
        if (!isNaN(a) && a != 0 && !isNaN(f)) {
            setItemMachValue("percentcomplete", f / a * 100 + "%");
        }
    }
}

function Item_Machine_Dont_Sync_QtyReceived() {}

function CheckRevRecSchedule() {
    if (!hasItemMachField("revrec_defrevacct")) {
        return;
    }
    var d = (getItemMachValue("hasimmutablerevrec") == "T");
    var h = (getItemMachValue("isfullyrecogrevrec") == "T");
    var a = (getItemMachValue("revrec_defrevacct") != "");
    var f = (getTransactionType() == "salesord");
    var b = hasItemMachField("amortizationtype") && getItemMachValue("amortizationtype") == "VARIABLE";
    var e = b || (!f && ((getItemMachValue("revrec_recurrencetype") == "SOREVRECDATES") || d));
    var c = (hasItemMachField("revrecterminmonths") && !nlapiGetLineItemField("item", "revrecterminmonths").isHidden());
    var g = (!a || (!f && d));
    setItemMachDisabled("revrecschedule", g);
    if (hasItemMachField("revrecstartdate")) {
        setItemMachDisabled("revrecstartdate", e);
    }
    if (hasItemMachField("revrecenddate")) {
        setItemMachDisabled("revrecenddate", e || c);
    }
    if (hasItemMachField("deferrevrec")) {
        setItemMachDisabled("deferrevrec", !a || h);
    }
    if (hasItemMachField("catchupperiod")) {
        setItemMachDisabled("catchupperiod", !a || h || b);
        if (!a || h || b) {
            setItemMachValue("catchupperiod", null);
        }
    }
    if (hasItemMachField("revrecterminmonths")) {
        setItemMachDisabled("revrecterminmonths", b);
    }
}

function validateItemChangeWithOldRevrecSchedule() {
    if ((getTransactionType() == "custcred" || getTransactionType() == "custinvc" || getTransactionType() == "cashsale" || getTransactionType() == "cashrfnd") && nlapiGetContext().getFeature("REVENUERECOGNITION") && nlapiGetCurrentLineItemValue("item", "item") != nlapiGetCurrentLineItemValue("item", "olditemid") && nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != null && nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != "" && nlapiGetCurrentLineItemValue("item", "oldrevrecschedule") != nlapiGetCurrentLineItemValue("item", "oldrevrectemplate")) {
        alert("You cannot change the item on this line because it has an existing revenue schedule. Delete the line, and enter a new line to correct the item.");
        return false;
    }
    return true;
}

function Item_Machine_synclinefields(b) {
    if (!b) {
        b = parseInt(nlapiGetCurrentLineItemIndex("item"));
    }
    restoreFieldDisableStatus();
    if (hasItemMachField("price")) {
        var a = getItemMachValue("price") != "-1";
        var c = taxInclusivePricingHelper.getEditableFieldName("rate");
        setItemMachDisabled(c, a);
    }
    if (hasItemMachField("createpo")) {
        syncPOFields();
    }
    if (hasItemMachField("location") && !useInventoryLocationForFulfillment()) {
        setItemMachDisabled("location", getItemMachValue("islinefulfilled") == "T");
    }
    if (hasItemMachField("inventorylocation")) {
        setItemMachDisabled("inventorylocation", getInventoryLocationFieldDisableCondition());
    }
    syncCommitInventory();
    if (hasItemMachField("isclosed")) {
        setItemMachDisabled("isclosed", getItemMachValue("groupclosed") == "T" && getItemMachValue("itemtype") != "Group");
    }
    if (hasItemMachField("createwo")) {
        syncWOField();
    }
    if (getTransactionType() == "workord") {
        syncWorkOrderFields();
    }
    if (getTransactionType() == "purchord" && nlapiGetContext().getFeature("OUTSOURCEDMFG") && !isValEmpty(nlapiGetFieldValue("id"))) {
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
    enableDisableOperationSequenceField(b);
    NS.event.dispatchImmediate(NS.event.type.ITEM_SYNC_LINE_FIELDS);
    storePickUpConnector.enableDisableFulfillmentChoiceField("itemfulfillmentchoice");
    storePickUpConnector.enableDisableExcludeRateRequestField("itemfulfillmentchoice", "excludefromraterequest");
    autoLocationAssignmentModule.updateNoAutoAssignLocationWhenFulfillmentChoiceChange();
    disableGenerateAccurals();
    disableAmortizationScheduleFields();
    setupLineFieldMandatoryFlag();
    disableLineFieldsWhenOrderLineInWave();
    emptySupplyRequiredByDateOnCreate();
}

function getInventoryLocationFieldDisableCondition() {
    switch (getTransactionType()) {
        case "vendbill":
            return true;
        default:
            return getItemMachValue("islinefulfilled") === "T";
    }
}

function disableLineFieldsWhenOrderLineInWave() {
    if (getItemMachValue("quantitylocked") > 0) {
        if (hasItemMachField("item")) {
            setItemMachDisabled("item", true);
        }
        if (hasItemMachField("location") && !useInventoryLocationForFulfillment()) {
            setItemMachDisabled("location", true);
        }
        if (hasItemMachField("inventorylocation")) {
            setItemMachDisabled("inventorylocation", true);
        }
        if (hasItemMachField("units")) {
            setItemMachDisabled("units", true);
        }
    }
}

function setupLineFieldMandatoryFlag() {
    if (!hasLegacyMachine()) {
        return;
    }
    for (var c = 0; c < item_machine.form_elems.length; c++) {
        var b = item_machine.form_elems[c];
        var a = "mandatory" + b;
        if (nlapiGetLineItemField("item", a, 0)) {
            nlapiSetLineItemMandatory("item", b, nlapiGetCurrentLineItemValue("item", a) == "T");
        }
    }
}

function syncExcludeFromRateRequest() {
    if (hasItemMachField("excludefromraterequest")) {
        var a = nlapiGetCurrentLineItemIndex("item");
        nlapiSetLineItemDisabled("item", "excludefromraterequest", isExcludeFromRateRequestDisabledInCurrentLine(), a);
    }
}

function syncAllocationStrategyWithItemType() {
    var c = nlapiGetCurrentLineItemValue("item", "itemtype");
    if (c == "") {
        return;
    }
    var b = ("InvtPart" == c || "Kit" == c || "Assembly" == c) && hasItemMachField("orderallocationstrategy");
    var a = nlapiGetCurrentLineItemIndex("item");
    if (b) {
        nlapiSetLineItemDisabled("item", "orderallocationstrategy", false, a);
    } else {
        nlapiSetLineItemDisabled("item", "orderallocationstrategy", true, a);
    }
}

function emptySupplyRequiredByDateOnCreate() {
    if (getTransactionType() == "workord" && nlapiGetCurrentLineItemValue("item", "itemtype") == "") {
        nlapiSetCurrentLineItemValue("item", "requesteddate", "", true);
        nlapiSetCurrentLineItemValue("item", "expectedshipdate", "", true);
    }
}

function setAllocationStrategy() {
    var b = nlapiGetCurrentLineItemValue("item", "itemtype");
    if (b == "") {
        return;
    }
    var a = ("InvtPart" == b || "Kit" == b || "Assembly" == b) && hasItemMachField("orderallocationstrategy");
    if (a) {
        if ("salesorder" == nlapiGetRecordType() && nlapiGetFieldValue("defaultcustomerallocationstrategy") != "") {
            nlapiSetCurrentLineItemValue("item", "orderallocationstrategy", nlapiGetFieldValue("defaultcustomerallocationstrategy"));
        } else {
            nlapiSetCurrentLineItemValue("item", "orderallocationstrategy", nlapiGetCurrentLineItemValue("item", "defaultorderallocationstrategy"));
        }
    } else {
        nlapiSetCurrentLineItemValue("item", "orderallocationstrategy", "");
    }
}

function syncWithAllocationStrategyChange() {
    if (!nlapiGetContext().getFeature("SUPPLYALLOCATION")) {
        return;
    }
    if ("workorder" == nlapiGetRecordType()) {
        var c = false;
        if (itemMachCurrentLineValueNotEmpty("item") && itemMachCurrentLineValueNotEmpty("orderallocationstrategy")) {
            c = true;
        } else {
            for (var b = 1; b <= nlapiGetLineItemCount("item"); b++) {
                if (!isValEmpty(nlapiGetLineItemValue("item", "orderallocationstrategy", b))) {
                    c = true;
                    break;
                }
            }
        }
        if (c) {
            nlapiSetFieldMandatory("requesteddate", true);
        } else {
            nlapiSetFieldMandatory("requesteddate", false);
        }
    } else {
        if (!itemMachCurrentLineValueNotEmpty("item")) {
            return;
        }
        var a = nlapiGetCurrentLineItemIndex("item");
        if (itemMachCurrentLineValueNotEmpty("orderallocationstrategy")) {
            if (nlapiGetLineItemField("item", "expectedshipdate", a) != null) {
                nlapiSetLineItemDisabled("item", "expectedshipdate", true, a);
            }
            if (nlapiGetLineItemField("item", "requesteddate", a) != null) {
                nlapiSetLineItemDisabled("item", "requesteddate", false, a);
            }
        } else {
            if (nlapiGetLineItemField("item", "expectedshipdate", a) != null) {
                nlapiSetLineItemDisabled("item", "expectedshipdate", false, a);
            }
            if ("Group" == nlapiGetCurrentLineItemValue("item", "itemtype") || "EndGroup" == nlapiGetCurrentLineItemValue("item", "itemtype")) {
                if (nlapiGetLineItemField("item", "expectedshipdate", a) != null) {
                    nlapiSetLineItemDisabled("item", "expectedshipdate", true, a);
                }
                if (nlapiGetLineItemField("item", "requesteddate", a) != null) {
                    nlapiSetLineItemDisabled("item", "requesteddate", true, a);
                    nlapiSetCurrentLineItemValue("item", "requesteddate", "");
                }
            }
        }
    }
}

function disableOrderPriorityForSalesChannel() {
    if (!hasItemMachField("orderpriority") || !nlapiGetContext().getFeature("SALESCHANNELALLOCATION")) {
        return;
    }
    var a = nlapiGetFieldValue("saleschannelorderpriority");
    if ("salesorder" == nlapiGetRecordType() && ("InvtPart" == nlapiGetCurrentLineItemValue("item", "itemtype") || "Assembly" == nlapiGetCurrentLineItemValue("item", "itemtype")) && !isValEmpty(a)) {
        nlapiSetLineItemDisabled("item", "orderpriority", true, nlapiGetCurrentLineItemIndex("item"));
    } else {
        nlapiSetLineItemDisabled("item", "orderpriority", false, nlapiGetCurrentLineItemIndex("item"));
    }
}

function checkCommitmentConfirmed() {
    if (nlapiGetCurrentLineItemValue("item", "commitmentfirm") == "T" && nlapiGetCurrentLineItemValue("item", "oldcommitmentfirm") == "T") {
        alert("Note that allocation for this line is Commitment Confirmed and will not be reallocated based on changes you are making on this line. To reallocate supply based on your changes, you must clear the Commitment Confirmed box for this line before you save the form.");
    }
}

function checkAnyLineCommitmentConfirmed() {
    for (var a = 1; a <= nlapiGetLineItemCount("item"); a++) {
        if (nlapiGetLineItemValue("item", "commitmentfirm", a) == "T" && nlapiGetLineItemValue("item", "oldcommitmentfirm", a) == "T") {
            alert("Note that allocation is Commitment Confirmed for one or more component lines and will not be reallocated based on changes you are making to the Supply Required By Date. To reallocate supply of the component lines based on your change, you must clear the Commitment Confirmed box for the component line(s) before you save the form.");
        }
    }
}

function isExcludeFromRateRequestDisabledInCurrentLine() {
    var c = nlapiGetCurrentLineItemValue("item", "itemtype");
    var d = nlapiGetRecordType();
    var a = "InvtPart" != c && "Assembly" != c;
    var b = "estimate" != d && "salesorder" != d && "cashsale" != d && "invoice" != d;
    return a || b;
}

function setPrintFieldDefaultValue() {
    if (getItemType() != "Group" && getItemType() != "EndGroup" && getItemType() != "Assembly" && getItemType() != "Kit" && getItemMachValue("ingroup") != "T" && getItemMachValue("noprint") != null) {
        setItemMachValue("noprint", "F");
    }
}
var item_machine_fieldDisabled = null;

function restoreFieldDisableStatus() {
    var e = taxInclusivePricingHelper.getEditableFieldName("amount");
    var a = ["item", "quantity", "rate", e, "units", "class", "department", "location", "inventorylocation", "isclosed", "matchbilltoreceipt", "billreceipts", "subscription", "taxcode"];
    if (null == item_machine_fieldDisabled) {
        item_machine_fieldDisabled = {};
        for (c = 0; c < a.length; c++) {
            item_machine_fieldDisabled[a[c]] = getItemMachDisabled(a[c]);
        }
    }
    for (var c = 0; c < a.length; c++) {
        var b = a[c];
        if (hasItemMachField(b)) {
            var d = item_machine_fieldDisabled[b] || false;
            setItemMachDisabled(b, d);
        }
    }
}

function disableFieldsIfWorkOrderIsCreated() {
    var b = getItemMachValue("createdoutsourcedwokey");
    var e = getItemMachValue("isclosed") === "T";
    var d = !isValEmpty(b);
    var a = ["assembly", "billofmaterials", "billofmaterialsrevision", "productionstartdate", "productionenddate", "createoutsourcedwo", "item", "location"];
    for (var c = 0; c < a.length; c++) {
        if (hasItemMachField(a[c])) {
            setItemMachDisabled(a[c], d);
        }
    }
    if (d && e) {
        setItemMachDisabled("isclosed", true);
        if (hasItemMachField("quantity")) {
            setItemMachDisabled("quantity", true);
        }
    }
}

function setRevisionIfDifferent() {
    var a = getItemMachValue("billofmaterialsrevisionbyproductiondate");
    var b = getItemMachValue("billofmaterialsrevision");
    if (a != b) {
        nlapiSetCurrentLineItemValue("item", "billofmaterialsrevision", a);
    }
}

function setRevisionByProductionDateIfNotSet() {
    var a = getItemMachValue("billofmaterialsrevisionbyproductiondate");
    var b = getItemMachValue("billofmaterialsrevision");
    if (isValEmpty(b) && !isValEmpty(a)) {
        nlapiSetCurrentLineItemValue("item", "billofmaterialsrevision", a);
    }
}

function setRevisionByCurrentDateIfNotSet() {
    var a = getItemMachValue("billofmaterialsrevisionbycurrentdate");
    var b = getItemMachValue("billofmaterialsrevision");
    if (isValEmpty(b) && !isValEmpty(a)) {
        nlapiSetCurrentLineItemValue("item", "billofmaterialsrevision", a);
    }
}

function forceItemValueIfNew(c) {
    var b = getItemMachValue("item");
    var a = getItemMachValue("assembly");
    if (c != b && !isValEmpty(a)) {
        nlapiSetCurrentLineItemValue("item", "item", b);
    }
}

function syncVendorBillVariancePosted() {
    var c = getItemMachValue("billvariancestatusallbook") == "T";
    var b = ["quantity", "rate", "amount", "units", "class", "department", "location", "isclosed", "billreceipts"];
    for (var d = 0; d < b.length; d++) {
        if (hasItemMachField(b[d])) {
            var a = getItemMachDisabled(b[d]);
            setItemMachDisabled(b[d], a || c);
        }
    }
    if (hasItemMachField("matchbilltoreceipt")) {
        var e = hasItemMachField("quantitybilled") ? getItemMachValue("quantitybilled") > 0 : false;
        var f = hasItemMachField("isdropshiporderline") ? getItemMachValue("isdropshiporderline") == "T" : false;
        setItemMachDisabled("matchbilltoreceipt", a || c || e || f || (getItemType() != "InvtPart" && getItemType() != "Assembly"));
    }
    if (hasItemMachField("billreceipts")) {
        a = getItemMachDisabled("billreceipts");
        setItemMachDisabled("billreceipts", a || getItemMachValue("allowbilltoreceiptmatching") != "T");
    }
}

function syncThreeWayMatchingFields() {
    if (hasItemMachField("matchbilltoreceipt")) {
        var a = getItemMachValue("isdropshiporderline") == "T" || (getItemType() != "InvtPart" && getItemType() != "Assembly");
        setItemMachDisabled("matchbilltoreceipt", a);
        if (a) {
            setItemMachValue("matchbilltoreceipt", "");
        }
    }
    if (hasItemMachField("billreceipts")) {
        setItemMachDisabled("billreceipts", getItemMachValue("allowbilltoreceiptmatching") != "T");
    }
}

function syncLandedCostFields() {
    if (hasItemMachField("landedcostcategory") && hasItemMachField("linkedlandedcost")) {
        setItemMachDisabled("landedcostcategory", getItemMachValue("linkedlandedcost") == "T");
    }
}

function disableWipWorkOrder() {
    var a = getOrderStatus();
    return nlapiGetFieldValue("iswip") == "T" && a != "A" && a != "B" && a != "D";
}

function shouldDisableWorkOrderFields() {
    return isLineLinked() || isOrderFinished() || disableWipWorkOrder();
}

function syncWorkOrderFields() {
    var b = nlapiGetFieldValue("iswip") == "T";
    var n = nlapiGetFieldValue("usecomponentyield") == "T";
    var a = getOrderStatus();
    var f = a == "D";
    var g = isOrderFinished();
    var m = isItemSourcedFromTransaction();
    var k = b && a != "A" && a != "B" && !f;
    setItemMachDisabled("item", isLineLinked() || g || k);
    setItemMachDisabled("units", isLineLinked() || g || k);
    setItemMachDisabled("quantity", g || m || k || n);
    setItemMachDisabled("componentyield", g || m || !n);
    setItemMachDisabled("bomquantity", g || m || !n);
    var d = parseInt(nlapiGetCurrentLineItemIndex("item"), 10);
    var j = getAssemblyLevel(d);
    var h = false;
    for (var l = d + 1; l <= nlapiGetLineItemCount("item") && getAssemblyLevel(l) > j; l++) {
        if (parseFloatOrZero(nlapiGetLineItemValue("item", "quantityfulfilled", l)) > 0) {
            h = true;
            break;
        }
    }
    setItemMachDisabled("itemsource", m || (parseFloatOrZero(getItemMachValue("quantityfulfilled")) > 0) || h);
    if (!hasItemMachField("notinvtcommittable") || getItemMachValue("notinvtcommittable") == "F") {
        return;
    }
    var e = [];
    var c = 0;
    e[c++] = "commitinventory";
    e[c++] = "options";
    e[c++] = "createpo";
    for (c = 0; c < e.length; c++) {
        if (hasItemMachField(e[c])) {
            setItemMachDisabled(e[c], true);
        }
    }
}

function syncComponentYieldQuantity() {
    if (itemMachCurrentLineValueNotEmpty("componentyield") && itemMachCurrentLineValueNotEmpty("bomquantity")) {
        setItemMachValue("quantity", getComponentYieldQuantity());
    }
}

function getComponentYieldQuantity() {
    var c = parseFloat(nlapiGetCurrentLineItemValue("item", "bomquantity"));
    var b = parseFloat(nlapiGetCurrentLineItemValue("item", "componentyield"));
    var a = nlapiGetCurrentLineItemValue("item", "roundupascomponent") == "T";
    return calculateQuantityWithComponentYield(c, b, a);
}

function calculateQuantityWithComponentYield(d, c, b) {
    var a = d * 100 / c;
    a = (b ? Math.ceil(a) : round_float_to_n_places(a, 5));
    return a;
}

function syncTransferOrderFields() {
    if (getTransactionType() == "trnfrord") {
        if (nlapiGetFieldValue("useitemcostastransfercost") == "F") {
            setItemMachDisabled("rate", getItemMachValue("linked") == "T");
            setItemMachDisabled("amount", getItemMachValue("linked") == "T");
        }
        setItemMachDisabled("quantity", getItemMachValue("linked") == "T");
        setItemMachDisabled("units", getItemMachValue("linked") == "T");
        setItemMachDisabled("serialnumbers", getItemMachValue("linked") == "T");
    }
}

function checkClosable() {
    if (getTransactionType() == "trnfrord") {
        var b = getOrderStatus();
        var a = nlapiGetCurrentLineItemValue("item", "isclosed");
        if (a == "T" && nlapiGetCurrentLineItemValue("item", "quantityreceived") != nlapiGetCurrentLineItemValue("item", "quantityfulfilled")) {
            alert("Transfer order lines cannot be closed when there are remaining quantities to be received.");
            return false;
        }
        if (a == "T" && nlapiGetContext().getFeature("PICKPACKSHIP") && getItemMachValue("quantitypicked") != getItemMachValue("quantityfulfilled") && (b == "B" || b == "D" || b == "E")) {
            alert("A line on a transfer order cannot be closed if any quantity is already picked but not yet received.");
            return false;
        }
    }
    return true;
}

function checkClosableIS() {
    if (nlapiGetCurrentLineItemValue("item", "isclosed") == "T" && nlapiGetCurrentLineItemValue("item", "closeenabled") == "F") {
        alert("Purchase order line cannot be closed when there are opened inbound shipments.");
        return false;
    }
    return true;
}

function checkLinkedInboundShipment() {
    if (parseFloatOrZero(nlapiGetCurrentLineItemValue("item", "quantityonshipments")) > 0) {
        alert("You cannot change the unit on the line associated with inbound shipment.");
        return false;
    }
    return true;
}

function syncProjectFields() {
    var b = hasItemMachField("linkedrevrec") && getItemMachValue("linkedrevrec") == "T";
    if (hasItemMachField("fromjob")) {
        var a = getItemMachValue("fromjob") == "T";
        setItemMachDisabled("job", a || b);
        setItemMachDisabled("item", a);
        setItemMachDisabled("quantity", a);
        setItemMachDisabled("units", a);
        setItemMachDisabled("price", a);
        if (a) {
            setItemMachDisabled("rate", a);
        }
        var d = taxInclusivePricingHelper.getEditableFieldName("amount");
        setItemMachDisabled(d, a);
        if (hasItemMachField("billingscheduletype")) {
            var c = getItemMachValue("fromjob") == "T";
            setItemMachDisabled("billingschedule", c);
        }
    } else {
        setItemMachDisabled("job", b);
    }
}

function syncCommitInventory() {
    if (hasItemMachField("commitinventory")) {
        var a = getItemType();
        setItemMachDisabled("commitinventory", a != "InvtPart" && a != "Assembly");
    }
}

function closeRemaining() {
    var b = nlapiGetLineItemCount("item");
    for (var a = 1; a <= b; a++) {
        if (getEncodedValue("item", a, "isopen") == "T") {
            setEncodedValue("item", a, "isclosed", "T");
        }
    }
    if (hasLegacyMachine()) {
        item_machine.buildtable();
    }
    a = parseInt(nlapiGetCurrentLineItemIndex("item"));
    if (a < b && getItemMachValue("isopen") == "T") {
        setItemMachValue("isclosed", "T");
    }
    NS.form.setChanged(true);
}

function popupScheduleDiv(f, c) {
    if (f == null || f.length == 0) {
        return;
    }
    var d = document.getElementById("ScheduleInlineDIV");
    if (d == null) {
        d = document.createElement("div");
        d.style.border = "1px solid black";
        d.style.position = "absolute";
        d.style.padding = "0px";
        d.onclick = function() {
            document.getElementById("ScheduleInlineDIV").style.display = "none";
            return false;
        };
        d.id = "ScheduleInlineDIV";
        d.className = "bglt";
        d.style.display = "none";
        d.style.zIndex = 1000;
        document.body.appendChild(d);
    }
    var a = f.split(String.fromCharCode(5));
    var e = "<table border=0 cellpadding=0 cellspacing=0>";
    var b;
    for (b = 0; b < a.length; b += 2) {
        e += "<tr><td class=text align=right>" + a[b] + "</td><td class=text>&nbsp;</td><td class=text align=right>" + a[b + 1] + "</td></tr>";
    }
    d.innerHTML = e;
    d.style.left = findPosX(c) + "px";
    d.style.top = findPosY(c) + c.offsetHeight + "px";
    d.style.display = "";
    addDivToClose("ScheduleInlineDIV");
}

function Item_Machine_doCheckMandatoryData(c, b) {
    if (c.substring(0, 4) != "cust") {
        return true;
    }
    var a = getEncodedValue("item", b, "itemtype");
    if (a == "EndGroup") {
        return false;
    }
    if (a != "Group") {
        return true;
    }
    var d = splitIntoCells(nlapiGetFieldValue("itemflags"));
    if ((d[this.getArrayPosition(c)] & 16) == 0) {
        return (getEncodedValue("item", b, "groupsetup") != "T");
    }
    return true;
}

function showAllInventoryLevelWarnings(a) {
    var n = "";
    for (var d = 1; d < parseInt(nlapiGetLineItemCount("item") + 1); d++) {
        var b = getEncodedValue("item", d, "itemtype");
        var c = (hasEncodedField("item", "createpo") ? getEncodedValue("item", d, "createpo") : "");
        var m = (hasEncodedField("item", "createwo") ? getEncodedValue("item", d, "createwo") : "F");
        var e = !getEncodedValue("item", d, "notinvtcommittable") || getEncodedValue("item", d, "notinvtcommittable") == "F";
        if ((b == "InvtPart" || b == "Assembly" || b == "Kit") && !(c == "DropShip" || c == "SpecOrd") && m != "T" && e) {
            var k = parseFloat(getEncodedValue("item", d, "quantityavailable"));
            if (isNaN(k) && b != "Kit") {
                k = 0;
            }
            if (k < parseFloat(getEncodedValue("item", d, "quantity"))) {
                var j = 0;
                if (a == true) {
                    var g = getItemMachField("location") != null ? getItemMachField("location") : nlapiGetField("location");
                    if (g != null) {
                        j = useInventoryLocationForFulfillment() ? (getItemMachField("inventorylocation") != null ? getItemMachField("inventorylocation") : 0) : (getItemMachField("location") != null ? getEncodedValue("item", d, "location") : nlapiGetFieldValue("location"));
                        if (j == "" || j == "undefined") {
                            j = 0;
                        }
                    } else {
                        a = false;
                    }
                }
                var l = nlapiGetLineItemText("item", "item", d);
                var f = "";
                if (getItemMachField("units_display") != null) {
                    f = (nlapiGetLineItemValue("item", "units_display", d).length > 0) ? (" " + nlapiGetLineItemValue("item", "units_display", d)) : "";
                }
                var h = getShowedWarningId(getEncodedValue("item", d, "item"), j, f);
                if (showedOnHandWarning[h] == null) {
                    showedOnHandWarning[h] = "true";
                    n += getOnHandWarningMessage(j, a, b, l, k, f, getEncodedValue("item", d, "backordered"), getEncodedValue("item", d, "onorder")) + "\n";
                }
            }
        }
    }
    if (n != "") {
        alert(n);
    }
}

function initializeExpectedShipmentDate() {
    var a = getItemMachValue("expectedshipdate");
    if (!isValEmpty(a) || "Group" == nlapiGetCurrentLineItemValue("item", "itemtype")) {
        return;
    }
    var b = getDefaultExpectedShipmentDate();
    setItemMachValue("expectedshipdate", b);
}

function getDefaultExpectedShipmentDate() {
    var a = nlapiGetFieldValue("shipdate");
    if (isValEmpty(a)) {
        a = nlapiGetFieldValue("trandate");
    }
    return a;
}

function initializeExpectedShipmentDateForGroup(e, a) {
    var d = getDefaultExpectedShipmentDate();
    for (var b = e; b < a; b++) {
        var c = nlapiGetLineItemValue("item", "expectedshipdate", b);
        if (isValEmpty(c)) {
            if ((nlapiGetContext().getFeature("MRPORDEMANDPLAN") || nlapiGetContext().getFeature("SUPPLYALLOCATION")) && getTransactionType() != "opprtnty" && getTransactionType() != "estimate" && !nlapiGetContext().getFeature("AVAILABLETOPROMISE")) {
                nlapiSetLineItemValue("item", "expectedshipdate", b, d);
            }
        }
    }
}

function setDefaultExpectedReceiptDate() {
    var a = getTransactionType() == "purchord" ? nlapiGetFieldValue("trandate") : getItemMachValue("expectedshipdate");
    var b = nlapiStringToDate(a);
    if (b != null) {
        var c = isValEmpty(getItemMachValue("leadtime")) ? 0 : getItemMachValue("leadtime");
        setItemMachValue("expectedreceiptdate", nlapiDateToString(nlapiAddDays(b, c)));
    }
}

function setDefaultExpectedReceiptDateForGroup(f, b) {
    for (var c = f; c < b; c++) {
        var a = getTransactionType() == "purchord" ? nlapiGetFieldValue("trandate") : nlapiGetLineItemValue("item", "expectedshipdate", c);
        var d = nlapiStringToDate(a);
        if (d != null) {
            var e = isValEmpty(nlapiGetLineItemValue("item", "leadtime", c)) ? 0 : nlapiGetLineItemValue("item", "leadtime", c);
            nlapiSetLineItemValue("item", "expectedreceiptdate", c, nlapiDateToString(nlapiAddDays(d, e)));
        }
    }
}

function initializeOrderAllocationStrategyForGroup(c, a) {
    for (var b = c; b < a + 1; b++) {
        var e = nlapiGetLineItemValue("item", "itemtype", b);
        var d = ("InvtPart" == e || "Kit" == e || "Assembly" == e) && hasItemMachField("orderallocationstrategy");
        if (d) {
            if ("salesorder" == nlapiGetRecordType() && nlapiGetFieldValue("defaultcustomerallocationstrategy") != "") {
                nlapiSetLineItemValue("item", "orderallocationstrategy", b, nlapiGetFieldValue("defaultcustomerallocationstrategy"));
            } else {
                nlapiSetLineItemValue("item", "orderallocationstrategy", b, nlapiGetLineItemValue("item", "defaultorderallocationstrategy", b));
            }
        } else {
            nlapiSetLineItemValue("item", "orderallocationstrategy", b, "");
            nlapiSetLineItemDisabled("item", "orderallocationstrategy", true, b);
        }
    }
}

function allLinesAreDiscountOrMarkupAfterSubtotal(b) {
    for (var c = b; c > 0; c--) {
        var a = getEncodedValue("item", c, "itemtype");
        if (a == "Subtotal") {
            break;
        }
        if (a != "Discount" && a != "Markup") {
            return false;
        }
    }
    return true;
}

function nlapiSetCurrentLineItemValueIfChanged(a, c, b) {
    if (nlapiGetCurrentLineItemValue(a, c) != b) {
        nlapiSetCurrentLineItemValue(a, c, b);
    }
}

function clearItemSourceField() {
    var a = nlapiGetCurrentLineItemValue("item", "item");
    nlapiSetCurrentLineItemValueIfChanged("item", "itemsource", a ? "STOCK" : "");
}

function refreshUncommitedCostEstimateRate() {
    if (nlapiGetCurrentLineItemValue("item", "item")) {
        var a = ["costestimatetype"];
        for (var c = 0; c < a.length; c++) {
            var b = a[c];
            var d = nlapiGetCurrentLineItemValue("item", b);
            if (d) {
                nlapiSetCurrentLineItemValue("item", b, d, true, true);
            }
        }
    }
}

function enableChargeFields() {
    if (hasItemMachField("chargetype")) {
        var h = itemMachCurrentLineValueNotEmpty("chargetype");
        var g = itemMachCurrentLineValueNotEmpty("charges");
        var d = hasChargeRule();
        var f = hasActualCharges();
        var b = h || g;
        if (d && !f) {
            b = false;
        }
        var n = getItemMachValue("chargetype"),
            j = b;
        if (n && (nlapiGetRecordType() === "salesorder") && (nlapiGetContext().getCompany() === "1017942")) {
            j = (n > -10) || (n < -13);
        }
        setItemMachDisabled("item", b);
        if (hasItemMachField("job")) {
            setItemMachDisabled("job", b);
        }
        if (hasItemMachField("price")) {
            setItemMachDisabled("price", b);
        }
        setItemMachDisabled("chargetype", b || d);
        setItemMachDisabled("quantity", j);
        setItemMachDisabled("rate", j);
        var e = taxInclusivePricingHelper.getEditableFieldName("amount");
        setItemMachDisabled(e, j);
        setItemMachDisabled("units", b);
        if (hasItemMachField("chargerule")) {
            var l = nlapiGetFieldValue("projectbillingtype") === "CB";
            var k = getItemMachValue("amount") > 0;
            var a = getItemMachValue("itemtype") === "Service";
            var i = getItemMachValue("fulfillable") === "T";
            var m = l && k && a && !i;
            var c = m && (!d || !f);
            if (d) {
                if (!m) {
                    setItemMachValue("chargerule", "");
                    setItemMachValue("chargetype", "");
                }
                setItemMachValue("fromjob", "F");
                setItemMachValue("isestimate", "F");
            }
            setItemMachDisabled("chargerule", b || !c);
        }
    }
}

function hasChargeRule() {
    return hasItemMachField("chargerule") && itemMachCurrentLineValueNotEmpty("chargerule");
}

function hasActualCharges() {
    return hasChargeRule() && hasItemMachField("actualcharges") && getItemMachValue("actualcharges") > 0;
}

function Item_Machine_postEditRow() {
    if (getTransactionType() == "workord") {
        disableButton(this.name + "_copy", isOrderFinished());
        disableButton(this.name + "_remove", isLineLinked() || isOrderFinished());
        disableButton(this.name + "_insert", isOrderFinished());
    }
}

function isLineLinked() {
    return getItemMachValue("linked") == "T";
}

function isOrderFinished() {
    return getOrderStatus() == "G" || getOrderStatus() == "H";
}

function getOrderStatus() {
    return nlapiGetFieldValue("orderstatus");
}

function isItemSourcedFromTransaction() {
    return !isValEmpty(getItemMachValue("poid")) || !isValEmpty(getItemMachValue("woid"));
}
var currentItemLineGroup;
var isAdjusting = false;

function adjustLineItemTaxAmounts() {
    if (nlapiGetField("taxamountoverride") != null && nlapiGetField("taxamount2override") != null) {
        var b = nlapiGetFieldValue("taxamountoverride");
        var a = nlapiGetFieldValue("taxamount2override");
        if (b || a) {
            return;
        }
    }
    if (isAdjusting) {
        return;
    }
    if (nlapiGetField("taxfractionunit") != null && !isNaN(parseFloat(nlapiGetFieldValue("taxfractionunit"))) && parseFloat(nlapiGetFieldValue("taxfractionunit")) != get_precision()) {
        return;
    }
    isAdjusting = true;
    adjustLineItemTaxAmountsForMachine("item");
    adjustLineItemTaxAmountsForMachine("expcost");
    adjustLineItemTaxAmountsForMachine("time");
    adjustLineItemTaxAmountsForMachine("itemcost");
    isAdjusting = false;
}

function adjustLineItemTaxAmountsForMachine(f) {
    var a = nlapiGetLineItemCount(f);
    if (a < 1) {
        return;
    }
    var g = [];
    for (var d = 1; d <= a; d++) {
        var b = nlapiGetLineItemValue(f, "itemtype", d);
        var h = nlapiGetLineItemValue(f, "apply", d);
        if (b != "Subtotal" && b != "EndGroup" && b != "Description" && b != "Group" && (h == "T" || h == null)) {
            var e = nlapiGetLineItemValue(f, "taxcode", d);
            if (e == "" || e == null) {
                return;
            }
            var j = parseFloat(nlapiGetLineItemValue(f, "taxrate1", d));
            var c = nlapiGetLineItemValue(f, "tax1amt", d);
            if (j != 0) {
                if (typeof g[e] == "undefined") {
                    g[e] = new ItemLineGroup(j, f);
                }
                g[e].addIndex(d);
            }
        }
    }
    for (var e in g) {
        currentItemLineGroup = g[e];
        if (typeof currentItemLineGroup == "undefined") {
            break;
        }
        g[e].calcDelta();
        g[e].distributeDelta();
    }
}

function ItemLineGroup(b, a) {
    this.machineName = a;
    this.taxRate = b;
    this.indices = [];
    this.currencyPrecision = parseFloat(nlapiGetFieldValue("currencyprecision"));
    this.unit = round_currency(Math.pow(10, -this.currencyPrecision), this.currencyPrecision);
    this.taxRoundingUnit = get_precision();
    if (nlapiGetField("taxfractionunit") != null && !isNaN(parseFloat(nlapiGetFieldValue("taxfractionunit")))) {
        this.taxRoundingUnit = parseFloat(nlapiGetFieldValue("taxfractionunit"));
    }
    this.taxRounding = "OFF";
    if (nlapiGetField("taxrounding") != null) {
        this.taxRounding = nlapiGetFieldValue("taxrounding");
    }
}
ItemLineGroup.prototype.addIndex = function(a) {
    this.indices[this.indices.length] = a;
};
ItemLineGroup.prototype.sort = function() {
    var a = this;
    this.indices.sort(function(c, b) {
        return a.compare(c, b);
    });
};
ItemLineGroup.prototype.computeDeltaPerc = function(a, e, f, c, g) {
    var b = f + a * e - c;
    if (b === 0) {
        return 0;
    }
    var h = b / g;
    var d = Math.abs(h);
    return d;
};
ItemLineGroup.prototype.compare = function(h, g) {
    if (typeof currentItemLineGroup.machineName == "undefined") {
        return 0;
    }
    var f = currentItemLineGroup.delta > 0 ? 1 : -1;
    var c = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, "amount", h));
    var p = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, "amount", g));
    var m = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, "taxrate1", h));
    var l = c * m / 100;
    var j = p * m / 100;
    var b = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, "tax1amt", h));
    var o = parseFloat(nlapiGetLineItemValue(currentItemLineGroup.machineName, "tax1amt", g));
    var k = this.computeDeltaPerc(f, currentItemLineGroup.unit, b, l, c);
    var i = this.computeDeltaPerc(f, currentItemLineGroup.unit, o, j, p);
    var a = l - b;
    var n = j - o;
    var e = a > 0 ? 1 : (a < 0 ? -1 : 0);
    var d = n > 0 ? 1 : (n < 0 ? -1 : 0);
    if (e == d) {
        if (k == i) {
            return g - h;
        } else {
            return k - i;
        }
    } else {
        return f * (d - e);
    }
};
ItemLineGroup.prototype.calcDelta = function() {
    if (this.indices.length < 1) {
        this.unroundedDelta = 0;
        this.delta = 0;
    } else {
        var b = 0;
        var a = 0;
        var e, d;
        for (var c = 0; c < this.indices.length; c++) {
            d = nlapiGetLineItemValue(this.machineName, "amount", this.indices[c]);
            d = d.replace(/,/g, "");
            b += parseFloat(d) * this.taxRate / 100;
            e = parseFloat(nlapiGetLineItemValue(this.machineName, "tax1amt", this.indices[c]));
            a += e;
        }
        this.unroundedDelta = b - a;
        b = round_currency(b, this.taxRoundingUnit, this.taxRounding);
        this.delta = round_currency(b - a);
    }
};
ItemLineGroup.prototype.distributeDelta = function() {
    if (this.delta == 0 || isNaN(this.delta)) {
        return;
    }
    if (Math.abs(this.unroundedDelta) / this.unit > this.indices.length) {
        return;
    }
    this.sort();
    var b = this.delta > 0 ? 1 : -1;
    var c = b * this.unit;
    for (var d = 0; d < this.indices.length; d++) {
        var e = parseFloat(nlapiGetLineItemValue(this.machineName, "tax1amt", this.indices[d]));
        var a = parseFloat(nlapiGetLineItemValue(this.machineName, "grossamt", this.indices[d]));
        nlapiSetLineItemValue(this.machineName, "tax1amt", this.indices[d], format_currency(e + c));
        nlapiSetLineItemValue(this.machineName, "grossamt", this.indices[d], format_currency(a + c));
        this.delta = round_currency(this.delta - c, this.currencyPrecision);
        if (this.delta == 0) {
            break;
        }
    }
};

function DiscountLevel(d, b, a, c) {
    this.id = d;
    this.minimumamount = parseFloat(b);
    this.amount = parseFloat(a);
    this.cummulativeAmount = parseFloat(c);
}
DiscountLevel.prototype.incrementAmount = function DiscountLevel_incrementAmount(a) {
    this.cummulativeAmount += a;
};

function DiscountList(b, c) {
    this.discountLevels = [];
    for (var a = 0; a < b.length; a++) {
        this.discountLevels.push(new DiscountLevel(b[a].id, b[a].quantity, b[a].amount, b[a].cummulativeAmount));
    }
    this.cummualiveAmount = c;
    this.index = 0;
}
DiscountList.prototype.isEmpty = function DiscountList_isEmpty() {
    return this.discountLevels.length == 0;
};
DiscountList.prototype.incrementCummulativeAmount = function DiscountList_incrementCummulativeAmount(a) {
    this.cummualiveAmount += a;
};
DiscountList.prototype.getCurrentDiscountLevel = function DiscountList_getCurrentDiscountLevel() {
    for (; this.index < this.discountLevels.length - 1; this.index++) {
        var a = this.discountLevels[this.index + 1];
        if (a.minimumamount > this.cummualiveAmount) {
            break;
        }
    }
    return this.discountLevels[this.index];
};

function ItemRateElement(a, c, b) {
    this.discountLevel = a;
    this.quantity = c;
    this.amount = b;
}

function ItemRateElements(a) {
    this.elements = a;
}
ItemRateElements.prototype.calculateAmount = function ItemRateElements_calculateAmount(c) {
    if (c == "LOTRATE") {
        return this.elements[0].amount;
    } else {
        var b = 0;
        for (var a = 0; a < this.elements.length; a++) {
            b += this.elements[a].quantity * this.elements[a].amount;
        }
        return b;
    }
};

function PurchaseContract(b, a) {
    this.id = b;
    this.discountList = a;
}
PurchaseContract.prototype.getHeaderDiscount = function PurchaseContract_getHeaderDiscount(a, b) {
    if (!this.discountList.isEmpty()) {
        return this.calculateDiscountedAmount(a, b);
    } else {
        return new ItemRateElements([new ItemRateElement(null, 1, a)]);
    }
};
PurchaseContract.prototype.calculateDiscountedAmount = function PurchaseContract_calculateDiscountedAmount(h, d) {
    var a = [];
    var e = this.discountList;
    var l = h / d;
    var f = 0;
    var k = e.discountLevels[0];
    var c = l * (1 + k.amount);
    for (var g = 1; g < e.discountLevels.length; g++) {
        var b = e.discountLevels[g];
        var j = b.minimumamount - (k.minimumamount + k.cummulativeAmount);
        if (j > 0) {
            var m = j / c;
            if (f + m > d) {
                break;
            } else {
                f += m;
                k.incrementAmount(j);
                a.push(new ItemRateElement(k, 1, j));
            }
        }
        k = b;
        c = l * (1 + b.amount);
    }
    k.incrementAmount((d - f) * c);
    a.push(new ItemRateElement(k, 1, (d - f) * c));
    return new ItemRateElements(a);
};

function PurchaseContractItem(e, a, d, c, b) {
    this.id = e;
    this.baseRate = a;
    this.priceUsingType = d;
    this.calculateDiscountUsing = c;
    this.discountList = b;
}
PurchaseContractItem.prototype.calculatePurchaseAmount = function PurchaseContractItem_calculatePurchaseAmount(g) {
    var e = [];
    if (this.discountList.isEmpty()) {
        e.push(new ItemRateElement(null, g, this.baseRate));
    } else {
        if (this.priceUsingType == "MARGINALRATE") {
            var d = 0;
            var c = this.discountList.discountLevels[0];
            for (var b = 1; b < this.discountList.discountLevels.length && d < g; b++) {
                var h = this.discountList.discountLevels[b];
                var f = h.minimumamount - (c.minimumamount + c.cummulativeAmount);
                if (f > 0) {
                    var a = Math.min(f, g - d);
                    e.push(new ItemRateElement(c, a, c.amount));
                    d += a;
                    c.incrementAmount(a);
                }
                c = h;
            }
            if (d < g) {
                e.push(new ItemRateElement(c, g - d, c.amount));
            }
        } else {
            this.discountList.incrementCummulativeAmount(g);
            var h = this.discountList.getCurrentDiscountLevel();
            e.push(new ItemRateElement(h, g, h.amount));
        }
    }
    return new ItemRateElements(e);
};

function RateCalculator(b, a, c) {
    this.contract = b;
    this.item = a;
    this.itemCount = c;
    this.itemCountOrdered = c;
    this.amount = null;
    this.rate = null;
    this.rateElements = null;
    this.contractDiscount = null;
}
RateCalculator.prototype.calculateAmount = function RateCalculator_calculateAmount() {
    if (this.amount == null) {
        this.rateElements = this.item.calculatePurchaseAmount(this.itemCount);
        var a = this.rateElements.calculateAmount(this.item.priceUsingType);
        this.contractDiscount = this.contract.getHeaderDiscount(a, this.itemCount);
        this.amount = this.contractDiscount.calculateAmount("");
        this.headerDiscount = this.amount - a;
        this.rate = this.amount / this.itemCount;
    }
};
RateCalculator.prototype.addLine = function RateCalculator_addLine(a) {
    this.itemCount += a;
    this.itemCountOrdered += a;
};
RateCalculator.prototype.getAmountForQuantity = function RateCalculator_getAmountForQuantity(a) {
    var b;
    if (a == this.itemCountOrdered) {
        return round_currency(this.amount, 8);
    } else {
        if (this.item.priceUsingType == "LOTRATE") {
            b = round_currency(this.rate * a);
        } else {
            b = round_currency(this.rate * a, 8);
        }
    }
    this.amount -= b;
    this.itemCountOrdered -= a;
    return b;
};

function ItemRate(c, b, a) {
    this.lineIndex = c;
    this.itemCount = b;
    this.rateCalculator = a;
}
ItemRate.prototype.numberOfDecimalPlaces = function ItemRate_numberOfDecimalPlaces() {
    var b = this.itemCount + "";
    var a = b.indexOf(".");
    if (a >= 0) {
        return Math.max(2, b.length - a - 1);
    }
    return 2;
};
ItemRate.prototype.setRateAndAmount = function ItemRate_setRateAndAmount() {
    this.rateCalculator.calculateAmount();
    var c = this.rateCalculator.getAmountForQuantity(this.itemCount);
    var d = c / parseFloat(getLineValue(this.lineIndex, "quantity"));
    this.setValue("amount", round_currency(c));
    this.setValue("rate", round_currency(d, 8));
    var f = this.rateCalculator.item;
    var g = '{ "priceUsingType" : "' + f.priceUsingType + '", "calculateDiscountType" : "' + f.calculateDiscountUsing + '", "headerDiscount" : "' + this.rateCalculator.headerDiscount;
    g += '", "contractDiscountLevels" : [ ';
    for (var b = 0; b < this.rateCalculator.contractDiscount.elements.length; b++) {
        if (b > 0) {
            g += ", ";
        }
        var a = this.rateCalculator.contractDiscount.elements[b];
        g += '{ "id" : ' + a.discountLevel.id + ', "amount" : ' + a.amount + "}";
    }
    g += " ]";
    if (f.discountList.isEmpty()) {
        g += ', "discountLevels" : [ {"id" : -1, "quantity" : ' + this.itemCount + ', "rate" : ' + f.baseRate + ', "seqnum" : 0, "tierquantity" : 0 }]';
    } else {
        g += ', "discountLevels" : [ ';
        var h = 0;
        for (var b = 0; b < f.discountList.discountLevels.length; b++) {
            if (b > 0) {
                g += ", ";
            }
            var j = f.discountList.discountLevels[b];
            if (h == this.rateCalculator.rateElements.elements.length) {
                g += '{ "id" : ' + j.id + ', "quantity" : 0, "rate" : ' + j.amount + ', "seqnum" : ' + b + ', "tierquantity" : ' + j.minimumamount + "}";
            } else {
                var e = this.rateCalculator.rateElements.elements[h];
                if (j.id == e.discountLevel.id) {
                    var k = (this.itemCount == this.rateCalculator.itemCount) ? e.quantity : round_currency(e.quantity * this.itemCount / this.rateCalculator.itemCount, this.numberOfDecimalPlaces());
                    g += '{ "id" : ' + j.id + ', "quantity" : ' + k + ', "rate" : ' + j.amount + ', "seqnum" : ' + b + ', "tierquantity" : ' + j.minimumamount + " }";
                    h++;
                } else {
                    g += '{ "id" : ' + j.id + ', "quantity" : 0, "rate" : ' + j.amount + ', "seqnum" : ' + b + ', "tierquantity" : ' + j.minimumamount + "}";
                }
            }
        }
        g += " ]";
    }
    g += " }";
    this.setValue("ratedetails", g);
};
ItemRate.prototype.setValue = function ItemRate_setValue(b, a) {
    if (this.lineIndex == nlapiGetCurrentLineItemIndex("item")) {
        setItemMachValue(b, a);
    } else {
        setEncodedItemValue(this.lineIndex, b, a);
    }
};

function getLineValue(a, b) {
    if (a == nlapiGetCurrentLineItemIndex("item")) {
        return getItemMachValue(b);
    } else {
        return getEncodedItemValue(a, b);
    }
}

function calculateRateAndAmountForLine(c) {
    var a = getItemMachValue("purchasecontract");
    var b = getItemMachValue("contractdetails");
    calculateContractRateForAllLines(a, b, c, false);
}

function recalculateLinesForOldContract() {
    var b = getItemMachValue("previouspurchasecontract");
    if (isValEmpty(b)) {
        return;
    }
    if (b == getItemMachValue("purchasecontract")) {
        return;
    }
    var a = null;
    for (var c = 1; c <= nlapiGetCurrentLineItemIndex("item"); c++) {
        if (getEncodedItemValue(c, "purchasecontract") == b) {
            a = getEncodedItemValue(c, "contractdetails");
            break;
        }
    }
    if (a != null) {
        calculateContractRateForAllLines(b, a, false, true);
    }
}

function calculateContractRateForAllLines(c, k, e, l) {
    var b = JSON.parse(k);
    var n = new PurchaseContract(c, new DiscountList(b.discountList, 0));
    var d = [];
    var j = {};
    var a = Math.max(nlapiGetCurrentLineItemIndex("item"), nlapiGetLineItemCount("item"));
    for (var g = 1; g <= a; g++) {
        if (l && g == nlapiGetCurrentLineItemIndex("item")) {
            continue;
        }
        if (g == nlapiGetCurrentLineItemIndex("item") || getEncodedItemValue(g, "purchasecontract") == c) {
            var o = getLineValue(g, "item");
            if (e && g != nlapiGetCurrentLineItemIndex("item")) {
                setEncodedItemValue(g, "contractdetails", k);
                if (o == getItemMachValue("item")) {
                    setEncodedItemValue(g, "itemcontractdetails", getItemMachValue("itemcontractdetails"));
                }
            }
            var f = parseFloat(getLineValue(g, "quantity"));
            if (hasItemMachField("unitconversionrate")) {
                if (getLineValue(g, "unitconversionrate") != "") {
                    f = f * getLineValue(g, "unitconversionrate");
                }
            }
            var h = JSON.parse(getLineValue(g, "itemcontractdetails"));
            var m = new PurchaseContractItem(o, h.baseRate, h.pricingUsingType, h.calculateDiscountType, new DiscountList(h.discountList, 0));
            var p;
            if (m.calculateDiscountUsing == "OVERALL" || m.calculateDiscountUsing == "OVERALLPO") {
                p = j["item" + o];
                if (typeof p == "undefined") {
                    p = new RateCalculator(n, m, f);
                    j["item" + o] = p;
                } else {
                    p.addLine(f);
                }
            } else {
                p = new RateCalculator(n, m, f);
            }
            d.push(new ItemRate(g, f, p));
        }
    }
    for (var g = 0; g < d.length; g++) {
        d[g].setRateAndAmount();
    }
}
var autoLocationAssignmentModule = (function() {
    var f = ["Assembly", "GiftCert", "InvtPart", "Kit", "NonInvtPart", "Service"];
    var k = "noautoassignlocation";
    var i = "keepnoautoassignlocationsettofalse";
    var b = "item";
    var g = "itemtype";
    var j = "itemfulfillmentchoice";
    var c = function() {
        nlapiSetLineItemDisabled(b, k, !h(nlapiGetCurrentLineItemValue(b, g)));
    };
    var e = function() {
        if (hasItemMachField(k)) {
            var l = d(j);
            if (l) {
                nlapiSetCurrentLineItemValue(b, k, "F", true, true);
            }
            setItemMachDisabled(k, l);
        }
    };
    var a = function(l) {
        var m = d(j);
        if (!m) {
            if (h(nlapiGetCurrentLineItemValue(b, g))) {
                if (!nlapiGetCurrentLineItemValue(b, i)) {
                    nlapiSetCurrentLineItemValue(b, k, !!nlapiGetCurrentLineItemValue(b, l) ? "T" : "F", true, true);
                }
            }
        }
    };
    var d = function() {
        return (nlapiGetCurrentLineItemValue(b, j) == 2);
    };
    var h = function(l) {
        if (!!f) {
            return f.indexOf(l) >= 0;
        }
        return false;
    };
    return {
        disableAutoLocationFieldsForIrrelevantItemTypes: c,
        isRelevantItemType: h,
        updateNoAutoAssignLocationWhenFulfillmentChoiceChange: e,
        updateDoNotAutoAssignLocationWhenLocationChange: a
    };
})();
var storePickUpConnector = (function() {
    var j = "item";
    var o = "itemfulfillmentchoice";
    var s = "2";
    var e = "";
    var t = "";
    var l = true;
    var p = "location";
    var c = "excludefromraterequest";
    var d = function(C) {
        var D = getLineValue(C, "itemtype");
        var B = getLineValue(C, "fulfillable");
        return b(D, B);
    };
    var k = function(C, B) {
        return b(C, B) || "Group" == C;
    };
    var b = function(C, B) {
        if ("Assembly" == C || "InvtPart" == C) {
            return true;
        } else {
            if (("Service" == C || "OthCharge" == C || "GiftCert" == C || "NonInvtPart" == C || "Kit" == C || "DwnLdItem" == C) && B == "T") {
                return true;
            }
        }
        return false;
    };
    var y = function(C, G) {
        var F = nlapiGetFieldValue(G);
        if (F != "") {
            var E = nlapiGetLineItemCount(j);
            for (var D = 1; D <= E; D++) {
                if (d(D)) {
                    if (nlapiGetLineItemValue(j, C, D) != F) {
                        l = false;
                        var B = nlapiGetLineItemValue(j, p, D);
                        nlapiSelectLineItem(j, D, false);
                        nlapiSetCurrentLineItemValue(j, C, F, true, true);
                        nlapiSetCurrentLineItemValue(j, p, B, true, true);
                        nlapiCommitLineItem(j);
                        l = true;
                    }
                }
            }
        }
    };
    var A = function(I, H) {
        var C = nlapiGetField(H);
        if (C && !C.isHidden()) {
            var F = "",
                E = "";
            var G = false;
            var D = nlapiGetLineItemCount(j);
            var B;
            q(p);
            for (B = 1; B <= D; B++) {
                if (d(B)) {
                    G = true;
                    E = nlapiGetLineItemValue(j, I, B);
                    if (E != F && F != "") {
                        nlapiSetFieldValue(H, "", true, true);
                        break;
                    }
                    F = E;
                }
            }
            if (B == D + 1 && E == F && E != nlapiGetFieldValue(H)) {
                nlapiSetFieldValue(H, E, true, true);
            }
            if (G || D == 0) {
                nlapiSetFieldDisabled(H, false);
            } else {
                nlapiSetFieldDisabled(H, true);
            }
        }
    };
    var i = function(C) {
        var B = parseInt(getItemMachValue("quantityrequestedtofulfill")) > 0 || getItemMachValue("itempicked") == "T";
        setItemMachDisabled(C, !k(getItemType(), getItemMachValue("fulfillable")) || B);
    };
    var g = function(C, F, B) {
        var D = nlapiGetCurrentLineItemValue(j, C);
        if (k(getItemType(), getItemMachValue("fulfillable"))) {
            if (D == "") {
                var G = nlapiGetFieldValue(F);
                var E = (G == "" || G == null) ? B : G;
                nlapiSetCurrentLineItemValue(j, C, E, true);
            }
        } else {
            nlapiSetCurrentLineItemValue(j, C, "", true);
        }
    };
    var m = function(C, B) {
        var D = x(C);
        nlapiSetCurrentLineItemValue(j, B, (D ? "T" : "F"));
        n(C, B);
    };
    var n = function(C, B) {
        if (!isExcludeFromRateRequestDisabledInCurrentLine()) {
            setItemMachDisabled(B, x(C));
        }
    };
    var z = function(C, B) {
        if (x(C) && nlapiGetCurrentLineItemValue(j, B) == "F") {
            nlapiSetCurrentLineItemValue(j, B, "T");
        }
    };
    var x = function(B) {
        var C = nlapiGetCurrentLineItemValue(j, "itemtype");
        return (nlapiGetCurrentLineItemValue(j, B) == s) && (C != "Group");
    };
    var h = function() {
        e = "";
    };
    var r = function() {
        if (e == "") {
            e = nlapiGetCurrentLineItemValue(j, p);
        }
    };
    var f = function() {
        if (e != "") {
            try {
                nlapiSetCurrentLineItemValue(j, p, e, nlapiGetCurrentLineItemValue(j, p) != e, true);
            } catch (B) {
                if ((typeof B.code == "undefined") || (B.code != "INVALID_KEY_OR_REF")) {
                    throw B;
                }
            }
            h();
        }
    };
    var q = function(B) {
        t = nlapiGetFieldValue(B);
    };
    var w = function(B) {
        if (t) {
            nlapiSetFieldValue(B, t, true);
        }
    };
    var v = function() {
        var D = om.salesorder.staticcontent.fulfillmentLocationField;
        var C = nlapiGetLineItemCount(j);
        for (var B = 1; B <= C; B++) {
            if (nlapiGetLineItemField(j, D, B) && nlapiGetLineItemValue(j, o, B) == s && d(B) && !nlapiGetLineItemValue(j, D, B)) {
                return false;
            }
        }
        return true;
    };
    var u = function(E, B) {
        for (var C = E; C < B; C++) {
            var D = nlapiGetLineItemValue(j, o, C);
            var F = (D == s);
            setEncodedValue(j, C, c, F ? "T" : "F");
            setItemMachDisabled(c, F);
        }
    };
    var a = function(B) {
        if (hasEncodedField(j, o)) {
            var C = nlapiGetLineItemValue(j, o, B);
            if (C == s) {
                return nlapiGetLineItemValue(j, p, B);
            }
        }
        return null;
    };
    return {
        canHaveFulfillmentChoice: k,
        shouldHaveFulfillmentChoice: b,
        setFulfillmentChoiceInItemMachine: y,
        setFulfillmentChoiceInSalesOrder: A,
        enableDisableFulfillmentChoiceField: i,
        setDefaultFulfillmentChoice: g,
        setExcludeFromRateRequest: m,
        enableDisableExcludeRateRequestField: n,
        forceExcludeFromRateRequestWhenStorePickUp: z,
        saveItemMachLocationPrevValue: r,
        restoreItemMachLocationPrevValue: f,
        saveLocationPrevValue: q,
        restoreLocationPrevValue: w,
        setAllowFulfillmentChoiceRecalcInSalesOrder: function(B) {
            l = B;
        },
        getAllowFulfillmentChoiceRecalcInSalesOrder: function() {
            return l;
        },
        isFulfillableLine: d,
        allSpfLinesHaveLocationSet: v,
        setExcludeFromRateRequestMultiple: u,
        getStorePickUpLocation: a
    };
})();

function workOrder_LineInit() {
    Item_Machine_synclinefields();
    workOrderConnector.initItemLine();
}

function workOrder_PostDeleteLine(a, b) {
    Item_Machine_postDeleteLine(a, b);
    workOrderConnector.postDeleteLine(a, b);
}

function isNewLine(a) {
    var b = getEncodedItemValue(a, "line");
    return b == "-1" || isValEmpty(b);
}
var workOrderConnector = (function() {
    var p = false;
    var a = null;
    var x = false;
    var w = {};
    var D = ["itemtype", "item", "itemsource", "quantity", "bomquantity", "assemblylevel"];

    function c() {
        if (c.initialized) {
            return;
        }
        c.initialized = true;
        x = !isValEmpty(nlapiGetRecordId());
        var E = getOrderStatus();
        if (hasLegacyMachine()) {
            NS.event.bind(NS.event.type.ROW_UPDATE_BUTTONS, function(G, I) {
                if (I.machineName != "item") {
                    return;
                }
                var F = item_machine.isinserting || I.isCopyPrevious;
                var H = nlapiGetCurrentLineItemValue("item", "itemtype") != "Assembly" || getEncodedItemValue(nlapiGetCurrentLineItemIndex("item"), "itemsource") != "PHANTOM";
                var J = F || H || isOrderFinished();
                disableButton("item_addchild", J);
            });
        }
    }

    function y(L, N, G) {
        if (getEncodedItemValue(L, "itemtype") != "Assembly" || (parseFloatOrZero(getEncodedItemValue(L, "quantityfulfilled")) > 0)) {
            return false;
        }
        var M = getEncodedItemValue(L, "item");
        var J = getEncodedItemValue(L, "itemsource");
        var K = s(G, "itemsource");
        var F = isValEmpty(s(G, "item"));
        if (J == "PHANTOM" && (N || K != "PHANTOM")) {
            z(true, L);
            var H = q({
                item: M
            });
            var E = nlapiServerCall("/app/accounting/transactions/manufacturing/assemblycomponents.nl", "get", [H]);
            var I = JSON.parse(E);
            if (l(I.components, L, F, H.fieldNames !== undefined) > 0) {
                if (typeof handleAssemblyExpand != "undefined") {
                    handleAssemblyExpand(L);
                }
                return true;
            }
        } else {
            if (J != "PHANTOM") {
                if (nlapiGetFieldValue("expandassembly") == "T") {
                    nlapiSetFieldValue("expandassembly", "F");
                }
                if (K == "PHANTOM") {
                    z(false, L);
                    return b(L);
                }
            }
        }
        return false;
    }

    function v(E, G) {
        var I = (nlapiGetFieldValue("usecomponentyield") == "T" ? "bomquantity" : "quantity");
        var F = parseFloat(s(G, I));
        var H = parseFloat(getEncodedItemValue(E, I));
        if (F == H || getEncodedItemValue(E, "itemtype") != "Assembly") {
            return false;
        }
        d(E, false);
        return true;
    }

    function d(V, L) {
        function F(X, Y) {
            var W = getEncodedItemFloat(X, "origassemblyqty");
            return Y ? ifNaNThen(getEncodedItemFloat(X, "origassemblybomqty"), W) : W;
        }
        var R = nlapiGetFieldValue("usecomponentyield") == "T";
        var H = (R ? "bomquantity" : "quantity");
        var Q = L ? nvl(getEncodedItemFloat(V, "componentyield"), 100) : 100;
        var S = getAssemblyLevel(V);
        var J = getEncodedItemFloat(V, H);
        var M = J / F(V, R);
        M = isFinite(M) ? M : 1;
        var T = {};
        T[S] = J;
        for (var O = V + 1, I = nlapiGetLineItemCount("item"); O <= I; O++) {
            var P = getAssemblyLevel(O);
            if (P <= S) {
                break;
            }
            var U = F(O, R);
            var K = (!x || L || isNewLine(O) ? T[P - 1] : M);
            var N = U * K;
            var E = getEncodedItemFloat(O, "componentyield");
            setEncodedItemValue(O, H, N);
            if (R) {
                if (!E) {
                    E = Q;
                    setEncodedItemValue(O, "componentyield", format_percent(E));
                }
                var G = getEncodedItemValue(O, "roundupascomponent") == "T";
                setEncodedItemValue(O, "quantity", calculateQuantityWithComponentYield(N, E, G));
            } else {
                if (E) {
                    setEncodedItemValue(O, "componentyield", "");
                }
                if (getEncodedItemValue(O, "bomquantity")) {
                    setEncodedItemValue(O, "bomquantity", "");
                }
            }
            if (getEncodedItemValue(O, "itemtype") == "Assembly") {
                T[P] = N;
            }
        }
    }

    function n(G, J) {
        if (s(J, "itemtype") == "Assembly") {
            var H = parseInt(s(J, "assemblylevel"));
            var F = null;
            for (var I = G, K = nlapiGetLineItemCount("item"); I <= K; I++) {
                var E = getAssemblyLevel(I);
                if (E <= H) {
                    break;
                }
                F = I;
            }
            if (F !== null) {
                Machine_deleteLineItems("item", G - 1, F);
                if (hasLegacyMachine()) {
                    item_machine.setupLineData(G);
                    item_machine.buildtable();
                }
            }
        }
    }

    function s(E, F) {
        if (!hasLegacyMachine()) {
            return w[F];
        }
        return E ? item_machine.getLineFieldValue(E, F) : null;
    }

    function B(E, G) {
        if (p || isOrderFinished()) {
            return;
        }
        var J = getEncodedItemValue(E, "item");
        var I = s(G, "item");
        var H = false;
        if (J != I && s(G, "itemtype") == "Assembly" && !isValEmpty(getEncodedValue("item", E, "assemblylevel"))) {
            H = b(E);
        }
        H = k(E) || H;
        p = true;
        var F = y(E, J != I, G);
        H = F || H;
        if (F) {
            d(E, true);
        } else {
            H = v(E, G) || H;
        }
        p = false;
        if (H) {
            Item_Machine_Recalc();
            if (hasLegacyMachine()) {
                item_machine.buildtable();
                o(E);
            }
        }
    }

    function o(E) {
        var F = nlapiGetCurrentLineItemIndex("item");
        if (F <= nlapiGetLineItemCount("item")) {
            item_machine.loadline(F);
        } else {
            if (E + 1 <= nlapiGetLineItemCount("item")) {
                nlapiSelectLineItem("item", E + 1);
            }
        }
    }

    function k(E) {
        if (getAssemblyLevel(E)) {
            return false;
        }
        var F = E < nlapiGetLineItemCount("item") ? ifNaNThen(getAssemblyLevel(E + 1), 1) : 1;
        setEncodedItemValue(E, "assemblylevel", F);
        setEncodedItemValue(E, "indentlevel", F - 1);
        return true;
    }

    function b(E) {
        if (typeof handleAssemblyCollapse != "undefined") {
            handleAssemblyCollapse(E);
        }
        return t(E);
    }

    function e(F) {
        var I = 0;
        var E = getAssemblyLevel(F);
        for (var G = F + 1, H = nlapiGetLineItemCount("item"); G <= H; G++) {
            var J = getAssemblyLevel(G);
            if (J <= E) {
                break;
            }
            I = G;
        }
        return I;
    }

    function t(E) {
        var F = e(E);
        if (F > 0) {
            Machine_deleteLineItems("item", E, F);
            return true;
        }
        return false;
    }

    function l(J, E, I, H) {
        if (isValEmpty(J) || isValEmpty(E)) {
            return 0;
        }
        var F = ifNaNThen(getAssemblyLevel(I ? E + 1 : E), 1);
        var G = 0;
        if (H) {
            item_machine.insertdata(J, E + 1);
            G = splitIntoRows(J).length;
        } else {
            G = g(J, E);
        }
        if (G > 0) {
            j(E + 1, E + G, F);
        }
        return G;
    }

    function g(I, E) {
        var J = I.length - 1;
        for (var G = J; G >= 0; G--) {
            if (G == J && E == nlapiGetLineItemCount("item")) {
                nlapiSelectNewLineItem("item");
            } else {
                nlapiInsertLineItem("item", E + 1);
            }
            var H = I[G];
            for (var F in H) {
                if (H.hasOwnProperty(F)) {
                    nlapiSetCurrentLineItemValue("item", F, H[F], false, false);
                }
            }
            nlapiCommitLineItem("item");
        }
        return I.length;
    }

    function j(F, E, I) {
        I = ifNaNThen(I, 1);
        for (var G = F; G <= E; G++) {
            var H = ifNaNThen(getAssemblyLevel(G), 1);
            setEncodedItemValue(G, "indentlevel", H - 1 + I);
            setEncodedItemValue(G, "assemblylevel", H + I);
        }
    }

    function r() {
        if (!hasLegacyMachine() || isOrderFinished()) {
            return;
        }
        if (getItemMachValue("itemsource") == "PHANTOM") {
            a = item_machine.getMachineIndex();
            item_machine.setMachineIndex(a + 1);
            item_machine.insertline();
        }
    }

    function C() {
        if (nlapiGetFieldValue("expandassembly") != "T") {
            return;
        }
        if (nlapiGetCurrentLineItemValue("item", "item")) {
            var J = nlapiGetCurrentLineItemIndex("item");
            var F = nlapiGetCurrentLineItemValue("item", "itemsource");
            if (nlapiGetCurrentLineItemValue("item", "itemtype") == "Assembly" && F != "PHANTOM") {
                nlapiSetCurrentLineItemValue("item", "itemsource", "PHANTOM", true, true);
                z(true);
                nlapiCommitLineItem("item");
                if (nlapiGetCurrentLineItemIndex("item") == J) {
                    nlapiSetFieldValue("expandassembly", "F");
                    z(false);
                    nlapiSetCurrentLineItemValue("item", "itemsource", F, true, true);
                    return;
                }
            }
        }
        p = true;
        var N = [];
        var G = [];
        for (var L = 1, M = nlapiGetLineItemCount("item"); L <= M; L++) {
            if (getEncodedItemValue(L, "itemtype") == "Assembly" && getEncodedItemValue(L, "itemsource") != "PHANTOM" && (parseFloatOrZero(getEncodedItemValue(L, "quantityfulfilled")) == 0)) {
                N.push(getEncodedItemValue(L, "item"));
                G.push(L);
                nlapiSelectLineItem("item", L);
                nlapiSetCurrentLineItemValue("item", "itemsource", "PHANTOM", true, true);
                z(true);
                nlapiCommitLineItem("item");
            }
        }
        if (N.length === 0) {
            p = false;
            return;
        }
        var I = q({
            items: N,
            expandassembly: "T"
        });
        var E = nlapiServerCall("/app/accounting/transactions/manufacturing/assemblycomponents.nl", "getMulti", [I]);
        var K = JSON.parse(E);
        if (K.components.length === G.length) {
            for (L = G.length - 1; L >= 0; L--) {
                var H = l(K.components[L], G[L], false, I.fieldNames !== undefined);
                if (H > 0) {
                    if (typeof handleAssemblyExpand != "undefined") {
                        handleAssemblyExpand(G[L]);
                    }
                    d(G[L], true);
                }
            }
        }
        nlapiCancelLineItem("item");
        p = false;
        Item_Machine_Recalc();
    }

    function q(G) {
        var F = {
            trandate: nlapiGetFieldValue("trandate"),
            startdate: nlapiGetFieldValue("startdate"),
            subsidiary: nlapiGetFieldValue("subsidiary"),
            expandassembly: nlapiGetFieldValue("expandassembly"),
            usecomponentyield: nlapiGetFieldValue("usecomponentyield"),
            location: nlapiGetFieldValue("location"),
            cf: nlapiGetFieldValue("customform")
        };
        if (hasLegacyMachine()) {
            F.fieldNames = item_machine.getFormFieldNames();
        }
        if (nlapiGetFieldValue("id") > 0) {
            F.id = nlapiGetFieldValue("id");
        }
        for (var E in G) {
            if (G.hasOwnProperty(E)) {
                F[E] = G[E];
            }
        }
        return F;
    }

    function m() {
        if (a) {
            if (getEncodedItemValue(a, "itemtype") == "Assembly") {
                var E = ifNaNThen(getAssemblyLevel(a), 0);
                setItemMachValue("assemblylevel", E + 1);
                setItemMachValue("indentlevel", E);
            }
            a = null;
        } else {
            if (hasLegacyMachine() && nlapiGetCurrentLineItemIndex("item") > nlapiGetLineItemCount("item") && !isValEmpty(getItemMachValue("assemblylevel"))) {
                setItemMachValue("assemblylevel", 1);
                setItemMachValue("indentlevel", 0);
            }
        }
    }

    function f() {
        m();
        if (hasLegacyMachine() && item_machine.ischanged) {
            return;
        }
        for (var E in D) {
            if (D.hasOwnProperty(E)) {
                var F = D[E];
                w[F] = getItemMachValue(F);
            }
        }
    }

    function i() {
        var G = nlapiGetFieldValue("usecomponentyield") == "T";
        var E = getItemMachValue("componentyield");
        var F = getItemMachValue("bomquantity");
        if (G) {
            if (isValEmpty(E)) {
                nlapiSetCurrentLineItemValue("item", "componentyield", "100", true);
            }
            if (isValEmpty(F)) {
                nlapiSetCurrentLineItemValue("item", "bomquantity", "1", true);
            }
        } else {
            setItemMachValue("componentyield", "");
            setItemMachValue("bomquantity", "");
        }
    }

    function u() {
        if (p) {
            return true;
        }
        var E = nlapiGetFieldValue("usecomponentyield");
        if (E == "T" && (isValEmpty(getItemMachValue("componentyield")) || isValEmpty(getItemMachValue("bomquantity")))) {
            alert("Please enter Component Yield and BoM Quantity. on line " + nlapiGetCurrentLineItemIndex("item"));
            return false;
        }
        return true;
    }

    function A() {
        return p;
    }

    function z(F, E) {
        if (E) {
            nlapiSelectLineItem("item", E);
        }
        setItemMachValue("notinvtcommittable", (F ? "T" : "F"));
        if (hasItemMachField("inventorydetail") && getItemMachValue("isnumbered") == "T") {
            if (F) {
                disableInventoryDetailSubrecord();
                removeMachineSubrecord();
            } else {
                enableInventoryDetailSubrecord();
            }
        }
        if (hasItemMachField("serialnumbers") && getItemMachValue("isserialorlotitem") == "T" && F) {
            setItemMachValue("serialnumbers", "");
        }
        if (E) {
            nlapiCommitLineItem("item", E);
        }
    }

    function h() {
        var I = nlapiGetFieldValue("location");
        var M = nlapiGetLineItemCount("item");
        if (M > 0) {
            var K = {};
            for (var H = 1; H <= M; H++) {
                var E = parseInt(getEncodedItemValue(H, "item"), 10);
                var J = parseInt(getEncodedItemValue(H, "units"), 10);
                J = isNaN(J) ? null : J;
                K[E] = J;
            }
            var G = nlapiServerCall("/app/accounting/transactions/manufacturing/workorderformhandler.nl", "selectMachineValuesForLocation", [K, I]);
            var L = G.list;
            if (!L || L.length === 0) {
                return;
            }
            nlapiSelectLineItem("item", 1);
            for (var H = 1; H <= M; H++) {
                var E = getEncodedItemValue(H, "item");
                for (var F = 0; F < L.length; F++) {
                    if (L[F].key == E && L[F].availableQuantity != null && L[F].onHandQuantity != null) {
                        nlapiSetLineItemValue("item", "quantityavailable", H, L[F].availableQuantity);
                        nlapiSetLineItemValue("item", "quantityonhand", H, L[F].onHandQuantity);
                        break;
                    }
                }
            }
            nlapiCancelLineItem("item", -1);
        }
    }
    return {
        addChildComponent: r,
        initialize: c,
        initItemLine: f,
        isInternal: A,
        markAllPhantom: C,
        postDeleteLine: n,
        postProcessLine: B,
        slaveComponentYieldFields: i,
        validateLine: u,
        updateItemsStockQuantitiesForLocation: h
    };
})();