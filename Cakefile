fs = require 'fs'
spawn = require('child_process').spawn

option '', '--reporter [name]', 'specify the reporter for Mocha to use'
option '', '--grep [pattern]', 'only run tests matching pattern'

task 'build', 'Builds JavaScript files from source', ->
  compileFiles = (dir) ->
    files = fs.readdirSync dir
    files = ("#{dir}/#{file}" for file in files when file.match /\.coffee$/)
    command = 'coffee'
    args = [ '-c', '-o', dir.replace('src', 'lib') ].concat files
    spawn command, args, stdio: 'inherit'
  compileFiles 'src'
  compileFiles 'src/adapters'
  compileFiles 'src/connection'
  compileFiles 'src/model'
  compileFiles 'src/command'

runTest = (options, dirty_tracking, callback) ->
  process.env.NODE_ENV = 'test'
  process.env.DIRTY_TRACKING = dirty_tracking
  command = './node_modules/.bin/mocha'
  args = ['-R', options.reporter or 'spec', '--compilers', 'coffee:coffee-script', '-r', 'coffee-script/register']
  args.push '-g', options.grep if options.grep
  child = spawn command, args, stdio: 'inherit'
  child.on 'exit', (code) ->
    return callback 'error' if code isnt 0
    callback null

task 'test', 'Runs Mocha tests', (options) ->
  dirty_tracking = Math.floor(Math.random() * 2) isnt 0
  runTest options, dirty_tracking, (error) ->

task 'test:full', 'Runs Mocha full tests', (options) ->
  runTest options, true, (error) ->
    return if error
    runTest options, false, (error) ->
      return if error

task 'test:cov', 'Gets tests coverage', (options) ->
  process.env.CORMO_COVERAGE = 'true'
  process.env.NODE_ENV = 'test'
  command = './node_modules/.bin/mocha'
  args = ['-R', 'html-cov', '--compilers', 'coffee:coffee-script', '-r', 'coffee-script/register']
  child = spawn command, args
  cov_html = fs.createWriteStream 'cov.html'
  child.stdout.on 'data', (data) ->
    cov_html.write data
  child.on 'exit', ->
    cov_html.end()

task 'doc', 'Make documents', ->
  command = './node_modules/.bin/crojsdoc'
  args = []
  spawn command, args, stdio: 'inherit'
