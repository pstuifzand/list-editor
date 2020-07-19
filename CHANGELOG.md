# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.8.12] - 2020-07-19

- Upgraded lodash to 4.17.19
- Fix typo in import function name

## [0.8.11] - 2020-06-28

- Fixed store saveTree, remove children from other items, by making a clone

## [0.8.10] - 2020-06-28

- Publish to Github and NPM

## [0.8.9] - 2020-06-28

- Added improvements for CI

## [0.8.8] - 2020-06-28

- Added `saveTree` method with selection by id. This selects all children of
  the element with `id`.
- Fixed bug where not all items where present in tree result of `saveTree`

## [0.8.7] - 2020-06-24

- Added `id` parameter to `update` method

## [0.8.6] - 2020-06-24

- Fixed update method of editor where the before object wasn't cloned, so 
  was always equal to replace object

## [0.8.5] - 2020-06-24

## [0.8.4] - 2020-06-24

- Added 'update' method to editor. It calls the 'update' method of store.

## [0.8.3] - 2020-06-23

- Added 'hidden' to default fields newListItem.
- Fix movement bug when moving up

## [0.8.2] - 2020-06-23

- Simplify indenting. Now we indent all children with a higher indent numbering.

## [0.8.1] - 2020-06-23

- Fix small bugs

## [0.8.0] - 2020-06-17

- Added rendering/rendered events
- Changed transform option, the second arguments is on element now

## [0.7.6] - 2020-06-15

- Remove the jump from the textarea with multiple lines when moving to it.
- Use the indent of the next item when it larger then the current indent, but use the
  current indent otherwise.

## [0.7.5] - 2020-06-11

- Add classes for borders when >= 1 indented
- Fixed bug where content was removed, when the marker was clicked on the 
  line with the active editor

## [0.7.4] - 2020-06-11

- Add .no-children, .open to .list-item, to simplify css

## [0.7.3] - 2020-06-09

- Remove mirroring of characters

## [0.7.2] - 2020-06-08

- Make links in content clickable
- Add "=" handling of selected text.

## [0.7.1] - 2020-06-08

- Add options
- Add transform function to options

## [0.7.0] - 2020-06-07

## [0.6.9] - 2020-06-07

### Added

* Add `saveTree` method that passes a tree-like structure as the first
  argument.

### Changed

* Start new item opened

[Unreleased]: https://github.com/pstuifzand/list-editor/compare/0.8.11...HEAD
[0.8.11]: https://github.com/pstuifzand/list-editor/compare/0.8.10...0.8.11
[0.8.10]: https://github.com/pstuifzand/list-editor/compare/0.8.9...0.8.10
[0.8.9]: https://github.com/pstuifzand/list-editor/compare/0.8.8...0.8.9
[0.8.8]: https://github.com/pstuifzand/list-editor/compare/0.8.7...0.8.8
[0.8.7]: https://github.com/pstuifzand/list-editor/compare/0.8.6...0.8.7
[0.8.6]: https://github.com/pstuifzand/list-editor/compare/0.8.5...0.8.6
[0.8.5]: https://github.com/pstuifzand/list-editor/compare/0.8.4...0.8.5
[0.8.4]: https://github.com/pstuifzand/list-editor/compare/0.8.3...0.8.4
[0.8.3]: https://github.com/pstuifzand/list-editor/compare/0.8.2...0.8.3
[0.8.2]: https://github.com/pstuifzand/list-editor/compare/0.8.1...0.8.2
[0.8.1]: https://github.com/pstuifzand/list-editor/compare/0.8.0...0.8.1
[0.8.0]: https://github.com/pstuifzand/list-editor/compare/0.7.8...0.8.0
[0.7.8]: https://github.com/pstuifzand/list-editor/compare/0.7.7...0.7.8
