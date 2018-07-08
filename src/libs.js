const Chalk = require("chalk")
const ReadYaml = require('read-yaml')
const Nunjucks = require('nunjucks')
const Fs = require('fs')
const Path = require('path')

const TEMPLATE_PATH = Path.resolve(__dirname, 'template')
const ENV_NUNJUCKS = new Nunjucks.Environment(null, {autoescape: false})

const REGEX_VARIABLE = /{{\s*(\S*)\s*}}/g;
// const REGEX_VARIABLE = "{{\s*(\S*)\s*}}"

const REGEX_EVAL = /\${(.*?)}/ // /^`(.*)`$/
const DEBUG = false
const VALIDATION_CONFIG = {
  prefix: {
    require: ["name"],
    valid: ["name", "description", "alias"]
  },
  action: {
    valid: ["name", "description", "alias", "prefix", "arg", "options", "register", "command", "exec"],
    require: ["name", "command", "exec"],
    interpolation: ["name", "description", "alias", "prefix", "command"]
  },
  arg: {
    valid: ["name", "description", "default"],
    require: ["name"],
    interpolation: ["name", "description"]
  },
  option: {
    valid: ["name", "description", "alias", "value"],
    require: ["name"],
    interpolation: ["name", "alias", "description"]
  },
  register: {
    valid: ["name", "command", "pwd"],
    require: ["name", "command"],
    interpolation: ["name"],
  },
  exec: {
    valid: ["cmd", "cwd"],
    require: ["cmd"],
    interpolation: []
  }
}
const ACTION_SUB_BLOCK = ["arg", "options", "registers", "exec"]

let printError = (msg) => console.error(Chalk.red(msg))

let printSuccess = (msg) => console.error(Chalk.green(msg))

let printWarning = (msg) => console.error(Chalk.yellow(msg))

let matchesVariables = (value, regex) => {
  let matches = []
  regex = new RegExp(regex)
  while ((match = regex.exec(value)) !== null) {
    matches.push(match)
    if (match.index === regex.lastIndex) regex.lastIndex++
  }
  return matches.length ? matches : null
}

