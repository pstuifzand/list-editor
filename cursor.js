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
        getCurrent(data) {
            return {
                id: data[cursor].id,
                indented: data[cursor].indented,
                selected: cursor,
            }
        },
        getSelectedElement(elements) {
            return elements.slice(cursor, cursor + 1);
        },
        save() {
            return createCursor(cursor);
        },
        moveUp(data) {
            cursor--;
            if (cursor < 0) {
                cursor = data.length - 1;
            }
        },
        moveDown(data) {
            cursor++;
            if (cursor >= data.length) {
                cursor = 0;
            }
        },
        remove(data) {
            data.splice(cursor, 1)
            return data
        },
        insertAbove(data, item) {
            data.splice(cursor, 0, item);
            return data
        },
        insertBelow(data, item) {
            cursor++;
            data.splice(cursor, 0, item);
            return data
        }
    };
}

export default createCursor;
