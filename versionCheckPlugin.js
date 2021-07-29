const path = require('path');
const exec = require('child_process').execSync;
const fs = require('fs');

/**
 * @typedef {{ versionFilename?: string }} Options
 */
class VersinoCheckPlugin {
    /**
     * 
     * @param {Options} options 
     */
    constructor(options) {
        this.updaterName = 'updater';
        this.updaterExtension = '.js';
        this.name = 'VersionCheckPlugin';
        const defualtVersionFilename = 'version-hash.json';
        const defualtUpdaterPath = 'cache-controller';
        this.options = Object.assign({ versionFilename: defualtVersionFilename, updaterPath: defualtUpdaterPath },
            options);
    }

    /**
     * Get updater file generate dirctory(unclude filename).
     * @returns {string}
     */
    getPrePath() {
        return this.options.defualtUpdaterPath;
    }

    /**
     * Inject updater to frontend code as entry
     * @param {import('webpack').Compiler} compiler 
     */
    generateFile(compiler) {
        const { context } = compiler;
        this.options.updaterPath = path.join(context, 'src', this.options.updaterPath);
        const prePath = this.getPrePath();
        let publicPath = compiler.options.output.publicPath;
        publicPath = (!publicPath || publicPath === 'auto') ? '' : publicPath;
        try {
            fs.mkdirSync(prePath, { recursive: true });
            const template = fs.readFileSync(path.resolve(__dirname, './updater-template.js'),
                { encoding: 'utf-8'});
            fs.writeFileSync(path.join(prePath, this.updaterName + this.updaterExtension),
                template.replace('{{versionHashPath}}', publicPath + this.options.versionFilename),
                { encoding: 'utf-8', flag: 'w'});
        } catch (e) {
            throw e;
        }
    }

    /**
     * Remove updater temp code in src dir.
     */
    removeFile() {
        const rmCommand = `rm -rf ${this.getPrePath()}`;
        try {
            exec(rmCommand);
        } catch (e) {
            throw e;
        }
    }

    /**
     * This plugin entry for webpack.
     * @param {import('webpack').Compiler} compiler 
     */
    apply(compiler) {
        compiler.hooks.afterEnvironment.tap(this.name, () => {
            this.generateFile(compiler);
            const { outputFileSystem, options } = compiler;
            const firstEntry = Object.keys(options.entry)[0];
            // Deal multiple versions of webpack.
            const newEntryPath = path.join(this.options.updaterPath, this.updaterName + this.updaterExtension);
            if (typeof options.entry[firstEntry] === 'object' && options.entry[firstEntry].import) {
                options.entry[this.updaterName] = { import: [newEntryPath]};
            } else {
                options.entry[this.updaterName] = newEntryPath;
            }
            compiler.hooks.thisCompilation.tap(this.name, compilation => {
                compilation.hooks.afterChunks.tap(this.name, chunks => {
                    compilation.hooks.afterHash(this.name, () => {
                        const { entry } = compiler.options;
                        const chunkHash = Array.from(chunks);
                        /** @type {{ version: string }} */
                        const versionHash = { version: '' };
                        let versionVal = '';
                        Object.keys(entry).map(entryName => {
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

module.exports = VersinoCheckPlugin;
