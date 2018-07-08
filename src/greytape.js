#!/usr/bin/env node
let Program = require('commander')

const { printError, printWarning, printSuccess } = require('./libs')
const generate = require('./generate')

Program
  .command('generate')
  .alias('g')
  .description('generate new cli')
  .option('-f, --force', 'force if dist already exist')
  .option('-c, --config <config>', 'config file path')
  .action((arg, cmd) => {
    if (!cmd) cmd = arg
    let opts = {
      force: cmd.force,
      config: cmd.config
    }
    generate(opts)
    .then(printSuccess)
    .catch(printError)
  })

Program
  .command('publish')
  .alias('p')
  .description('publish cli in npm')
  .action(function (dir, cmd) {
    printSuccess("success publish")
  })

Program
  .command('config')
  .alias('c')
  .description('config greytape')
  .action(function (dir, cmd) {
    printSuccess("success config")
  })

Program.on('command:*', function () {
  printError(`Invalid command: ${Program.args.join(' ')}`)
  printWarning('use -h or --help for command detail')
  process.exit(1);
})

Program.parse(process.argv)

if (Program.args.length === 0) {
  Program.help()
}
