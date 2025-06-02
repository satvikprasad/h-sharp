const path = require('path');
const { experiments } = require('webpack');

module.exports = {
    entry: "./src/renderer/renderer.ts",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    experiments: {
        asyncWebAssembly: true,
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'node'
};
