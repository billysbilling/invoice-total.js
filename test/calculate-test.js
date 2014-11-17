var assert = require('assert')
var expect = require('chai').expect
var c = require('../index')

describe('invoice-total', function() {
    var subject

    describe('with taxMode=excl', function() {
        describe('with only quantity and unitPrice', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 2,
                        unitPrice: 5

                    }
                ])
            })

            it('multiplies quantity and unit price', function() {
                assert.equal(subject.netAmount, 10)
            })

            it('has no tax', function() {
                assert.equal(subject.tax, 0)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 10)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 10,
                        discountAmount: 0
                    }
                ])
            })

            it('has no taxLines', function() {
                expect(subject.taxLines).to.deep.equal([])
            })
        })

        describe('with quantity and unitPrice with many decimals', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 3.42,
                        unitPrice: 12.345

                    }
                ])
            })

            it('rounds to 2 decimals', function() {
                assert.equal(subject.netAmount, 42.22)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 42.22,
                        discountAmount: 0
                    }
                ])
            })
        })

        describe('with discountMode=percent', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 1.98,
                        unitPrice: 98.76,
                        discountMode: 'percent',
                        discountValue: 0.23
                    }
                ])
            })

            it('subtracts percentage', function() {
                assert.equal(subject.netAmount, 150.57)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 195.54,
                        discountAmount: 44.97
                    }
                ])
            })
        })

        describe('with discountMode=cash', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 7.5,
                        unitPrice: 19.99,
                        discountMode: 'cash',
                        discountValue: 7.15
                    }
                ])
            })

            it('subtracts value', function() {
                assert.equal(subject.netAmount, 142.78)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 149.93,
                        discountAmount: 7.15
                    }
                ])
            })
        })

        describe('with multiple lines', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 17.67,
                        unitPrice: 8.99
                    },
                    {
                        quantity: 17.67,
                        unitPrice: 8.99
                    }
                ])
            })

            it('rounds per line', function() {
                assert.equal(subject.netAmount, 317.7)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 158.85,
                        discountAmount: 0
                    },
                    {
                        amount: 158.85,
                        discountAmount: 0
                    }
                ])
            })
        })

        describe('with multiple lines with discount', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 1.23,
                        unitPrice: 19.99,
                        discountMode: 'percent',
                        discountValue: 0.01
                    },
                    {
                        quantity: 1.23,
                        unitPrice: 19.99,
                        discountMode: 'percent',
                        discountValue: 0.01
                    }
                ])
            })

            it('rounds per line', function() {
                assert.equal(subject.netAmount, 48.68)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 24.59,
                        discountAmount: 0.25
                    },
                    {
                        amount: 24.59,
                        discountAmount: 0.25
                    }
                ])
            })
        })

        describe('with tax', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 900.6712,
                        unitPrice: 87.1198,
                        currentTaxRate: 0.075
                    }
                ])
            })

            it('calculates amount', function() {
                assert.equal(subject.netAmount, 78466.29)
            })

            it('calculates tax', function() {
                assert.equal(subject.tax, 5884.97)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 84351.26)
            })

            it('has taxLines', function() {
                expect(subject.taxLines).to.deep.equal([
                    {
                        name: null,
                        rate: 0.075,
                        amount: 5884.97
                    }
                ])
            })
        })

        describe('with tax on multiple lines', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 1,
                        unitPrice: 0.02,
                        currentTaxRate: 0.25
                    },
                    {
                        quantity: 1,
                        unitPrice: 0.02,
                        currentTaxRate: 0.25
                    }
                ])
            })

            it('calculates amount', function() {
                assert.equal(subject.netAmount, 0.04)
            })

            it('rounds at the end', function() {
                assert.equal(subject.tax, 0.01)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 0.05)
            })

            it('has taxLines', function() {
                expect(subject.taxLines).to.deep.equal([
                    {
                        name: null,
                        rate: 0.25,
                        amount: 0.01
                    }
                ])
            })
        })

        describe('with different tax on multiple lines', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: 1,
                        unitPrice: 100,
                        currentTaxRate: 0.25,
                        name: 'Sales VAT'
                    },
                    {
                        quantity: 1,
                        unitPrice: 10,
                        currentTaxRate: 0.25,
                        name: 'Sales VAT'
                    },
                    {
                        quantity: 1,
                        unitPrice: 500,
                        currentTaxRate: 0.1,
                        name: 'Weird VAT'
                    }
                ])
            })

            it('groups taxLines per rate', function() {
                expect(subject.taxLines).to.deep.equal([
                    {
                        name: null,
                        rate: 0.25,
                        amount: 27.5
                    },
                    {
                        name: null,
                        rate: 0.1,
                        amount: 50
                    }
                ])
            })
        })

        describe('with undefined values', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
                    {
                        quantity: undefined,
                        unitPrice: undefined,
                        currentTaxRate: undefined
                    }
                ])
            })

            it('is 0', function() {
                assert.equal(subject.netAmount, 0)
                assert.equal(subject.tax, 0)
                assert.equal(subject.grossAmount, 0)
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 0,
                        discountAmount: 0
                    }
                ])
                expect(subject.taxLines).to.deep.equal([])
            })
        })

        describe('big combination', function() {
            before(function() {
                subject = c({
                    taxMode: 'excl'
                }, [
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
                ])
            })

            it('calculates amount', function() {
                assert.equal(subject.netAmount, 13732.69)
            })

            it('calculates tax', function() {
                assert.equal(subject.tax, 471.64)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 14204.33)
            })
        })
    })

    describe('with taxMode=incl', function() {
        describe('with tax', function() {
            before(function() {
                subject = c({
                    taxMode: 'incl'
                }, [
                    {
                        quantity: 1,
                        unitPrice: 500,
                        currentTaxRate: 0.25
                    }
                ])
            })

            it('subtracts tax from amount', function() {
                assert.equal(subject.netAmount, 400)
            })

            it('calculates tax using reverse rate', function() {
                assert.equal(subject.tax, 100)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 500)
            })

            it('has lines', function() {
                expect(subject.lines).to.deep.equal([
                    {
                        amount: 500,
                        discountAmount: 0
                    }
                ])
            })
        })

        describe('big combination', function() {
            before(function() {
                subject = c({
                    taxMode: 'incl'
                }, [
                    {//amount: 12, tax: 0
                        quantity: 3,
                        unitPrice: 4
                    },
                    {//amount: 10, tax: 2
                        quantity: 1,
                        unitPrice: 10,
                        currentTaxRate: 0.25
                    },
                    {//amount: 163.42, tax: 11.401395349
                        quantity: 8.99,
                        unitPrice: 18.178,
                        currentTaxRate: 0.075
                    },
                    {//amount: 3097.86, tax: 147.517142857
                        quantity: 3.89,
                        unitPrice: 799.1719,
                        discountMode: 'cash',
                        discountValue: 10.92,
                        currentTaxRate: 0.05
                    },
                    {//amount: 10449.41, tax: 293.505636116
                        quantity: 917.0123,
                        unitPrice: 12.9999,
                        discountMode: 'percent',
                        discountValue: 0.12345,
                        currentTaxRate: 0.0289
                    }
                ])
            })

            it('calculates amount', function() {
                assert.equal(subject.netAmount, 13278.27)
            })

            it('calculates tax', function() {
                assert.equal(subject.tax, 454.42)
            })

            it('adds tax to gross', function() {
                assert.equal(subject.grossAmount, 13732.69)
            })
        })
    })

    describe('.line()', function() {
        describe('without discount', function() {
            before(function() {
                subject = c.line({
                    taxMode: 'incl'
                }, {
                    quantity: 3.57,
                    unitPrice: 111.23
                })
            })

            it('calculates', function() {
                expect(subject).to.deep.equal({
                    amount: 397.09,
                    discountAmount: 0
                })
            })
        })

        describe('with discount', function() {
            before(function() {
                subject = c.line({
                    taxMode: 'incl'
                }, {
                    quantity: 1.01,
                    unitPrice: 198.9876,
                    discountMode: 'percent',
                    discountValue: 0.23
                })
            })

            it('calculates', function() {
                expect(subject).to.deep.equal({
                    amount: 200.98,
                    discountAmount: 46.23
                })
            })
        })
    })
})
