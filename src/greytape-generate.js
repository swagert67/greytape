#!/usr/bin/env node
let Program = require('commander')

Program
.command('generate')
.alias('g')
.description(`execute command in container`)
// .arguments('[arg...]', 'args for command')
.arguments('[param]', 'param for command')

.option('--command <command>', `command for container`)
.option('--user <user>', `user name`)

.action(async (name, options) => {})
.parse(process.argv)

if (Program.args.length === 0) {
  Program.help()
}
