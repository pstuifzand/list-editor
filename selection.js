// consecutive for now
function createSelection() {
    let first = -1;
    let last = -1;

    return {
        reset() {
            first = -1
            last  = -1
        },

        setFirst(f) {
            if (f > last) {
                last = first
            }
            first = f
        },

        setLast(l) {
            if (l < first) {
                first = last
            }
            last = l
        },

        remove(data) {
            data.splice(first, last-first)
            return data
        },

        hasSelection() {
            return first >= 0 && last >= 0
        },

        isSelected(line) {
            return first >= 0 && last >= 0 && line >= first && line < last
        },

        isSelectedFirst(line) {
            return first >= 0 && last >= 0 && line === first
        },

        isSelectedLast(line) {
            return first >= 0 && last >= 0 && line < last && line+1 === last
        },

        indent(data, dir) {
            let removed = data.splice(first, last-first)
            removed = _.reduce(removed, function (list, item) {
                if (first === 0 && list.length === 0) {
                    item.indented = 0
                } else {
                    let indent = item.indented + dir
                    let prevIndent = 
                        list.length === 0 
                        ? data[first-1].indented
                        : _.last(list).indented

                    indent = Math.max(0, indent)

                    if (Math.abs(prevIndent - indent) <= 1) {
                        item.indented = indent
                    }
                }
                list.push(item)
                return list
            }, [])
            data.splice(first, 0, ...removed)
            return data
        },

        include(index) {
            first = Math.min(first, index)
            last = Math.max(last, index+1);
        },

        debug() {
            return { first, last }
        }
    };
}


export default createSelection
