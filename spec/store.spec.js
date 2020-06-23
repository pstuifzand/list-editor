import createStore from '../store'

describe("A store", function() {
    beforeEach(function() {
        this.store = createStore([
            {text:"Hello", id:"_a", indent:0}
        ])
    })

    it("contains a length method", function() {
        expect(this.store.length()).toBe(1)
    })

    it("contains an append method", function() {
        this.store.append({text:"1"})
        expect(this.store.length()).toBe(2)
    })

    it("contains an nextCursorPosition method", function() {
        this.store.append({text:"1"})
        expect(this.store.length()).toBe(2)
    })
})

