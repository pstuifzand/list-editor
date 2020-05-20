import _ from 'lodash';
import $ from 'jquery';
import dragula from 'dragula';
import createCursor from './cursor';

function editor(root, inputData) {
    root.classList.add('root')

    let cursor = createCursor();

    let drake = null;
    let data = [{id: 1, indented: 0, text: ''}];
    if (inputData.length) {
        data = inputData
    }
    let count = data.length;
    let events = {
        change: []
    }

    let editing = false
    let currentEditor = null;

    function newListItem(count, indented) {
        return {id: count, indented: indented, text: ''}
    }

    function newItem(value) {
        let el = $('<div class="list-item">')
            .data('id', value.id)
            .data('indented', value.indented)
            .css('margin-left', (value.indented * 32) + 'px')
        let line = $('<div class="line">')
        line.prepend($('<span class="content"></span>')
            .html(value.text))
        line.prepend($('<span class="marker"></span>'))
        el.prepend(line)
        return el;
    }

    function render(rootElement, rootData) {
        let first = 0;
        let last = rootData.length;

        let elements = $(rootElement).children('div.list-item');

        let $enter = elements.slice(first, last);
        let enterData = rootData.slice(first, $enter.length);

        let exitData = rootData.slice($enter.length);
        let $exitEl = elements.slice($enter.length)

        $enter.each(function (index, li) {
            let value = enterData[index];
            $(li).data('id', value.id)
                .toggleClass('selected', cursor2.atPosition(index))
                .css('margin-left', (value.indented * 32) + 'px')
                .find('.content')
                .html(value.text)
        });

        _.each(exitData, function (value, index) {
            let $li = newItem(value)
                .css('margin-left', (value.indented * 32) + 'px')
                .toggleClass('selected', cursor2.atPosition(index + $enter.length));
            $(rootElement).append($li)
        })

        $exitEl.remove()
    }

    function disableDragging(drake) {
        if (drake) drake.destroy();
    }

    function enableDragging(rootElement) {
        let start = -1;
        let updateSelected = false

        let drake = dragula([rootElement], {});
        drake.on('drag', function (el, source) {
            start = $(rootElement).children('div.list-item').index(el)
            if (cursor2.atPosition(start)) updateSelected = true
        })

        drake.on('drop', function (el, target, source, sibling) {
            let stop = $(target).children('div.list-item').index(el)
            if (start >= 0) {
                const removed = data.splice(start, 1)
                if (start === stop) {
                    return;
                }
                data.splice(stop, 0, ...removed)
                if (updateSelected) {
                    cursor2.set(stop)
                    updateSelected = false
                }
                _.each(events['change'], function (handler) {
                    handler()
                })
            }
        })
        return drake;
    }

    function stopEditing(rootElement, data, element) {
        if (!editing) return
        if (element === null) {
            editing = false
            currentEditor = null
            return
        }

        let text = element.val()
        $(element).closest('.list-item').removeClass('editor');
        data[element.data('selected')] = _.merge(data[element.data('selected')], {
            id: element.data('id'),
            text: text
        })

        _.each(events['change'], function (handler) {
            handler()
        })

        let $span = $('<span class="content">');
        $span.html(text)
        element.replaceWith($span);
        editing = false
        currentEditor = null
    }

    function startEditing(rootElement, data, cursor2) {
        if (editing) return
        editing = true

        let elements = $(rootElement).children('div.list-item');
        let $textarea = $('<input type="text" class="input-line">');
        $textarea.val(data[cursor2.get()].text);
        let $selectedElement = cursor2.getSelectedElement(elements);
        $selectedElement.find('.content').replaceWith($textarea)
        $selectedElement.addClass('editor');
        $textarea.focus()
        $textarea.data(cursor2.getCurrent(data))
        currentEditor = $textarea
    }

    function save() {
        return new Promise(function (resolve, reject) {
            resolve(data);
        });
    }

    function on(evt, handler) {
        events[evt].push(handler)
    }

    $(document).on('keydown', 'input.input-line', function (event) {
        if (event.key === 'Escape') {
            stopEditing(root, data, $(this))
            return false
        }

        if (event.key === '[') {
            let input = this
            let val = input.value
            let prefix = val.substring(0, input.selectionStart)
            let selection = val.substring(input.selectionStart, input.selectionEnd)
            let suffix = val.substring(input.selectionEnd)
            input.value = prefix + '[[' + selection + ']]' + suffix
            input.selectionStart = prefix.length + 2
            input.selectionEnd   = input.selectionStart + selection.length
            return false;
        }

        return true
    });

    $(document).on('keydown', function (event) {
        let next = true
        let prevSelected = cursor2.save();
        if (event.key === 'ArrowUp') {
            cursor2.moveUp(data);
            next = false
        } else if (event.key === 'ArrowDown') {
            cursor2.moveDown(data);
            next = false
        } else if (event.shiftKey && event.key === 'Delete') {
            stopEditing(root, data, currentEditor);
            data = cursor2.remove(data)
            next = false
            _.each(events['change'], function (handler) {
                handler()
            })
        } else if (event.key === 'Enter') {
            stopEditing(root, data, currentEditor);
            next = false

            let indent = data[cursor2.get()].indented
            count++
            let item = newListItem(count, indent)

            if (event.shiftKey) {
                data = cursor2.insertAbove(data, item)
            } else {
                data = cursor2.insertBelow(data, item)
            }

            _.each(events['change'], function (handler) {
                handler()
            })
        } else if (event.key === 'Tab') {
            let prevIndent = data[cursor2.get()].indented
            if (cursor2.atFirst()) {
                data[cursor2.get()].indented = 0;
            } else if (event.shiftKey) {
                data[cursor2.get()].indented = Math.max(data[cursor2.get()].indented - 1, 0);
            } else {
                data[cursor2.get()].indented = Math.min(data[cursor2.get()-1].indented + 1, data[cursor2.get()].indented + 1)
            }
            let newIndent = data[cursor2.get()].indented
            if (prevIndent !== newIndent) {
                _.each(events['change'], function (handler) {
                    handler()
                })
            }
            next = false
        }
        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)

        if (cursor2.hasMoved(prevSelected)) {
            if (editing && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                stopEditing(root, data, currentEditor);
                startEditing(root, data, cursor2);
                return false
            }
        }
        if (event.key === 'Enter') {
            startEditing(root, data, cursor2);
            return false
        } else if (event.key === 'Escape') {
            stopEditing(root, data, currentEditor);
            return false
        }
        return next
    })

    $(document).on('click', 'div.list-item', function () {
        let currentIndex = $(root).children('div.list-item').index(this)
        if (cursor2.atPosition(currentIndex) && currentEditor !== null && currentEditor.closest('.list-item')[0] === this) {
            return true
        }
        cursor2.set(currentIndex)

        stopEditing(root, data, currentEditor)
        startEditing(root, data, cursor2)

        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)
        return false
    })

    disableDragging(drake)
    render(root, data);
    drake = enableDragging(root)

    cursor2.set(0)
    startEditing(root, data, cursor2)

    return {
        on: on,
        save: save
    };
}

export default editor
