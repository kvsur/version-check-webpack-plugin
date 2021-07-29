/**
 * renderer
 * @param {Eelement} root 
 */
function render(root, content) {
    root.innerHTML = content;
}

const container = document.getElementById('app');

render(container, '<h1>Hello world</h1>')