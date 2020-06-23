function createCursor(start) {
    let cursor = start;

    return {
        get() {
            return cursor;
        },
        set(newPosition) {
            cursor = newPosition;
        },
        getId(store) {
            return store.currentID(cursor)
        },
        atFirst() {
            return cursor === 0;
        },
        atPosition(other) {
            return cursor === other;
        },
        atEnd(store) {
            return cursor === store.length()
        },
        hasMoved(saved) {
            return cursor !== saved.get()
        },
        getCurrent(store) {
            let id = store.currentID(cursor)
            return store.value(id)
        },
        getCurrentElement(elements) {
            return elements.slice(cursor, cursor + 1);
        },
        save() {
            return createCursor(cursor);
        },
        moveUp(store) {
            cursor = store.prevCursorPosition(cursor)
        },
        moveDown(store) {
            cursor = store.nextCursorPosition(cursor, true)
        },
        remove(store) {
            store.remove(cursor, 1)
        },
        insertAbove(store, item) {
            store.insertBefore(store.currentID(cursor), item)
        },
        insertBelow(store, item) {
            let id = store.insertAfter(store.currentID(cursor), item)
            cursor = store.index(id)
        },
        forwardToNextVisible(store) {
            cursor = store.nextCursorPosition(cursor, false)
        },
    };
}

export default createCursor;
