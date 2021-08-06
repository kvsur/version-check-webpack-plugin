const rm = require('rimraf');
const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');
const chalk = require('chalk');

rm(path.resolve(__dirname, 'example/dist/'), err=> {
    if (err) throw err;
    webpack(config, (err, stats) => {
        if (err) throw err;
        process.stdout.write(
            stats.toString({
                colors: true,
                modules: false,
                children: false,
                chunks: false,
                chunkModules: false
            }) + '\n\n'
        )

        if (stats.hasErrors()) {
            console.log(chalk.red('Build failed with errors.\n'))
        }
        console.log(chalk.cyan('Build complete.\n'))
    })
})