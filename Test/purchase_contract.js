/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/search', 'N/log'], function(search, log) {

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var currentField = context.fieldId;
        console.log('currentField', currentField);

        if (currentField === 'purchasecontract') {
            var PurchCon = currentRecord.getValue({
                fieldId: 'purchasecontract'
            });
            console.log('PurchCon', PurchCon);

            if (PurchCon) {
                var itemSearch = search.load({
                    id: 'customsearch3026'
                });

                var defaultFilters = itemSearch.filters;
                console.log('defauult filters', defaultFilters);

                var itemSearchFilter = search.createFilter({
                    name: 'internalid',
                    join: 'transaction',
                    operator: search.Operator.IS,
                    values: PurchCon
                });

                var filtersArray = [itemSearchFilter];
                console.log('filterArray', filtersArray);

                itemSearch.filters = filtersArray;
                itemSearch.save();
                console.log('Successfully', 'Saved!')
            }
        }

    }
    return {
        fieldChanged: fieldChanged
    };
});