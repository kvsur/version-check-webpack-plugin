const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const VersinoCheckPlugin = require('../index');
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
        new VersinoCheckPlugin({
            versionFilename: 'version/current-version.json'
        }),
        new HTMLWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'index.html'),
            inject: 'body'
        })
    ]
};
module.exports = webpackConfig;