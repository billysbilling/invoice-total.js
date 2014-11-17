# Specification

The total for an invoice consist of:

- `netAmount` - The total of the invoice excluding taxes
- `grossAmount` - The total of the invoice including taxes
- `tax` - The total taxes


## Input

To be able to calculate the total you need the following invoice properties:

- `taxMode` - String that must be either `excl` or `incl`. If unset, it must default to `excl`. It indicates whether lines' `unitPrice` is including or excluding tax.

And an a list of lines containing the following properties for each line:

- `quantity` - A float. Can be both positive and negative.
- `unitPrice` - A float. Can be both positive and negative.
- `discountMode` - Either `null` or a string that must be either `percent` or `cash`.
- `discountValue` - A float. If `discountMode=percent` it represents a percentage on decimal form, i.e. `discountValue=0.2` means 20%, to subtract from the line's price. If `discountMode=cash` it represents a money amount to subtract from the line's price.
- `currentTaxRate` - A float between 0 and 1.

Before we can calculate the invoice's totals, we need to calculate some helper values for each line: `lineAmount` and `lineTax`.


## Calculating `lineAmount`

The `lineAmount` for a line is given by the rounded product of `quantity` and `unitPrice`.

If the line's `discountMode=percent` we need to subtract that percentage and round again.

If the line's `discountMode=cash` we need to subtract the discount value and round again.

```
lineAmount = round(quantity * unitPrice)
if discountMode == 'percent'
	lineAmount = round(lineAmount * (1 - discountValue))
end
if discountMode == 'cash'
	lineAmount = round(lineAmount - discountValue)
end
```

The lines' amounts need to be rounded at each step, since that's the amount we will be showing on the invoice at the end of each line, and there we only use 2 decimals.


## Calculating `lineTax`

The `lineTax` for a line is calculated differently depending on `taxMode`.

If `taxMode=incl` then `lineTax` is given by the product of `lineAmount` and the reverse of `currentTaxRate` (see proof for this reversion formula below):

Otherwise `lineTax` is given by the product of `lineAmount` and `currentTaxRate`:

```
if taxMode == 'incl'
	lineTax = lineAmount * currentTaxRate / (1 + currentTaxRate)
else
	lineTax = lineAmount * currentTaxRate
end
```

The lines' tax is not rounded, since we only round the tax in the end. Rounding at each line would make the total counter intuitive when looking at the invoice.


## Calculating `tax`

The total `tax` of the invoice is given by the rounded sum of each line's `lineTax`:

```
tax = 0
foreach lineTax
tax += lineTax
end
tax = round(tax)  
```


## Calculating `netAmount`

The total `netAmount` of the invoice is given by the sum of each line's `lineAmount`:

If `taxMode=incl`, that number will actually be the gross amount, so we also need to subtract the total `tax` from the amount in that case:

```
amount = 0
foreach lineAmount
amount += lineAmount
end
if taxMode == 'incl'
amount -= tax
end
```

## Calculating `grossAmount`

The invoice's `grossAmount` is given by the sum of `netAmount` and `tax`:

```
grossAmount = netAmount + tax
```


## Common pitfalls

- Be careful when calculating with floating point values. Make sure that calculations such as `7.5 * 19.99` gives `14.925` which rounded is `14.93`, and not `149.92499999999998` which rounded is `149.92`. In JavaScript you can use something like [bignumber.js](https://github.com/MikeMcl/bignumber.js).
- All the outputted numbers must be rounded to 2 decimals.


## Proof for the formula that reverses the tax rate

We have the following two equations for converting between net amount and gross amount:

```
grossAmount = netAmount * (1 + rate)                (1)
netAmount = grossAmount * reverseRate               (2)
```

If we insert the definition of `grossAmount` from (1) into its place in (2) we get:

```
netAmount = netAmount * (1 + rate) * reverseRate
<=>
1 = (1 + rate) * reverseRate
<=>
1 / (1 + rate) = reverseRate
```
