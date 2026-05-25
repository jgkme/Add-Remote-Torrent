const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack'); // Required for ProvidePlugin

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'cheap-module-source-map',
    entry: {
      background: './background.js',
      content_script: './content_script.js',
      options: './options/options.js',
      popup: './popup/popup.js',
      confirmAdd: './confirmAdd/confirmAdd.js', // Changed entry key here
      // We don't need to list individual API handlers if they are dynamically imported
      // by api_client_factory.js, which is imported by background.js.
      // Webpack should trace these dynamic imports.
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      // Extension-root URLs for any shared assets (options/popup live in subfolders).
      publicPath: '/',
      globalObject: 'self',
      filename: (pathData) => {
        // Place JS files in subdirectories matching source structure
        if (pathData.chunk.name === 'options') return 'options/[name].js';
        if (pathData.chunk.name === 'popup') return 'popup/[name].js';
        if (pathData.chunk.name === 'confirmAdd') return 'confirmAdd/[name].js'; // Adjusted for new entry key
        return '[name].js';
      },
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader', // This will automatically load postcss.config.js
              // No explicit options needed here if postcss.config.js is correctly set up
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'css/tailwind.css', // Output global CSS to dist/css/tailwind.css
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              // Bundled background.js is an IIFE, not an ES module.
              if (manifest.background?.type === 'module') {
                delete manifest.background.type;
              }
              return JSON.stringify(manifest, null, 2);
            },
          },
          { from: 'icons', to: 'icons' },
          {
            from: 'options/options.html',
            to: 'options/options.html',
            transform: (content) =>
              content.toString().replace(
                /<script type="module" src="options\.js"><\/script>/,
                '<script src="options.js"></script>'
              ),
          },
          {
            from: 'popup/popup.html',
            to: 'popup/popup.html',
            transform: (content) =>
              content.toString().replace(
                /<script type="module" src="popup\.js"><\/script>/,
                '<script src="popup.js"></script>'
              ),
          },
          {
            from: 'confirmAdd/confirmAdd.html',
            to: 'confirmAdd/confirmAdd.html',
            transform: (content) =>
              content.toString().replace(
                /<script type="module" src="confirmAdd\.js"><\/script>/,
                '<script src="confirmAdd.js"></script>'
              ),
          },
          { from: 'dashboard', to: 'dashboard' },
          { from: 'js/theme.js', to: 'js/theme.js' },
          { from: 'js/torrent-ui.js', to: 'js/torrent-ui.js' },
          { from: 'js/torrent-list.js', to: 'js/torrent-list.js' },
          { from: 'audio', to: 'audio' }, // Added to copy audio files
          { from: 'offscreen_audio.html', to: 'offscreen_audio.html' }, // Added to copy offscreen document
          { from: 'offscreen_audio.js', to: 'offscreen_audio.js' } // Added to copy offscreen script
          // Add any other static assets that need to be copied
        ],
      }),
      new webpack.ProvidePlugin({ // ProvidePlugin added to the main plugins array
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    optimization: {
      // One self-contained bundle per entry (no 970.js stubs; options/popup must not split).
      splitChunks: false,
      runtimeChunk: false,
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          // Copied dashboard.js is plain script (not webpack entry); mangling can
          // shadow function names inside forEach (ReferenceError before initialization).
          exclude: [
            /dashboard[\\/]dashboard\.js$/,
            /js[\\/]torrent-ui\.js$/,
            /js[\\/]torrent-list\.js$/,
          ],
          terserOptions: {
            compress: {
              // drop_console: isProduction, // Temporarily disable for testing background.js
            },
            mangle: true,
          },
        }),
      ],
    },
    resolve: {
      // Ensure Webpack can find modules if you have a specific structure
      // modules: [path.resolve(__dirname, 'src'), 'node_modules'], // Example if you had an src folder
      fallback: {
        "buffer": require.resolve("buffer/") // Provide a polyfill for the 'buffer' module
      }
    }
  };
};
