import createCursor from '../cursor'
import createStore from '../store'

describe("A cursor", function() {
    beforeEach(function() {
        this.cursor = createCursor(0)
    })

    it("contains a get method", function() {
        expect(this.cursor.get()).toBe(0)
    })

    it("contains a set method", function() {
        this.cursor.set(4)
        expect(this.cursor.get()).toBe(4)
    })

    it("contains an atFirst method", function() {
        expect(this.cursor.atFirst()).toBe(true)
    })

    describe("with a store", function () {
        beforeEach(function () {
            this.store = createStore([])
        })

        it("contains an atEnd method", function () {
            this.cursor.set(0)
            expect(this.cursor.atEnd(this.store)).toBe(true)
        })
    })

    describe("with a store", function () {
        beforeEach(function () {
            this.store = createStore([
                {indented:0, fold: 'open'},
                {indented:1, fold: 'open'},
                {indented:2, fold: 'open'},
                {indented:3, fold: 'open'},
                {indented:1, fold: 'open'},
            ])
        })

        it("moveUp moves up by one", function() {
            this.cursor.set(4)
            this.cursor.moveUp(this.store)
            expect(this.cursor.get()).toBe(3)
        })
    })
})

