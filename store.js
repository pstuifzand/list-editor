import _ from 'lodash';

/**
 * NOTE: Store should contain all methods that work with items. At the moment
 * there are still a few places where we change the items from the outside,
 * while it's very important that the items behave a certain way.
 */

function Store(inputData) {
    let idList = [];
    let values = {};

    let ID = function () {
        return '_' + Math.random().toString(36).substr(2, 12);
    };

    /**
     * @param {int} index
     * @returns {string}
     */
    function currentID(index) {
        if (index === idList.length) {
            return 'at-end'
        }
        return idList[index];
    }

    /**
     * @param {string} id
     * @returns {number}
     */
    function index(id) {
        return _.findIndex(idList, value => value === id)
    }

    /**
     * @param {string} id
     * @return {object}
     */
    function value(id) {
        return values[id];
    }

    /**
     * @param {string} afterId
     * @return {object}
     */
    function afterValue(afterId) {
        let i = index(afterId)
        return values[idList[i + 1]]
    }

    function prevCursorPosition(cursor) {
        let curIndent = values[idList[cursor]].indented
        let curClosed = values[idList[cursor]].fold !== 'open';
        if (!curClosed) {
            curIndent = 10000000;
        }
        let moving = true

        while (moving) {
            cursor--
            if (cursor < 0) {
                cursor = idList.length - 1
                curIndent = values[idList[cursor]].indented
            }
            let next = values[idList[cursor]];
            if (curIndent >= next.indented && !next.hidden) {
                moving = false
            }
        }

        return cursor
    }

    /**
     * Find the next 'open' position in the list.
     *
     * @param {number} cursor
     * @param {bool} wrap
     * @returns {number}
     */
    function nextCursorPosition(cursor, wrap) {
        let curIndent = values[idList[cursor]].indented
        let curClosed = values[idList[cursor]].fold !== 'open';
        if (!curClosed) {
            curIndent = 10000000;
        }
        let moving = true

        while (moving) {
            cursor++
            if (wrap) {
                if (cursor >= idList.length) {
                    cursor = 0
                    curIndent = 0
                }
            } else {
                return cursor
            }
            let next = values[idList[cursor]];
            if (curIndent >= next.indented) {
                moving = false
            }
        }

        return cursor
    }

    /**
     *
     * @param {string} beforeId
     * @param {object} item
     * @returns {string}
     */
    function insertBefore(beforeId, item) {
        let index = _.findIndex(idList, (id) => id === beforeId)
        let id = item.id
        if (!id) {
            let newId = ID()
            item.id = newId
            values[newId] = item
            id = newId
        }
        idList.splice(index, 0, id)
        return id
    }

    /**
     * @param {string} afterId
     * @param {object} items
     * @returns {string}
     */
    function insertAfter(afterId, ...items) {
        if (afterId === 'at-end') {
            let newItems = _.map(items, item => {
                return this.append(item)
            })
            return newItems[0]
        }

        let index = _.findIndex(idList, (id) => id === afterId)

        let newItems = _.map(items, item => {
            let id = item.id;
            if (!id) {
                let newId = ID()
                item.id = newId
                values[newId] = item
            }
            return item.id
        })
        idList.splice(index + 1, 0, ...newItems)
        return newItems[0]
    }

    /**
     * @param {object} item
     * @returns {string}
     */
    function append(item) {
        let id = item.id;
        if (!item.id || item.id[0] !== '_') {
            let newId = ID();
            item.id = newId
            id = newId
        }
        delete item.children
        values[id] = item;
        idList.push(id)
        return id;
    }

    /**
     * @callback updateCallback
     * @param {object} item
     * @param {object} prev
     * @param {object} next
     * @return {object}
     */
    /**
     * @param {string} currentId
     * @param {updateCallback} callback
     * @returns {*}
     */
    function update(currentId, callback) {
        let index = _.findIndex(idList, (id) => id === currentId)
        values[currentId] = callback(values[currentId], values[idList[index - 1]], values[idList[index + 1]])
        return currentId
    }

    function length() {
        return idList.length;
    }

    /**
     * @returns {{result: Array, values: {}, idList: []}}
     */
    function debug() {
        let result = _.map(idList, (id) => {
            return values[id];
        });
        return {
            result,
            idList,
            values
        }
    }

    function remove(start, len) {
        idList.splice(start, len)
    }

    /**
     * @param {int} start
     * @param {int} end
     * @returns {string[]}
     */
    function slice(start, end) {
        return idList.slice(start, end)
    }

    /**
     *
     * @param {int} first
     * @param {int} len
     * @param {int} dir
     */
    function indent(first, len, dir) {
        let selection = idList.slice(first, first + len)

        let result = _.reduce(selection, function (list, itemId) {
            let item = values[itemId]
            if (first === 0 && list.length === 0) {
                values[itemId].indented = 0
            } else {
                let indent = item.indented + dir
                let prevIndent =
                    list.length === 0
                        ? values[idList[first - 1]].indented
                        : _.last(list).indented

                indent = Math.max(0, indent)

                if (list.length === 0) {
                    values[idList[first - 1]].fold = 'open'
                } else {
                    _.last(list).fold = 'open'
                }

                if (indent < prevIndent || Math.abs(prevIndent - indent) <= 1) {
                    values[itemId].indented = indent
                }
            }
            list.push(item)
            return list
        }, [])
    }

    /**
     * @param {string} from
     * @param {string} to
     * @returns {string}
     */
    function moveBefore(from, to) {
        let fromIndex = _.findIndex(idList, (id) => id === from)
        let item = values[from]
        remove(fromIndex, 1)
        return insertBefore(to, item)
    }

    /**
     * @param {Number} first
     * @param {Number} indent
     * @returns {Number}
     */
    function firstSameIndented(first, indent) {
        if (first <= 0 || first >= idList.length) return first
        first--
        while (first > 0 && values[idList[first]].indented > indent) {
            first--
        }
        return first
    }

    /**
     * @param {int} first
     * @returns {int}
     */
    function lastHigherIndented(first) {
        if (first < 0 || first >= idList.length) return first
        let minLevel = values[idList[first]].indented
        first++;
        while (first !== idList.length && values[idList[first]].indented > minLevel) {
            first++
        }
        return first
    }

    function selectItemsFrom(from) {
        if (!from) {
            return _.map(idList, id => values[id])
        }

        let first = _.findIndex(idList, id => id === from)
        let items = _.map(idList.slice(first + 1), id => values[id])
        return [values[from], ..._.takeWhile(items, item => item.indented > values[from].indented)]
    }

    function flat(from) {
        return selectItemsFrom(from)
    }

    /**
     * Return a tree starting at from node down.
     * @param from
     * @returns {*}
     */
    function tree(from) {
        let items = selectItemsFrom(from)

        let top = (stack) => {
            return stack[stack.length - 1];
        }

        let pop = (stack) => {
            stack.pop()
        }
        let push = (stack, item) => {
            stack.push(item)
        }

        const stack = _.reduce(items, (stack, item) => {
            if (stack.length === 0) {
                return [[item]]
            }

            const stackIndented = top(stack)[0].indented
            const itemIndented = item.indented

            if (itemIndented > stackIndented) {
                push(stack, [Object.assign({}, item)])
            } else {
                while (stack.length > 1 && itemIndented < stackIndented) {
                    let children = top(stack)
                    pop(stack)
                    let cur = top(stack)
                    cur[cur.length - 1].children = children
                }
                top(stack).push(Object.assign({}, item))
            }
            return stack
        }, [])

        while (stack.length > 1) {
            let children = top(stack)
            pop(stack)
            let item = top(stack)
            item[item.length - 1].children = children
        }

        return top(stack)
    }

    _.each(inputData, (d) => {
        append(d)
    })

    return {
        currentID,
        index,
        value,
        afterValue,
        insertBefore,
        insertAfter,
        indent,
        append,
        update,
        length,
        slice,
        remove,
        moveBefore,
        firstSameIndented,
        lastHigherIndented,
        prevCursorPosition,
        nextCursorPosition,
        debug,
        tree,
        flat
    };
}

export default Store;

