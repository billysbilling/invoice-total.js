var BigNumber = require('bignumber.js')

var moneyScale = 2
var taxRateScale = 6
var zero = new BigNumber('0')
var one = new BigNumber('1')

var invoiceTotal = module.exports = function(invoice, lines) {
    var amount = zero
    var tax = zero
    var linesOut = []
    var taxLinesByRate = {}

    if (lines) {
        lines.forEach(function(line) {
            var r = lalaLine(invoice, line)

            //Add the line's amount to the total amount
            amount = amount.plus(r.amountAfterDiscount)

            if (r.currentTaxRate !== null) {
                //Add the line's tax to the total tax, still no rounding
                tax = tax.plus(r.tax)

                //Add the line's tax to the appropriate tax line group
                if (!taxLinesByRate[r.currentTaxRate]) {
                    taxLinesByRate[r.currentTaxRate] = r.tax
                } else {
                    taxLinesByRate[r.currentTaxRate] = taxLinesByRate[r.currentTaxRate].plus(r.tax)
                }
            }

            linesOut.push({
                amount: r.amount.toNumber(),
                discountAmount: r.discountAmount.toNumber()
            })
        })
    }

    //Round tax once at the end
    tax = tax.round(moneyScale)

    //If taxMode is incl we need to subtract tax from amount, so it becomes the net amount
    var netAmount
    var grossAmount
    if (invoice.taxMode === 'incl') {
        netAmount = amount.minus(tax)
        grossAmount = amount
    } else {
        netAmount = amount
        grossAmount = amount.plus(tax)
    }

    //Make nice taxLines array
    var taxLines = []
    for (var rate in taxLinesByRate) {
        taxLines.push({
            rate: +rate,
            amount: taxLinesByRate[rate].round(moneyScale).toNumber()
        })
    }

    return {
        netAmount: netAmount.toNumber(),
        tax: tax.toNumber(),
        grossAmount: grossAmount.toNumber(),
        lines: linesOut,
        taxLines: taxLines
    }
}

invoiceTotal.line = function(invoice, line) {
    var r = lalaLine(invoice, line)
    return {
        amount: r.amount.toNumber(),
        discountAmount: r.discountAmount.toNumber()
    }
}

function lalaLine(invoice, line) {
    //Round the amount for the line
    var quantity = new BigNumber('' + (line.quantity || 0))
    var unitPrice = new BigNumber('' + (line.unitPrice || 0))
    var lineAmount = quantity.times(unitPrice).round(moneyScale)

    //Subtract discount
    var discountAmount
    if (line.discountMode === 'percent') {
        var percentage = new BigNumber('' + line.discountValue)
        discountAmount = lineAmount.times(percentage).round(moneyScale)
    } else if (line.discountMode === 'cash') {
        discountAmount = new BigNumber('' + line.discountValue).round(moneyScale)
    } else {
        discountAmount = zero
    }

    var amountAfterDiscount = lineAmount.minus(discountAmount)

    var tax
    var currentTaxRate
    if (line.currentTaxRate) {
        var currentTaxRate = new BigNumber('' + line.currentTaxRate)

        //Caculate the line's tax without rounding it
        if (invoice.taxMode === 'incl') {
            tax = amountAfterDiscount.times(reverseRate(currentTaxRate))
        } else {
            tax = amountAfterDiscount.times(currentTaxRate)
        }
    } else {
        tax = zero
        currentTaxRate = null
    }

    return {
        amount: lineAmount,
        discountAmount: discountAmount,
        amountAfterDiscount: amountAfterDiscount,
        currentTaxRate: currentTaxRate,
        tax: tax
    }
}

//Returns a rate that can be multiplied to a gross amount to get the net amount.
function reverseRate(rate) {
    return rate.dividedBy(one.plus(rate))
}
