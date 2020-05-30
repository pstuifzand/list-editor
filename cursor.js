function createCursor(start) {
    let cursor = start;

    return {
        get() {
            return cursor;
        },
        set(newPosition) {
            cursor = newPosition;
        },
        atFirst() {
            return cursor === 0;
        },
        atPosition(other) {
            return cursor === other;
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
            cursor--;
            if (cursor < 0) {
                cursor = store.length() - 1;
            }
        },
        moveDown(store) {
            cursor++;
            if (cursor >= store.length()) {
                cursor = 0;
            }
        },
        remove(store) {
            store.remove(cursor, 1)
        },
        insertAbove(store, item) {
            store.insertBefore(store.currentID(cursor), item)
        },
        insertBelow(store, item) {
            store.insertAfter(store.currentID(cursor), item)
            cursor++
        }
    };
}

export default createCursor;
