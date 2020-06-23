import createStore from '../store'

describe("A store", function () {
    beforeEach(function () {
        this.store = createStore([
            {text: "Hello", id: "_a", indented: 0}
        ])
    })

    it("contains a length method", function () {
        expect(this.store.length()).toBe(1)
    })

    it("contains an append method", function () {
        this.store.append({text: "1"})
        expect(this.store.length()).toBe(2)
    })

    it("contains an nextCursorPosition method", function () {
        this.store.append({text: "1"})
        expect(this.store.length()).toBe(2)
    })

    it("contains an indent method", function () {
        this.store.append({text: "1", indented: 0})
        this.store.append({text: "2", indented: 1})
        this.store.append({text: "3", indented: 2})
        this.store.indent(1, 3, 1)

        expect(this.store.value(this.store.currentID(0)).indented).toBe(0)
        expect(this.store.value(this.store.currentID(1)).indented).toBe(1)
        expect(this.store.value(this.store.currentID(2)).indented).toBe(2)
        expect(this.store.value(this.store.currentID(3)).indented).toBe(3)
    })

    it("contains a lastHigherIndented method", function () {
        this.store.append({text: "1", indented: 0})
        this.store.append({text: "2", indented: 1})
        this.store.append({text: "3", indented: 2})
        this.store.append({text: "3", indented: 0})

        expect(this.store.lastHigherIndented(1)).toBe(4)
    })
})

