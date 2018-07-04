const DIST_PATH = `${__dirname}/dist`
const MAIN_NAME = "greytape"

const {
  readConfig,
  createDirectory,
  createPrefixFolder,
  createFileCommand,
  renderTemplate,
  getPrefix
} = require('./libs')



let generate = async (resolve, reject) => {
  // get config in yaml file
  let data = await readConfig()

  // get all prefix command
  let prefixs = getPrefix(data.actions)

  // create dist folder
  await createDirectory(DIST_PATH)

  // create prefix folder, file command and index
  for (let prefix of prefixs) {
    // prefix folder
    await createPrefixFolder(DIST_PATH, prefix)

    // list of commands by prefix
    let commands = data.actions.filter(action => action.prefix == prefix)

    // render template command and write file
    for(let command of commands) {
      await renderTemplate("command", `${DIST_PATH}/${prefix}/${command.name}`, command)
    }

    // create index prefix with all command
    await renderTemplate("commandIndex", `${DIST_PATH}/${prefix}/index`, {names: commands.map(command => command.name)})

    // create prefix group command
    await renderTemplate("commandGroup", `${DIST_PATH}/${MAIN_NAME}-${prefix}`, {name: prefix})
  }

  // create action directory
  await createDirectory(`${DIST_PATH}/actions`)

  // list of commands without prefix
  let commands = data.actions.filter(action => !action.prefix)

  // render template command and write file
  for(let command of commands){
    await renderTemplate("command", `${DIST_PATH}/actions/${command.name}`, command)
  }

  // create index prefix with all command
  await renderTemplate("commandIndex", `${DIST_PATH}/actions/index`, {names: commands.map(command => command.name)})

  // create main
  await renderTemplate("main", `${DIST_PATH}/${MAIN_NAME}`, {prefixs: data.prefix})

  // create libs file
  await renderTemplate("libs", `${DIST_PATH}/libs`, {})
}

generate()
.then(() => {
  console.log("success to generate")
})
.catch(console.error)
