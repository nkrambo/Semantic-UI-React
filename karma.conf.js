const { argv } = require('yargs')

const config = require('./config')
const webpackConfig = require('./webpack.config')

const formatError = (msg) => {
  // filter out empty lines and node_modules
  if (!msg.trim() || /~/.test(msg)) return ''

  // indent the error beneath the it() message
  let newLine = '  ' + msg

  if (newLine.includes('webpack:///')) {
    // remove webpack:///
    newLine = newLine.replace('webpack:///', '')

    // remove bundle location, showing only the source location
    newLine = newLine.slice(0, newLine.indexOf(' <- '))
  }

  return newLine + '\n'
}

module.exports = (karmaConfig) => {
  karmaConfig.set({
    basePath: process.cwd(),
    browsers: ['PhantomJS'],
    client: {
      mocha: {
        reporter: 'html',   // change Karma's debug.html to mocha web reporter
        ui: 'bdd',
      },
    },
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: 'coverage', subdir: '.' },
        { type: 'text-summary' },
      ],
      includeAllSources: true,
    },
    files: [
      './test/tests.bundle.js',
    ],
    formatError,
    frameworks: ['phantomjs-shim', 'mocha'],
    reporters: ['mocha', 'coverage'],
    preprocessors: {
      // do not include 'coverage' preprocessor for karma-coverage
      // code is already instrumented by babel-plugin-__coverage__
      './test/tests.bundle.js': ['webpack', 'sourcemap'],
    },
    singleRun: !argv.watch,
    webpack: {
      devtool: config.compiler_devtool,
      entry: './test/tests.bundle.js',
      module: {
        rules: [
          ...webpackConfig.module.rules,
          {
            test: /sinon\.js$/,
            loader: 'imports-loader?define=>false,require=>false',
          },
        ],
      },
      plugins: webpackConfig.plugins,
      resolve: Object.assign({}, webpackConfig.resolve, {
        alias: Object.assign({}, webpackConfig.resolve.alias, {
          sinon: 'sinon/pkg/sinon',
          // These are internal deps specific to React 0.13 required() by enzyme
          // They shouldn't be requiring these at all, issues and fix proposed
          // https://github.com/airbnb/enzyme/issues/285
          'react/lib/ExecutionEnvironment': 'empty/object',
          'react/lib/ReactContext': 'empty/object',
          // this is a React 0.13 dep required by enzyme
          // ignore it since we don't have it
          'react/addons': 'empty/object',
        }),
      }),
    },
    webpackServer: {
      progress: false,
      stats: config.compiler_stats,
      debug: true,
      noInfo: false,
      quiet: false,
    },
  })
}
