var Benchmark = require('benchmark'),
    c = require('./index')

var suite = new Benchmark.Suite()

suite.add('invoice-total', function() {
    c({
      taxMode: 'excl',
      lines: [
          {//amount: 12, tax: 0
              quantity: 3,
              unitPrice: 4
          },
          {//amount: 10, tax: 2.5
              quantity: 1,
              unitPrice: 10,
              currentTaxRate: 0.25
          },
          {//amount: 163.42, tax: 12.2565
              quantity: 8.99,
              unitPrice: 18.178,
              currentTaxRate: 0.075
          },
          {//amount: 3097.86, tax: 154.893
              quantity: 3.89,
              unitPrice: 799.1719,
              discountMode: 'cash',
              discountValue: 10.92,
              currentTaxRate: 0.05
          },
          {//amount: 10449.41, tax: 301.987949
              quantity: 917.0123,
              unitPrice: 12.9999,
              discountMode: 'percent',
              discountValue: 0.12345,
              currentTaxRate: 0.0289
          }
      ]
    })
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.on('complete', function() {
    console.log('Done')
})
.run({ 'async': true });
