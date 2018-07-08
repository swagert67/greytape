const Path = require('path')
const Env = require('dotenv').config({ path: Path.resolve(process.cwd(), ".env") })

const { mkdir, deleteContentDirectory } = require('./fs-stu')
const { printWarning, readYaml, renderTemplate, validateYaml } = require('./libs')

// add all const in futur preferences file
const YAML_FILENAME = "greytape.yml"

let generate = (cliName, opts) => {
  const DIST_PATH = Path.resolve(process.cwd(), `cli-${cliName}`)

  return new Promise(async(resolve, reject) => {
    try {
      // get config in yaml file
      let yaml = await readYaml(Path.resolve(process.cwd(), opts.config || YAML_FILENAME))
      if (yaml == "missing") return reject(`Error name yaml file : ${opts.config || YAML_FILENAME}`)

      yaml = await validateYaml(yaml)

      /// test si dossier dist exist sinon on le creer
      let status = await mkdir(DIST_PATH)
      if (status == "exist") {
        if (opts.force) {
          printWarning("dist directory content removing")
          await deleteContentDirectory(DIST_PATH)
        } else {
          printWarning("dist directory already exist, use --force")
          return resolve("aborded")
        }
      }

      if (yaml.prefix) {
        // Command with prefix
        for( let prefix of yaml.prefix ) {
          // create prefix folder
          await mkdir(Path.resolve(DIST_PATH, prefix.name))

          // create new command array with this prefix
          let actions = yaml.actions.filter(action => action.prefix == prefix.name)

          // render each command file
          actions.map(async(action) => {
            // console.log(`create file ${action.command}`);
            await renderTemplate("command", Path.resolve(DIST_PATH, prefix.name, action.command), action)
          })

          // render index with all command
          await renderTemplate("commandIndex", Path.resolve(DIST_PATH, prefix.name, 'index'), {names: actions.map(action => action.command)})

          // create prefix group command
          await renderTemplate("commandGroup", Path.resolve(DIST_PATH, `${cliName}-${prefix.name}`), {name: prefix.name})
        }
      }

      // create new command array without prefix
      let actionsWithoutPrifix = yaml.actions.filter(action => !action.prefix)

      if (actionsWithoutPrifix.length > 0) {
        // create actions directory
        await mkdir(Path.resolve(DIST_PATH, 'actions'))

        // render each command file
        actionsWithoutPrifix.map(async(action) => {
          await renderTemplate("command", Path.resolve(DIST_PATH, 'actions', action.command), action)
        })

        // render index with all command
        await renderTemplate("commandIndex", Path.resolve(DIST_PATH, 'actions', 'index'), {names: actionsWithoutPrifix.map(action => action.command)})
      }

      let mainVars = {
        prefixs: yaml.prefix,
        actionsWithoutPrifix: actionsWithoutPrifix.length > 0
      }
      // create main
      await renderTemplate("main", Path.resolve(DIST_PATH, cliName), mainVars)

      // create libs file
      await renderTemplate("libs", Path.resolve(DIST_PATH, 'libs'), {})

      // create variable file
      await renderTemplate("config", Path.resolve(DIST_PATH, 'config'), {vars: yaml.vars})

      resolve("generate success")
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = generate;
