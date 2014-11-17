var BigNumber = require('bignumber.js')

var moneyScale = 2
var taxRateScale = 6
var zero = new BigNumber('0')
var one = new BigNumber('1')

module.exports = function(invoice, lines) {
    var amount = zero
    var tax = zero
    var linesOut = []
    var taxLinesByRate = {}

    if (lines) {
        lines.forEach(function(line) {
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

            var lineAmountWithDiscount = lineAmount.minus(discountAmount)

            //Add the line's amount to the total amount
            amount = amount.plus(lineAmountWithDiscount)

            if (line.currentTaxRate) {
                var rate = new BigNumber('' + line.currentTaxRate)
                var lineTax

                //Caculate the line's tax without rounding it
                if (invoice.taxMode === 'incl') {
                    lineTax = lineAmountWithDiscount.times(reverseRate(rate))
                } else {
                    lineTax = lineAmountWithDiscount.times(rate)
                }

                if (!taxLinesByRate[rate]) {
                    taxLinesByRate[rate] = lineTax
                } else {
                    taxLinesByRate[rate] = taxLinesByRate[rate].plus(lineTax)
                }

                //Add the line's tax to the total tax, still no rounding
                tax = tax.plus(lineTax)
            }

            linesOut.push({
                amount: lineAmount.toNumber(),
                discountAmount: discountAmount.toNumber()
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

//Returns a rate that can be multiplied to a gross amount to get the net amount.
function reverseRate(rate) {
    return rate.dividedBy(one.plus(rate))
}
