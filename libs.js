const Fs = require('fs')
const Nunjucks = require('nunjucks')
const ReadYaml = require('read-yaml')

const TEMPLATE_PATH = `${__dirname}/template`

const envNunjucks = new Nunjucks.Environment(null, {autoescape: false})

let readConfig = () => {
  return new Promise((resolve, reject) => {
    ReadYaml('config.yml', function(err, data){
      if (err) return reject(err)
      resolve(data)
    })
  })
}

let createDirectory = (path) => {
  return new Promise((resolve, reject) => {
    Fs.mkdir(path, (err) => {
      if (err) return reject(err)
      console.log("success create dist folder")
      resolve()
    })
  })
}

let createPrefixFolder = (distPath, prefix) => {
  return new Promise((resolve, reject) => {
    Fs.mkdir(`${distPath}/${prefix}`, (err) => {
      if (err) return reject(err)
      console.log("success create dist folder")
      resolve()
    })
  })
}

let createFileCommand = (distPath, folder, command) => {
  return new Promise((resolve, reject) => {
    Fs.writeFile(`${distPath}/${folder}/${command.name}.js`, 'Hello merde1', (err) => {
      if (err) return reject(err)
      console.log(`The file : /${folder}/${command.name}, has been saved!`)
      resolve()
    });
  })
}

let renderTemplate = (templateName, dist, variables, extention="js") => {
  console.log(extention);
  return new Promise((resolve, reject) => {
    Fs.readFile(`${TEMPLATE_PATH}/${templateName}.${extention}.j2`, 'utf8', (err, data) => {
      if (err) return reject(err)
      Fs.writeFile(`${dist}.${extention}`, envNunjucks.renderString(data, variables), (err) => {
        if (err) return reject(err)
        console.log(`The template : templateName, has been saved!`)
        resolve()
      })
    })
  })
}

let getPrefix = (actions) => {
  return actions.filter(action => action.prefix).map(action => action.prefix).reduce((accumulator, currentValue) => {
    accumulator = accumulator.length == 0 ? [currentValue] : [...accumulator]
    if(accumulator.filter(filter => filter == currentValue).length == 0) accumulator.push(currentValue)
    return accumulator
  }, [])
}

module.exports = {
  readConfig,
  createDirectory,
  createPrefixFolder,
  createFileCommand,
  renderTemplate,
  getPrefix
};
