import _ from 'lodash'
import $ from 'jquery'
import he from 'he'
import textareaAutosizeInit from "./textarea.autosize"
import dragula from 'dragula'
import createCursor from './cursor'
import createSelection from './selection'
import Store from './store'

textareaAutosizeInit($)

function editor(root, inputData, options) {
    root.classList.add('root')

    let cursor = createCursor()
    let selection = createSelection()

    let defaults = {
        transform(text, element) {
            element.html(he.encode(text))
        }
    }

    options = _.merge(defaults, options)

    let drake = null;

    function createStore(inputData) {
        let data = [
            {indented: 0, text: '', fold: 'open'},
        ];
        if (inputData.length) {
            data = inputData
        }
        return Store(data);
    }

    let store = createStore(inputData);

    let events = {
        change: [],
        'start-editing': [],
        'stop-editing': [],
        'rendering': [],
        'rendered': []
    }

    let editing = false
    let currentEditor = null;

    function newListItem(indented) {
        return {indented: indented, text: '', fold: 'open', hidden: false}
    }

    function newItem(value) {
        let el = $('<div class="list-item">')
            .data('id', value.id)
            .data('indented', value.indented)
            .css('margin-left', (value.indented * 32) + 'px')
        let line = $('<div class="line">')
        let content = $('<div class="content">')
        line.prepend(content)
        options.transform(value.text, content)
        line.prepend($('<span class="marker"></span>'))
        line.prepend($('<span class="fold">&#9654;</span>'))
        el.prepend(line)
        return el;
    }

    /**
     * @param {Element} rootElement
     * @param rootData
     */
    function render(rootElement, rootData) {
        trigger('rendering')

        let first = 0;
        let last = rootData.length();

        let elements = $(rootElement).children('div.list-item');

        let $enter = elements.slice(first, last);
        let enterData = rootData.slice(first, $enter.length);

        let exitData = rootData.slice($enter.length);
        let $exitEl = elements.slice($enter.length)

        let hideLevel = 99999;

        $enter.each(function (index, li) {
            let storeId = enterData[index]
            let value = rootData.value(storeId)

            let hasChildren = false;
            if (index + 1 < last) {
                let next = rootData.afterValue(storeId)
                hasChildren = next && (value.indented < next.indented)
            }

            let $li = $(li).data('id', value.id)
                .toggleClass('selected', cursor.atPosition(index))
                .toggleClass('selection-first', selection.isSelectedFirst(index))
                .toggleClass('selection-last', selection.isSelectedLast(index))
                .toggleClass('selection', selection.isSelected(index))
                .toggleClass('hidden', value.indented >= hideLevel)
                .toggleClass('border', value.indented >= 1)
                .css('margin-left', (value.indented * 32) + 'px')
                .find('.content')
            value.hidden = value.indented >= hideLevel

            options.transform(value.text, $li)

            if (value.indented < hideLevel) {
                if (value.fold !== 'open') {
                    hideLevel = value.indented + 1
                } else {
                    hideLevel = 99999;
                }
            }

            $('.fold', $(li))
                .toggleClass('open', value.fold === 'open')
                .toggleClass('no-children', !hasChildren)

            $(li).toggleClass('no-children', !hasChildren)
                .toggleClass('open', value.fold === 'open')
        });

        _.each(exitData, function (storeId, index) {
            let value = rootData.value(storeId)
            let $li = newItem(value)
                .css('margin-left', (value.indented * 32) + 'px')
                .toggleClass('selection-first', selection.isSelectedFirst(index))
                .toggleClass('selection-last', selection.isSelectedLast(index))
                .toggleClass('selection', selection.isSelected(index))
                .toggleClass('selected', cursor.atPosition(index + $enter.length))
                .toggleClass('border', value.indented >= 1)
                .toggleClass('hidden', value.indented >= hideLevel);
            value.hidden = value.indented >= hideLevel

            let hasChildren = false;
            if (enterData.length + index + 1 < last) {
                let next = rootData.afterValue(storeId)
                hasChildren = next && (value.indented < next.indented)
            }

            if (value.indented < hideLevel) {
                if (value.fold === 'open') {
                    hideLevel = 99999;
                } else {
                    hideLevel = value.indented + 1
                }
            }

            $('.fold', $li)
                .toggleClass('open', value.fold === 'open')
                .toggleClass('no-children', !hasChildren)

            $li.toggleClass('no-children', !hasChildren)
                .toggleClass('open', value.fold === 'open')

            $(rootElement).append($li)
        })

        $exitEl.remove()

        trigger('rendered')
    }

    function disableDragging(drake) {
        if (drake) drake.destroy();
    }

    function enableDragging(rootElement) {
        let drake = dragula([rootElement], {
            moves: function (el, container, handle) {
                return handle.classList.contains('marker')
            }
        });

        let start = -1;
        let startID = null;

        drake.on('drag', function (el, source) {
            startID = $(el).data('id')
        })


        drake.on('drop', function (el, target, source, sibling) {
            let stopID = $(sibling).data('id')
            if (startID === stopID) {
                return
            }

            let id = store.moveBefore(startID, stopID)

            let position = store.index(id);
            cursor.set(position)
            selection.selectOne(position, store)

            trigger('change')
        })
        return drake;
    }

    function stopEditing(rootElement, store, element) {
        if (!editing) return
        if (element === null) {
            editing = false
            currentEditor = null
            return
        }

        let text = element.val()
        $(element).closest('.list-item').removeClass('editor');
        store.update(element.data('id'), (value) => {
            return _.merge(value, {
                text: text
            })
        })

        trigger('change')

        let $span = $('<div class="content">');
        options.transform(text, $span)
        element.replaceWith($span);
        trigger('stop-editing', currentEditor[0])
        editing = false
        currentEditor = null
    }

    /**
     * @param {Element} rootElement
     * @param {Store} store
     * @param cursor
     * @returns {jQuery|HTMLElement}
     */
    function startEditing(rootElement, store, cursor) {
        if (editing) return
        editing = true

        let elements = $(rootElement).children('div.list-item');
        let $textarea = $('<textarea rows=1 class="input-line">');
        $textarea.val(cursor.getCurrent(store).text).trigger('input')
        let currentElement = cursor.getCurrentElement(elements);
        currentElement.find('.content').replaceWith($textarea)
        currentElement.addClass('editor');
        $textarea.focus()
        $textarea.data(cursor.getCurrent(store))
        $textarea.textareaAutoSize()
        currentEditor = $textarea
        trigger('start-editing', currentEditor[0])
        return $textarea
    }

    function save() {
        return new Promise(function (resolve, reject) {
            resolve(store.debug().result);
        });
    }

    function saveTree(from) {
        return new Promise(function (resolve, reject) {
            resolve(store.tree(from))
        });
    }

    function copy(element, opt) {
        let item = $(element).parents('.list-item')
        let id = item.data('id')

        if (opt.recursive) {
            return saveTree(id)
        }

        return new Promise(function (resolve, reject) {
            resolve(store.value(id));
        });
    }

    function on(evt, handler) {
        events[evt].push(handler)
    }

    function trigger(event) {
        let args = [...arguments]
        args.splice(0, 1)
        _.each(events[event], function (handler) {
            handler(...args)
        })
    }

    $(root).on('paste', '.input-line', function (event) {
        let tag = event.target.tagName.toLowerCase();
        if (tag === 'textarea' && currentEditor[0].value.substring(0, 3) === '```') {
            return true
        }

        let parentItem = $(this).parents('.list-item')
        let index = $(root).children('div.list-item').index(parentItem)
        let pastedData = event.originalEvent.clipboardData.getData('text')
        let lines = pastedData.split(/\n/)
        if (lines.length === 1) {
            return true;
        }

        let currentID = store.currentID(index);
        let baseIndent = store.value(currentID).indented

        let newItems = _.filter(_.map(lines, function (line) {
            if (line.length === 0) return;
            let matches = line.match(/(\s{4})/g)
            let relIndent = matches ? matches.length : 0;
            let newItem = newListItem(baseIndent + relIndent)
            newItem.text = line.replace(/^\s+/, '')
            return newItem
        }))
        store.insertAfter(currentID, ...newItems)

        disableDragging(drake)
        render(root, store);
        drake = enableDragging(root)
        return false
    });

    $(root).on('keydown', '.input-line', function (event) {
        if (event.key === 'Escape') {
            stopEditing(root, store, $(this))
            selection.selectOne(cursor.get(), store)
            return false
        }
        return true
    });

    $(root).on('keydown', function (event) {
        let tag = event.target.tagName.toLowerCase();
        if (tag === 'textarea' && currentEditor[0].value.substring(0, 3) === '```') {
            return true
        }
        let next = true
        let prevSelected = cursor.save();
        if (event.key === 'ArrowUp') {
            cursor.moveUp(store);
            if (event.shiftKey) {
                selection.include(cursor.get(), store)
            } else {
                selection.selectNothing(cursor.get())
            }
            next = false
        } else if (event.key === 'ArrowDown') {
            cursor.moveDown(store);
            if (event.shiftKey) {
                selection.include(cursor.get(), store)
            } else {
                selection.selectNothing(cursor.get())
            }
            next = false
        } else if (event.shiftKey && event.key === 'Delete') {
            stopEditing(root, store, currentEditor);
            if (selection.hasSelection()) {
                selection.remove(store)
                // FIXME: adjust cursor
            } else {
                cursor.remove(store)
            }
            next = false

            trigger('change');
        } else if (event.key === 'Enter') {
            stopEditing(root, store, currentEditor);
            next = false

            if (event.ctrlKey) {
                let id = store.currentID(cursor.get())
                let current = store.value(id)
                let indent = current.indented
                let item = newListItem(indent)
                cursor.insertAbove(store, item)
            } else {
                let insertion = cursor.save()
                let currentValue = store.value(store.currentID(cursor.get()));
                let current = currentValue ? currentValue.indented : 0
                let next = cursor.get() + 1 < store.length() ? store.value(store.currentID(cursor.get() + 1)).indented : current
                let indent = next > current ? next : current
                let item = newListItem(indent)
                cursor.insertBelow(store, item)
            }

            selection.selectOne(cursor.get(), store)
            trigger('change')
        } else if (event.key === 'Tab') {
            store.indent(cursor.get(), store.lastHigherIndented(cursor.get()) - cursor.get(), event.shiftKey ? -1 : 1)
            next = false
        } else {
            return true
        }

        disableDragging(drake)
        render(root, store);
        drake = enableDragging(root)

        if (cursor.hasMoved(prevSelected)) {
            if (!selection.hasSelection() && editing && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                stopEditing(root, store, currentEditor);
                startEditing(root, store, cursor);
                return false
            } else if (selection.hasSelection()) {
                stopEditing(root, store, currentEditor);
            }
        }
        if (event.key === 'Enter') {
            startEditing(root, store, cursor);
            return false
        } else if (event.key === 'Escape') {
            stopEditing(root, store, currentEditor);
            return false
        }
        return next
    })
    $(root).on('click', '.marker', function () {
        stopEditing(root, store, $(this).next('textarea'));
        return false;
    });

    $(root).on('click', '.content a', function (event) {
        event.stopPropagation()
        return true
    })

    $(root).on('click', '.list-item', function () {
        let currentIndex = $(root).children('div.list-item').index(this)
        if (cursor.atPosition(currentIndex) && currentEditor !== null && currentEditor.closest('.list-item')[0] === this) {
            return true
        }
        stopEditing(root, store, currentEditor)

        cursor.set(currentIndex)
        selection.selectOne(cursor.get(), store)

        disableDragging(drake)
        render(root, store);
        drake = enableDragging(root)

        const $input = startEditing(root, store, cursor)
        $input.trigger('input')

        return false
    })

    $(root).on('click', '.fold', function () {
        let open = !$(this).hasClass('open');
        $(this).toggleClass('open', open)
        $(this).toggleClass('closed', !open)

        let item = $(this).parents('.list-item')
        let elements = $(root).children('div.list-item');
        let index = elements.index(item)
        store.update(item.data('id'), function (item) {
            item.fold = open ? 'open' : 'closed'
            return item
        })

        disableDragging(drake)
        render(root, store);
        drake = enableDragging(root)
    });

    function update(id, callback) {
        let changed = false
        store.update(id, function (item, prev, next) {
            let before = Object.assign({}, item)
            item = callback(item, prev, next)
            changed = item.text !== before.text || item.indented !== before.indented || item.fold !== before.fold
            return item
        })
        if (changed) {
            trigger('change')
        }
    }

    disableDragging(drake)
    render(root, store);
    drake = enableDragging(root)

    cursor.set(0)
    startEditing(root, store, cursor)

    return {
        on,
        save,
        saveTree,
        copy,
        update
    };
}

export default editor
