import _ from 'lodash';
import $ from 'jquery';
import textareaAutosizeIinit from "./textarea.autosize";
import dragula from 'dragula';
import createCursor from './cursor';
import createSelection from './selection';

textareaAutosizeIinit($)

function editor(root, inputData) {
    root.classList.add('root')

    let cursor = createCursor();
    let selection = createSelection();

    let drake = null;
    let data = [{id: 1, indented: 0, text: '', fold: 'closed'}];
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
        return {id: count, indented: indented, text: '', fold: 'closed'}
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
        line.prepend($('<span class="fold">&#9654;</span>'))
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

        let hideLevel = 99999;

        $enter.each(function (index, li) {
            let value = enterData[index];
            $(li).data('id', value.id)
                .toggleClass('selected', cursor.atPosition(index))
                .toggleClass('selection-first', selection.isSelectedFirst(index))
                .toggleClass('selection-last', selection.isSelectedLast(index))
                .toggleClass('selection', selection.isSelected(index))
                .toggleClass('hidden', value.indented >= hideLevel)
                .css('margin-left', (value.indented * 32) + 'px')
                .find('.content')
                .html(value.text)

            if (value.indented < hideLevel) {
                if (value.fold !== 'open') {
                    hideLevel = value.indented+1
                } else {
                    hideLevel = 99999;
                }
            }

            $('.fold', $(li)).toggleClass('open', value.fold === 'open')
        });

        _.each(exitData, function (value, index) {
            let $li = newItem(value)
                .css('margin-left', (value.indented * 32) + 'px')
                .toggleClass('selection-first', selection.isSelectedFirst(index))
                .toggleClass('selection-last', selection.isSelectedLast(index))
                .toggleClass('selection', selection.isSelected(index))
                .toggleClass('selected', cursor.atPosition(index + $enter.length))
                .toggleClass('hidden', value.indented >= hideLevel);

            if (value.indented < hideLevel) {
                if (value.fold === 'open') {
                    hideLevel = 99999;
                } else {
                    hideLevel = value.indented+1
                }
            }

            $('.fold', $li).toggleClass('open', value.fold === 'open')
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
            if (cursor.atPosition(start)) updateSelected = true
        })

        drake.on('drop', function (el, target, source, sibling) {
            let stop = $(target).children('div.list-item').index(el)
            if (start >= 0) {
                const removed = data.splice(start, 1)
                if (start === stop) {
                    return;
                }
                data.splice(stop, 0, ...removed)
                if (stop === 0 && removed.length > 0) {
                    removed[0].indented = 0
                }
                if (updateSelected) {
                    cursor.set(stop)
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

    function startEditing(rootElement, data, cursor) {
        if (editing) return
        editing = true

        let elements = $(rootElement).children('div.list-item');
        let $textarea = $('<textarea rows="1" class="input-line">');
        $textarea.textareaAutoSize()
        $textarea.val(data[cursor.get()].text).trigger('input')
        let $selectedElement = cursor.getSelectedElement(elements);
        $selectedElement.find('.content').replaceWith($textarea)
        $selectedElement.addClass('editor');
        $textarea.focus()
        $textarea.data(cursor.getCurrent(data))
        currentEditor = $textarea
        return $textarea
    }

    function save() {
        return new Promise(function (resolve, reject) {
            resolve(data);
        });
    }

    function copy(element) {
        return new Promise(function (resolve, reject) {
            let item = $(element).parents('.list-item')
            let elements = $(root).children('div.list-item');
            let index = elements.index(item)
            resolve(data[index]);
        });
    }

    function on(evt, handler) {
        events[evt].push(handler)
    }

    $(document).on('paste', 'input.input-line', function (event) {
        let parentItem = $(this).parents('.list-item')
        let index = $(root).children('div.list-item').index(parentItem)
        let pastedData = event.originalEvent.clipboardData.getData('text')
        let lines = pastedData.split(/\n/)

        let baseIndent = data[index].indented

        let newItems = _.filter(_.map(lines, function (line) {
            if (line.length == 0) return;
            let matches = line.match(/(\s{4})/g)
            let relIndent = matches ? matches.length : 0;

            count++
            let newItem = newListItem(count, baseIndent+relIndent)
            newItem.text = line.replace(/^\s+/, '')
            return newItem
        }))
        data.splice(index+1, 0, ...newItems)
        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)
        return false
    });

    $(document).on('keydown', '.input-line', function (event) {
        if (event.key === 'Escape') {
            stopEditing(root, data, $(this))
            selection.setFirst(cursor.get())
            selection.setLast(cursor.get()+1)
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
            $(input).trigger('input')
            return false;
        }

        return true
    });

    $(document).on('keydown', function (event) {
        let next = true
        let prevSelected = cursor.save();
        if (event.key === 'ArrowUp') {
            cursor.moveUp(data);
            if (event.shiftKey) {
                selection.include(cursor.get())
            } else {
                selection.setFirst(cursor.get())
                selection.setLast(cursor.get()+1)
            }
            next = false
        } else if (event.key === 'ArrowDown') {
            cursor.moveDown(data);
            if (event.shiftKey) {
                selection.include(cursor.get())
            } else {
                selection.setFirst(cursor.get())
                selection.setLast(cursor.get()+1)
            }
            next = false
        } else if (event.shiftKey && event.key === 'Delete') {
            stopEditing(root, data, currentEditor);
            data = cursor.remove(data)
            next = false
            _.each(events['change'], function (handler) {
                handler()
            })
        } else if (event.key === 'Enter') {
            stopEditing(root, data, currentEditor);
            next = false

            let indent = data[cursor.get()].indented
            count++
            let item = newListItem(count, indent)

            if (event.ctrlKey) {
                data = cursor.insertAbove(data, item)
            } else {
                data = cursor.insertBelow(data, item)
            }

            selection.setFirst(cursor.get())
            selection.setLast(cursor.get()+1)

            _.each(events['change'], function (handler) {
                handler()
            })
        } else if (event.key === 'Tab') {
            if (selection.hasSelection()) {
                data = selection.indent(data, event.shiftKey ? -1 : 1)
                _.each(events['change'], function (handler) {
                    handler()
                })
            } else {
                let prevIndent = data[cursor.get()].indented
                if (cursor.atFirst()) {
                    data[cursor.get()].indented = 0;
                } else if (event.shiftKey) {
                    data[cursor.get()].indented = Math.max(data[cursor.get()].indented - 1, 0)
                } else {
                    data[cursor.get()-1].fold = 'open'
                    data[cursor.get()].indented = Math.min(data[cursor.get()-1].indented + 1, data[cursor.get()].indented + 1)
                }
                let newIndent = data[cursor.get()].indented
                if (prevIndent !== newIndent) {
                    _.each(events['change'], function (handler) {
                        handler()
                    })
                }
            }

            next = false
        }
        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)

        if (cursor.hasMoved(prevSelected)) {
            if (editing && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                stopEditing(root, data, currentEditor);
                startEditing(root, data, cursor);
                return false
            }
        }
        if (event.key === 'Enter') {
            startEditing(root, data, cursor);
            return false
        } else if (event.key === 'Escape') {
            stopEditing(root, data, currentEditor);
            return false
        }
        return next
    })

    $(document).on('click', 'div.list-item', function () {
        let currentIndex = $(root).children('div.list-item').index(this)
        if (cursor.atPosition(currentIndex) && currentEditor !== null && currentEditor.closest('.list-item')[0] === this) {
            return true
        }
        cursor.set(currentIndex)

        stopEditing(root, data, currentEditor)

        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)

        const $input = startEditing(root, data, cursor)
        $input.trigger('input')

        return false
    })

    $(document).on('click', '.fold', function() {
        let open = !$(this).hasClass('open');
        $(this).toggleClass('open', open)
        $(this).toggleClass('closed', !open)

        let item = $(this).parents('.list-item')
        let elements = $(root).children('div.list-item');
        let index = elements.index(item)
        data[index].fold = open ? 'open' : 'closed'

        disableDragging(drake)
        render(root, data);
        drake = enableDragging(root)
    });

    disableDragging(drake)
    render(root, data);
    drake = enableDragging(root)

    cursor.set(0)
    startEditing(root, data, cursor)

    return {
        on: on,
        save: save,
        copy: copy
    };
}

export default editor
