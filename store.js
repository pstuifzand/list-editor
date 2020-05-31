import _ from 'lodash';

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
        return newItems[0].id
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
     * @param {int} first
     * @returns {int}
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
        debug
    };
}

export default Store;

