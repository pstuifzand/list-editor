![Node.js Package](https://github.com/pstuifzand/list-editor/workflows/Node.js%20Package/badge.svg)

# Wiki List Editor

First install the package.

```bash
npm install wiki-list-editor --save
```

And then use it in your javascript code.

```js
import editor from 'wiki-list-editor';

let div = document.createElement('div')
let listEditor = editor(div);
document.body.appendChild(div);
```

### Author

Peter Stuifzand <peter@p83.nl>
