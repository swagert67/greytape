const Fs = require('fs')
const Path = require('path')

let deleteContentDirectoryCallback = (path, done) => {
  let tree = { files: [] }
  Fs.access(path, (err) => {
    if (err) done(err, tree)
    Fs.readdir(path, (err, files) => {
      if (err) done(err, tree)
      if (files.length == 0) done(null, tree)
      for (let file of files) {
        file = Path.resolve(path, file)
        Fs.stat(file, (err, stat) => {
          if (err) done(err, tree)
          if (stat && !stat.isDirectory()) {
            tree.files.push(file)
            Fs.unlink(file, (err) => {
              if (err) done(err, tree)
              if (!--files.length) done(null, tree)
            })
          } else {
            deleteContentDirectoryCallback(file, (err, tree2) => {
              if (err) done(err, tree)
              tree[file] = tree2
              Fs.rmdir(file, (err) => {
                if (err) done(err, tree)
                if (!--files.length) done(null, tree)
              })
            })
          }
        })
      }
    })
  })
}

let deleteContentDirectory = (path) => {
  return new Promise((resolve, reject) => {
    deleteContentDirectoryCallback(path, (err, tree) => {
      if (err) return reject(err)
      resolve(tree)
    })
  })
}

let mkdir = (path) => {
  return new Promise((resolve, reject) => {
    Fs.mkdir(path, (err) => {
      if (err && err.code == "EEXIST") return resolve("exist")
      if (err) return reject(err)
      resolve("create")
    })
  })
}

module.exports = {
  deleteContentDirectoryCallback,

  deleteContentDirectory,
  mkdir
};
