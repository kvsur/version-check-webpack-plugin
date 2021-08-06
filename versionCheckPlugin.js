const path = require('path');
const fs = require('fs');

/**
 * @typedef {import('./typings').Options} Options
 */
class VersinoCheckPlugin {
    /**
     * 
     * @param {Options} options 
     */
    constructor(options = {}) {
        this.updaterName = 'updater';
        this.updaterExtension = '.js';
        const defualtVersionFilename = 'version-hash.json';
        this.updaterPath = 'cache-controller';
        this.options = Object.assign({ versionFilename: defualtVersionFilename },
            options);
        
        this.options.entryNeedInjectedUpdater = ['main'];
        if (typeof options.entryNeedInjectedUpdater === 'string') {
            this.options.entryNeedInjectedUpdater = [options.entryNeedInjectedUpdater];
        } else if (Array.isArray(options.entryNeedInjectedUpdater)) {
            this.options.entryNeedInjectedUpdater = [...options.entryNeedInjectedUpdater];
        }
    }

    /**
     * Get updater file generate dirctory(unclude filename).
     * @returns {string}
     */
    getPrePath() {
        return this.updaterPath;
    }

    /**
     * Inject updater to frontend code as entry
     * @param {import('webpack').Compiler} compiler 
     */
    generateFile(compiler) {
        const { options } = compiler;
        const prePath = this.getPrePath();
        let publicPath = options.output.publicPath;
        publicPath = (!publicPath || publicPath === 'auto') ? '' : publicPath;
        try {
            fs.mkdirSync(prePath, { recursive: true });
            const template = fs.readFileSync(path.resolve(__dirname, './updater-template.tpl'),
                { encoding: 'utf-8'});
            const jsonFielURL = path.join(publicPath, this.options.versionFilename).replace(/\\/g, '/');
            fs.writeFileSync(path.join(prePath, this.updaterName + this.updaterExtension),
                template.replace('{{versionHashPath}}', jsonFielURL),
                { encoding: 'utf-8', flag: 'w'});
        } catch (e) {
            throw e;
        }
    }

    /**
     * Remove updater temp code in src dir.
     */
    removeFile() {
        try {
            fs.unlinkSync(path.join(this.getPrePath(), this.updaterName + this.updaterExtension));
            fs.rmdirSync(this.getPrePath());
        } catch (e) {
            throw e;
        }
    }

    /**
     * 
     * @param {import('webpack').Compiler} compiler 
     */
    getEntryEntries(compiler) {
        const originEntry = compiler.options.entry;
        /** @type {import('./typings').EntryEntries} */
        const entryResult = {};
        if (typeof originEntry === 'string') entryResult['main'] = originEntry;
        else if (Array.isArray(originEntry)) entryResult['main'] = originEntry[0];
        else {
            const entryKeys = Object.keys(originEntry);
            entryKeys.forEach(key => {
                const val = originEntry[key];
                if (typeof val === 'string') entryResult[key] = val;
                else if (Array.isArray(val)) entryResult[key] = val[0];
                else entryResult[key] = val['import'][0];
            });
        }
        return entryResult;
    }

    /**
     * This plugin entry for webpack.
     * @param {import('webpack').Compiler} compiler 
     */
    apply(compiler) {
        const { outputFileSystem, options, context } = compiler;
        this.updaterPath = path.join(context, 'src', this.updaterPath);
        compiler.hooks.afterEnvironment.tap(VersinoCheckPlugin.pluginName, () => {
            this.generateFile(compiler);
            const entryEntries = this.getEntryEntries(compiler);
            const entryKeys = Object.keys(entryEntries);
            const entryNeedInjectedUpdaterResource = [];
            this.options.entryNeedInjectedUpdater.forEach(entryName => {
                const val = entryEntries[entryName];
                if (val) entryNeedInjectedUpdaterResource.push(val);
            });
            compiler.hooks.thisCompilation.tap(VersinoCheckPlugin.pluginName, compilation => {
                const originSources = {};
                const injectModulePath = path.join(this.getPrePath(), this.updaterName + this.updaterExtension);
                compilation.hooks.buildModule.tap(VersinoCheckPlugin.pluginName, moduleSource => {
                    if (entryNeedInjectedUpdaterResource.indexOf(moduleSource.rawRequest) >= 0) {
                        try {
                            const originSource = fs.readFileSync(moduleSource.resource, {encoding: 'utf-8'});
                            originSources[moduleSource.rawRequest] = originSource;

                            const injectedSource = 
                                `\nimport '${injectModulePath.replace(/\\/g, '/')}';\n` + originSource;
                            fs.writeFileSync(moduleSource.resource, injectedSource, {encoding: 'utf-8'});
                        } catch (e) {
                            throw e;
                        }
                    }
                });
                compilation.hooks.succeedModule.tap(VersinoCheckPlugin.pluginName, moduleSource => {
                    if (entryNeedInjectedUpdaterResource.indexOf(moduleSource.rawRequest) >= 0) {
                        try {
                            fs.writeFileSync(moduleSource.resource, originSources[moduleSource.rawRequest], {
                                encoding: 'utf-8',
                            })
                        } catch (e) {
                            throw e;
                        }
                    }
                });
                compilation.hooks.afterChunks.tap(VersinoCheckPlugin.pluginName, chunks => {
                    compilation.hooks.afterHash.tap(VersinoCheckPlugin.pluginName, () => {
                        const { entry } = compiler.options;
                        const chunkHash = Array.from(chunks);
                        /** @type {{ version: string }} */
                        const versionHash = { version: '' };
                        let versionVal = '';
                        entryKeys.map(entryName => {
                            versionVal += chunkHash.find(({name}) => name === entryName).renderedHash;
                        });
                        versionHash.version = versionVal;
                        const versionPath = path.join(options.output.path, this.options.versionFilename);
                        // Deal difference systems
                        const matchStr = versionPath.indexOf('\\') >= 0 ? '\\' : '/';
                        outputFileSystem.mkdir(versionPath.substring(0, versionPath.lastIndexOf(matchStr)), {
                            recursive: true,
                        }, err => {
                            if (err) throw err;
                            outputFileSystem.writeFile(path.join(versionPath), JSON.stringify(versionHash), {
                                encoding: 'utf-8',
                            }, err => {
                                if (err) throw err;
                                this.removeFile();
                            })
                        });
                    });
                });
            });
        });
    }
}

VersinoCheckPlugin.version = 1;
VersinoCheckPlugin.pluginName = 'VersionCheckPlugin';

module.exports = VersinoCheckPlugin;
