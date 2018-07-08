#!/usr/bin/env node
let Program = require('commander')

Program
.command('config')
.alias('c')
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


// let questionObj = {
  version: {
    name: 'version',
    message: 'version',
    default: create.version,
    /* all versions are formatted as x1.x2.x3 with xi positive or null integers */
    validate: (value) => {
      return /^[0-9]+[.][0-9]+[.][0-9]+$/.test(value) ? true : Chalk.hex(CONST.WARNING_COLOR)('Please enter a valid version number')
    }
  },
//   style: {
//     name: 'style',
//     message: 'style',
//     type: 'list',
//     choices: ['css', 'scss'],
//     default: create.style
//   },
//   mainClass: {
//     name: 'mainClass',
//     message: 'main class',
//     default: create.mainClass,
//     /* spm names are never shorter than 2 characters */
//     validate: (value) => {
//       return (value.length && value.length > 1 && /^[a-zA-Z0-9_]*$/.test(value)) ? true : Chalk.hex(CONST.WARNING_COLOR)('use at least 2 characters, only alphanumerical')
//     }
//   },
//   description: {
//     name: 'description',
//     message: 'description',
//     /* descriptions should be at least 1 char long */
//     validate: value => {
//       return (value.length > 0) ? true : Chalk.hex(CONST.WARNING_COLOR)('description is required')
//     }
//   },
//   jsStandard: {
//     name: 'jsStandard',
//     type: 'list',
//     choices: ['modular', 'legacy'],
//     default: 'legacy',
//     message: 'chose your js standard : legacy only recommended for native script'
//   },
//   category: {
//     name: 'category',
//     message: 'category'
//   },
//   responsive: {
//     name: 'responsive',
//     type: 'checkbox',
//     message: 'responsiveness',
//     choices: ['watch', 'mobile', 'phablet', 'tablet', 'laptop', 'screenXl'],
//     default: ['mobile', 'phablet', 'tablet', 'laptop', 'screenXl'],
//     /* must be compatible with at least 1 device */
//     validate: value => {
//       return value.length || Chalk.hex(CONST.WARNING_COLOR)('module must be compatible with at least 1 device')
//     }
//   },
//   keywords: {
//     name: 'keywords',
//     message: 'keywords',
//     default: create.keywords.join(', '),
//     filter: Common.optionList
//   },
//   htmlName: {
//     name: 'htmlName',
//     default: create.htmlName,
//     message: `module's main html file`
//   },
//   ssName: {
//     name: 'ssName',
//     /* the entry point by default is index with the project's style extension */
//     default: (current) => {
//       return current.style ? `${create.name}.${current.style}` : create.ssName
//     },
//     message: `module's main stylesheet`
//   },
//   jsName: {
//     name: 'jsName',
//     default: create.jsName,
//     message: `module's main script`
//   },
//   classes: {
//     name: 'classes',
//     message: 'classes',
//     default: create.classes.join(', '),
//     filter: Common.optionList
//   },
//   readme: {
//     name: 'readme',
//     message: 'readme'
//   },
//   repository: {
//     name: 'repository',
//     message: 'repository'
//   },
//   license: {
//     name: 'license',
//     message: 'license',
//     default: create.license
//   }
// }