let readYaml = (path) => {
  return new Promise((resolve, reject) => {
    ReadYaml(path, function(err, data){
      if (err && err.code == "ENOENT") resolve("missing")
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function replaceAt(string, origin, replace) {
  let index = string.indexOf(origin)
  return string.substring(0, index) + replace + string.substring(index + origin.length)
}

let validateYamlVars = (yaml) => {
  if (DEBUG) console.log("-- validateYamlVars --")
  return new Promise((resolve, reject) => {
    try {
      /// test si il exist le block vars dans le yaml
      if (!yaml.hasOwnProperty("vars")) return resolve(yaml)

      let vars = yaml.vars

      /// test si le block vars n'est pas vide
      if (vars == null) throw("Vars block has no value")
      /// test si le block vars est de type objet
      if (vars instanceof Array) throw("Vars block must be of object type")

      Object.keys(vars).map((keyName) => {
        /// test si la cle dans le block vars a une valeur
        if (vars[keyName] == null || vars[keyName][0] == null && vars[keyName] instanceof Array) throw(`In vars block, the key:${keyName} has no value`)
        /// test si la valeur dans la cle est de type string
        if (typeof(vars[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (vars[keyName].hasOwnProperty("[object Object]")) throw(`In vars block, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In vars block, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(vars[keyName], REGEX_VARIABLE))) {

          matches.map((match) => {
            /// test si la variable est contenu dans env
            if (process.env[match[1]]) {
              vars[keyName] = replaceAt(vars[keyName], match[0], process.env[match[1]])
            /// test si la variable est contenu dans vars block
            } else if (vars[match[1]]) {
              /// test si la variable contient une interpolation
              if ((match2 = RegExp(REGEX_VARIABLE).exec(vars[match[1]]))) {
                /// test si la c'est une circulaire entre deux variable
                if (match2[1] == keyName) throw(`In vars block, key:${keyName} is a circular with key:${match[1]}`)
                throw(`In vars block, variable:${match[1]} must be declared before the variable:${keyName}`)
              }
              vars[keyName] = replaceAt(vars[keyName], match[0], vars[match[1]])
            } else {
              throw(`In vars block, the key:${keyName} use a undefined variable:${match[1]}`)
            }
          })

        }
      })
      yaml.vars = vars
      resolve(yaml)
    } catch (error) {
      reject(error)
    }
  })
}

let validateYamlPrefix = (yaml) => {
  if (DEBUG) console.log("-- validateYamlPrefix --")
  return new Promise((resolve, reject) => {
    try {
      /// test si il exist le block prefix dans le yaml
      if (!yaml.hasOwnProperty("prefix")) return resolve(yaml)

      let prefixs = yaml.prefix

      /// test si le block prefix n'est pas vide
      if (prefixs == null) throw("Prefix block has no value")
      /// test si le block prefix est de type array
      if (!(prefixs instanceof Array)) throw("prefix block must be of array type")

      prefixs.map((prefix, index) => {
        /// test si prefix est de type object
        if (!(prefix instanceof Object)) throw(`In prefix block, index:${index}, prefix must be of object type`)

        let keysName = Object.keys(prefix)

        /// test si les cle obligatoir sont dans l'object prefix
        VALIDATION_CONFIG["prefix"].require.map((keyName) => {
          if (!keysName.includes(keyName)) throw(`In prefix block, index:${index}, require key:${keyName}`)
        })

        keysName.map((keyName) => {
          /// test si la cle est dans la list valid
          if (!VALIDATION_CONFIG["prefix"].valid.includes(keyName)) throw(`In prefix block, index:${index}, key:${keyName} is not valid`)
          /// test si la valeur dans la cle est vide
          if (prefix[keyName] == null) throw(`In prefix block, index:${index}, value of key:${keyName} is empty`)
          /// test si la la valeur dans la cle n'est pas un string
          if (typeof(prefix[keyName]) != "string") {
            /// test si il manque les doubles quotes pour l'interpolation
            if (prefix[keyName].hasOwnProperty("[object Object]")) throw(`In prefix block, index:${index}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
            throw(`In prefix block, index:${index}, value of key:${keyName} need to be of string type`)
          }
          /// test si la valeur associé a la cle contient une variable ou plus
          if ((matches = matchesVariables(prefix[keyName], REGEX_VARIABLE))) {
            matches.map((match) => {
              /// test si la variable est contenu dans env
              if (process.env[match[1]]) {
                prefix[keyName] = replaceAt(prefix[keyName], match[0], process.env[match[1]])
              /// test si la variable est contenu dans vars block
              } else if (yaml.vars[match[1]]) {
                prefix[keyName] = replaceAt(prefix[keyName], match[0], yaml.vars[match[1]])
              } else {
                throw(`In prefix block, index:${index}, the key:${keyName} use a undefined variable:${match[1]}`)
              }
            })
          }
        })
      })
      yaml.prefix = prefixs
      resolve(yaml)
    } catch (error) {
      reject(error)
    }
  })
}

let validationActionArg = (arg, actionName, yaml) => {
  if (DEBUG) console.log(`-- validationActionArg --`)
  return new Promise((resolve, reject) => {
    try {
      /// test si arg est de type object
      if (!(arg instanceof Object) || arg instanceof Array) throw(`In actions block, name:${actionName}, arg must be of object type`)

      let keysName = Object.keys(arg)

      /// test si les cle obligatoir sont dans l'object arg
      VALIDATION_CONFIG["arg"].require.map((keyName) => {
        if (!keysName.includes(keyName)) throw(`In actions block > arg, name:${actionName}, require key:${keyName}`)
      })

      keysName.map((keyName) => {
        /// test si la cle est dans la list valid
        if (!VALIDATION_CONFIG["arg"].valid.includes(keyName)) throw(`In actions block > arg, name:${actionName}, key:${keyName} is not valid`)
        /// test si la valeur dans la cle est vide
        if (arg[keyName] == null) throw(`In actions block > arg, name:${actionName}, value of key:${keyName} is empty`)
        /// test si la la valeur dans la cle n'est pas un string
        if (typeof(arg[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (arg[keyName].hasOwnProperty("[object Object]")) throw(`In actions block > arg, name:${actionName}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In actions block > arg, name:${actionName}, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(arg[keyName], REGEX_VARIABLE)) && VALIDATION_CONFIG["arg"].interpolation.includes(keyName)) {
          matches.map((match) => {
            /// test si la variable est contenu dans env
            if (process.env[match[1]]) {
              arg[keyName] = replaceAt(arg[keyName], match[0], process.env[match[1]])
            /// test si la variable est contenu dans vars block
            } else if (yaml.vars[match[1]]) {
              arg[keyName] = replaceAt(arg[keyName], match[0], yaml.vars[match[1]])
            } else {
              throw(`In actions block > arg, name:${actionName}, the key:${keyName} use a undefined variable:${match[1]}`)
            }
          })
        }
      })
      resolve(arg)
    } catch (error) {
      reject(error)
    }
  })
}

let validationActionOption = (option, actionName, index, yaml) => {
  if (DEBUG) console.log(`-- validationActionOption --`)
  return new Promise((resolve, reject) => {
    try {
      /// test si option est de type object
      if (!(option instanceof Object) || option instanceof Array) throw(`In actions block, name:${actionName} and index:${index}, option value must be of object type`)

      let keysName = Object.keys(option)

      /// test si les cle obligatoir sont dans l'object option
      VALIDATION_CONFIG["option"].require.map((keyName) => {
        if (!keysName.includes(keyName)) throw(`In actions block > options, name:${actionName} and index:${index}, require key:${keyName}`)
      })

      keysName.map((keyName) => {
        /// test si la cle est dans la list valid
        if (!VALIDATION_CONFIG["option"].valid.includes(keyName)) throw(`In actions block > options, name:${actionName} and index:${index}, key:${keyName} is not valid`)
        /// test si la valeur dans la cle est vide
        if (option[keyName] == null) throw(`In actions block > options, name:${actionName} and index:${index}, value of key:${keyName} is empty`)
        /// test si la la valeur dans la cle n'est pas un string
        if (typeof(option[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (option[keyName].hasOwnProperty("[object Object]")) throw(`In actions block > options, name:${actionName} and index:${index}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In actions block > options, name:${actionName} and index:${index}, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(option[keyName], REGEX_VARIABLE)) && VALIDATION_CONFIG["option"].interpolation.includes(keyName)) {
          matches.map((match) => {
            /// test si la variable est contenu dans env
            if (process.env[match[1]]) {
              option[keyName] = replaceAt(option[keyName], match[0], process.env[match[1]])
            /// test si la variable est contenu dans vars block
            } else if (yaml.vars[match[1]]) {
              option[keyName] = replaceAt(option[keyName], match[0], yaml.vars[match[1]])
            } else {
              throw(`In actions block > options, name:${actionName} and index:${index}, the key:${keyName} use a undefined variable:${match[1]}`)
            }
          })
        }
      })
      resolve(option)
    } catch (error) {
      reject(error)
    }
  })
}

let validationActionRegister = (register, actionName, index, yaml) => {
  if (DEBUG) console.log(`-- validationActionRegister --`)
  return new Promise((resolve, reject) => {
    try {
      /// test si option est de type object
      if (!(register instanceof Object) || register instanceof Array) throw(`In actions block, name:${actionName} and index:${index}, register value must be of object type`)

      let keysName = Object.keys(register)

      /// test si les cle obligatoir sont dans l'object register
      VALIDATION_CONFIG["register"].require.map((keyName) => {
        if (!keysName.includes(keyName)) throw(`In actions block > register, name:${actionName} and index:${index}, require key:${keyName}`)
      })


      keysName.map((keyName) => {
        /// test si la cle est dans la list valid
        if (!VALIDATION_CONFIG["register"].valid.includes(keyName)) throw(`In actions block > register, name:${actionName} and index:${index}, key:${keyName} is not valid`)
        /// test si la valeur dans la cle est vide
        if (register[keyName] == null) throw(`In actions block > register, name:${actionName} and index:${index}, value of key:${keyName} is empty`)
        /// test si la la valeur dans la cle n'est pas un string
        if (typeof(register[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (register[keyName].hasOwnProperty("[object Object]")) throw(`In actions block > register, name:${actionName} and index:${index}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In actions block > register, name:${actionName} and index:${index}, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(register[keyName], REGEX_VARIABLE)) && VALIDATION_CONFIG["register"].interpolation.includes(keyName)) {
          matches.map((match) => {
            /// test si la variable est contenu dans env
            if (process.env[match[1]]) {
              register[keyName] = replaceAt(register[keyName], match[0], process.env[match[1]])
            /// test si la variable est contenu dans vars block
            } else if (yaml.vars[match[1]]) {
              register[keyName] = replaceAt(register[keyName], match[0], yaml.vars[match[1]])
            } else {
              throw(`In actions block > register, name:${actionName} and index:${index}, the key:${keyName} use a undefined variable:${match[1]}`)
            }
          })
        }
      })
      resolve(register)
    } catch (error) {
      reject(error)
    }
  })
}

let validationActionExec = (execs, actionName, index, yaml, runtimeVar) => {
  if (DEBUG) console.log(`-- validationActionExec --`)
  return new Promise((resolve, reject) => {
    try {
      /// test si execs est de type object
      if (!(execs instanceof Object) || execs instanceof Array) throw(`In actions block, name:${actionName} and index:${index}, exec value must be of object type`)

      let keysName = Object.keys(execs)

      /// test si les cle obligatoir sont dans l'object exec
      VALIDATION_CONFIG["exec"].require.map((keyName) => {
        if (!keysName.includes(keyName)) throw(`In actions block > exec, name:${actionName} and index:${index}, require key:${keyName}`)
      })

      keysName.map((keyName) => {
        /// test si la cle est dans la list valid
        if (!VALIDATION_CONFIG["exec"].valid.includes(keyName)) throw(`In actions block > exec, name:${actionName} and index:${index}, key:${keyName} is not valid`)
        /// test si la valeur dans la cle est vide
        if (execs[keyName] == null) throw(`In actions block > exec, name:${actionName} and index:${index}, value of key:${keyName} is empty`)
        /// test si la la valeur dans la cle n'est pas un string
        if (typeof(execs[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (execs[keyName].hasOwnProperty("[object Object]")) throw(`In actions block > exec, name:${actionName} and index:${index}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In actions block > exec, name:${actionName} and index:${index}, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(execs[keyName], REGEX_VARIABLE))) {
          /// test si la cle est dans le tableau des interpolation
          if (VALIDATION_CONFIG["exec"].interpolation.includes(keyName)) {
            matches.map((match) => {
              /// test si la variable est contenu dans env
              if (process.env[match[1]]) {
                execs[keyName] = replaceAt(execs[keyName], match[0], process.env[match[1]])
              /// test si la variable est contenu dans vars block
              } else if (yaml.vars[match[1]]) {
                execs[keyName] = replaceAt(execs[keyName], match[0], yaml.vars[match[1]])
              } else {
                throw(`In actions block > exec, name:${actionName}, the key:${keyName} use a undefined variable:${match[1]}`)
              }
            })
          } else {
            matches.map((match) => {
              /// test si la variable est contenu dans runtimeVar
              if (!runtimeVar.includes(match[1])) throw(`In actions block > exec, name:${actionName}, the key:${keyName} use a undefined variable:${match[1]}`)
              execs[keyName] = replaceAt(execs[keyName], match[0], "${ vars[ \"" + match[1] + "\" ] }")
            })
          }
        }
      })
      resolve(execs)
    } catch (error) {
      reject(error)
    }
  })
}

let validateYamlAction = (action, yaml) => {
  if (DEBUG) console.log("-- validateYamlAction --")
  return new Promise(async(resolve, reject) => {
    try {
      /// test si action est de type object
      if (action instanceof Array || typeof(action) == "string") throw("Action block must be of object type")
      /// test si action est vide
      if (!action) throw(`In actions block, action is empty, you are - without keys`)
      /// test si il y a la cle name ou si elle est sans valeur
      let actionName
      if (!(actionName = action.name)) throw(`In actions block, missing key:name or is empty`)
      /// test si il y a plusieur action avec le meme name
      if (yaml.actions.filter(action => action.name == actionName).length > 1) throw(`In actions block, name:${actionName}, duplicate`)

      let keysName = Object.keys(action)

      /// test si les cle obligatoir sont dans l'object action
      VALIDATION_CONFIG["action"].require.map((keyName) => {
        if (!keysName.includes(keyName)) throw(`In actions block, name:${actionName}, require key:${keyName}`)
      })

      let runtimeVar = []
      if (yaml.vars) runtimeVar = [...runtimeVar, ...Object.keys(yaml.vars)]
      /// test si la cle arg exist
      if (action.hasOwnProperty("arg")) {
        /// test si arg est vide
        if (!action.arg) throw(`In actions block, name:${actionName}, key:arg is empty`)
        action.arg = await validationActionArg(action.arg, actionName, yaml)
        // runtimeVar.push(action.arg.name)
        /// test si les nouveaux nom de variable existent deja dans runtimeVar
        if (runtimeVar.includes(action.arg.name)) throw(`In actions block > arg name:${actionName} value:${runtimeVar[0]} in name already use in vars`)
        runtimeVar = [...runtimeVar, action.arg.name]
      }

      /// test si la cle options exist
      if (action.hasOwnProperty("options")) {
        /// test si options est vide
        if (!action.options) throw(`In actions block, name:${actionName}, key:options is empty`)
        /// test si options est de type array
        if (!(action.options instanceof Array)) throw(`In actions block, name:${actionName}, options must be of array type`)
        action.options = await Promise.all(action.options.map((option, index) => validationActionOption(option, actionName, index, yaml)))
        let newRuntimeVar = action.options.map(option => option.name)
        /// test si les nouveaux nom de variable existent deja dans runtimeVar
        if (newRuntimeVar.includes(runtimeVar[0])) throw(`In actions block > options name:${actionName} value:${runtimeVar[0]} in name already use in arg`)
        runtimeVar = [...runtimeVar, ...action.options.map(option => option.name)]
      }

      /// test si la cle register exist
      if (action.hasOwnProperty("registers")) {
        /// test si register est vide
        if (!action.registers) throw(`In actions block, name:${actionName}, key:registers is empty`)
        /// test si options est de type array
        if (!(action.registers instanceof Array)) throw(`In actions block, name:${actionName}, registers must be of array type`)
        action.registers = await Promise.all(action.registers.map((register, index) => validationActionRegister(register, actionName, index, yaml)))
        action.registers.map((register) => {
          /// test si les nouveaux nom de variable existent deja dans runtimeVar
          if (runtimeVar.includes(register.name)) throw(`In actions block > registers name:${actionName} value:${register} in name already use in arg or options`)
        })
        runtimeVar = [...runtimeVar, ...action.registers.map(register => register.name)]
      }

      /// test si exec est vide
      if (!action.exec) throw(`In actions block, name:${actionName}, key:exec is empty`)
      /// test si exec est de type array
      if (!(action.exec instanceof Array)) throw(`In actions block, name:${actionName}, registers must be of array type`)
      action.exec = await Promise.all(action.exec.map((exec, index) => validationActionExec(exec, actionName, index, yaml, runtimeVar)))

      for(let keyName of keysName.filter(name => !ACTION_SUB_BLOCK.includes(name))) {
        if (DEBUG) console.log(`------ ${keyName} -------`);
        /// test si la cle est dans la list valid
        if (!VALIDATION_CONFIG["action"].valid.includes(keyName)) throw(`In actions block, name:${actionName}, key:${keyName} is not valid`)
        /// test si la valeur dans la cle est vide
        if (action[keyName] == null) throw(`In actions block, name:${actionName}, value of key:${keyName} is empty`)
        /// test si la la valeur dans la cle n'est pas un string
        if (typeof(action[keyName]) != "string") {
          /// test si il manque les doubles quotes pour l'interpolation
          if (action[keyName].hasOwnProperty("[object Object]")) throw(`In actions block, name:${actionName}, key:${keyName} missing "" between interpolation "demo of {{ var }} spm"`)
          throw(`In actions block, name:${actionName}, value of key:${keyName} need to be of string type`)
        }
        /// test si la valeur associé a la cle contient une variable ou plus
        if ((matches = matchesVariables(action[keyName], REGEX_VARIABLE))) {
          /// test si la cle est dans le tableau des interpolation
          if (VALIDATION_CONFIG["action"].interpolation.includes(keyName)) {
            matches.map((match) => {
              /// test si la variable est contenu dans env
              if (process.env[match[1]]) {
                action[keyName] = replaceAt(action[keyName], match[0], process.env[match[1]])
              /// test si la variable est contenu dans vars block
              } else if (yaml.vars[match[1]]) {
                action[keyName] = replaceAt(action[keyName], match[0], yaml.vars[match[1]])
              } else {
                throw(`In actions block, name:${actionName}, the key:${keyName} use a undefined variable:${match[1]}`)
              }
            })
          } else {
            matches.map((match) => {
              /// test si la variable est contenu dans runtimeVar
              if (!runtimeVar.includes(match[1])) throw(`In actions block, name:${actionName}, the key:${keyName} use a undefined variable:${match[1]}`)
              action[keyName] = replaceAt(action[keyName], match[0], "${ vars[ \"" + match[1] + "\" ] }")
            })
          }
        }
      }
      resolve(action)
    } catch (error) {
      reject(error)
    }
  })
}

let validateYamlActionsAll = (yaml) => {
  if (DEBUG) console.log("-- validateYamlActionsAll --")
  return new Promise(async(resolve, reject) => {
    try {
      /// test si il exist le block actions dans le yaml
      if (!yaml.hasOwnProperty("actions")) throw(`Actions block missing`)
      /// test si actions est de type array
      if (!(yaml.actions instanceof Array)) throw(`Actions block must be of array type`)
      Promise.all(yaml.actions.map((action) => validateYamlAction(action, yaml)))
      .then((res) => {
        yaml.actions = res
        resolve(yaml)
      })
      .catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

let validateYaml = (yaml) => {
  return new Promise((resolve, reject) => {
    validateYamlVars(yaml)
    .then(validateYamlPrefix)
    .then(validateYamlActionsAll)
    .then(resolve)
    .catch(reject)
  })
}

let renderTemplate = (templateName, dist, variables, extention="js") => {
  return new Promise((resolve, reject) => {
    console.log(`${templateName}.${extention}.j2`)
    Fs.readFile(Path.resolve(TEMPLATE_PATH, `${templateName}.${extention}.j2`), 'utf8', (err, data) => {
      if (err) return reject(err)
      Fs.writeFile(`${dist}.${extention}`, ENV_NUNJUCKS.renderString(data, variables), (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  })
}

module.exports = {
  printError,
  printWarning,
  printSuccess,
  renderTemplate,
  readYaml,
  validateYaml
}
