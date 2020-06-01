// consecutive for now
function createSelection() {
    let first = -1;
    let last = -1;

    return {
        reset() {
            first = -1
            last = -1
        },

        /**
         * @param {int} f
         * @param {Store} store
         */
        selectOne(f, store) {
            if (f > last) {
                last = first
            }
            first = f
            last = first + 1
        },

        selectNothing(f) {
            first = f
            last = f
        },

        remove(store) {
            store.remove(first, last - first)
        },

        hasSelection() {
            return first >= 0 && last >= 0 && first !== last
        },

        isSelected(line) {
            return first >= 0 && last >= 0 && line >= first && line < last
        },

        isSelectedFirst(line) {
            return first >= 0 && last >= 0 && line === first && line < last
        },

        isSelectedLast(line) {
            return first >= 0 && last >= 0 && line >= first && line < last && line + 1 === last
        },

        indent(store, dir) {
            store.indent(first, last - first, dir)
        },

        /**
         * @param {int} index
         * @param store
         */
        include(index, store) {
            first = Math.min(first, index)
            last = Math.max(last, index + 1);
        },

        debug() {
            return {first, last}
        }
    };
}


export default createSelection
