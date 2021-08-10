# version-check-webpack-plugin
A webpack plugin to generate dynamic-version json file and inject version-check function into frontend dist assets.
一个用于给前端代码动态生成版本json文件和注入检测版本脚本的Webpack插件。

### Usage

```bash
npm install version-check-webpack-plugin --save-dev / yarn add version-check-webpack-plugin -D
```

**Options**

```ts
interface Options { versionFilename?: string, entryNeedInjectedUpdater?: string | [] }
```

```js
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const VersionCheckPlugin = require('version-check-webpack-plugin');
/**
 * @type {import('webpack').Configuration}
 */
const webpackConfig = {
    mode: 'production',
    context: path.resolve(__dirname, './'),
    entry: {
        main: {
            import: ['./src/index.js']
        },
        vendor: './src/vendor.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[name].[chunkhash:8].js',
        publicPath: '/public'
    },
    plugins: [
        new VersionCheckPlugin({
            versionFilename: 'version/current-version.json',
            // entryNeedInjectedUpdater: ['main'], // or next line
            entryNeedInjectedUpdater: 'main'
        }),
        new HTMLWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'index.html'),
            inject: 'body'
        })
    ]
};
module.exports = webpackConfig;
```

**HTMLWebpackPlugin is recommended with this plugin.**

Dist Assets like:

dist/version/current-verion.json
```json
{"version":"e3131e0662c4c2dc9c5b37fab2dbf6e1329fb50134ad6cdad81722e54c68"}
```

version-check code like(**just origin template, not transformed yet**):
```js
function initial(self) {
    const cvkey = `__${(0xbc729ba02bd1).toString(36)}_version-check-updater__`;
    const previousVersion = self.localStorage.get(cvkey);
    if (previousVersion === null) {
        fetchVersion().then(versionJson => {
            self.localStorage.setItem(cvkey, versionJson.version);
        }).catch(e => {
            console.warn(`Do initial check version failed cause: ${e.message || e.toString()}`);
        })
    }

    /**
     * Get latest version.
     * @returns {Promise<{version: string}>}
     */
    function fetchVersion() {
        return new Promise((resolve, reject) => {
            fetch(`{{versionHashPath}}?tag=${Math.random().toString(36).slice(2)}`, {
                credentials: 'include',
                method: 'GET',
            }).then(res => {
                res.json().then(versionJson => resolve(versionJson));
            }).catch(e => reject(e));
        });
    }

    /**
     * Check if new version built.
     * @param {boolean} forceRefresh 
     * @returns {Promise<boolean>}
     */
    function versionCheckController(forceRefresh) {
        return new Promise((resolve, reject) => {
            fetchVersion().catch(e => reject(e)).then(versionJson => {
                if (versionJson.version === previousVersion) resolve(false);
                else if (forceRefresh) self.location.reload();
                else resolve(true);
            })
        });
    }

    self.$versionCheckController = versionCheckController;

    return versionCheckController;
}

export default initial(globalThis || window);
```

And in entry index.html this script will be injected like:
```html
<script defer="defer" src="/public/updater.34ad6cda.js"></script>
```

So you can use it like:

```js
//...

function doUdpate() {
    $versionCheckController(/** forceRefresh */false).then(verionChanged => {
        if (versionChanged) {
            //TODO 
            // show version changed message for user fetch new version or reload window directly ^_^
        }
    })
}
function beforeRouteChange() {
    doUdpate();
}

request('/api/list/detail?id=12').then(res => {
    if (res.status === '404') doUdpate();
}).catch(e => {
    doUdpate()
})
//...
```
