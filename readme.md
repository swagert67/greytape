# GREYTAPE

## demo

1. Install greytape cli `npm i -g greytape-demo`
2. Go to the desktop folder: `cd ~/Desktop`
3. Create new directory with demo name: `mkdir demo && cd demo`
4. Create yaml file: `touch greytape.yml`
3. Add config content in yaml file (find yaml file example in github)
4. Generate your cli: `greytape g <cli-name>`
5. Test your cli
  1. Go to the folder of your cli: `cd cli-<cli-name>`
  2. Install dependencies: `npm i`
  3. Show command list: `node <cli-name>.js`


## config

```yaml
vars: # OPTIONAL
  name: value # only string
  name2: value2

actions: # REQUIRE
  - name: create nginx api # name of action
    command: up # command in cli for action
    alias: u # OPTIONAL shot command
    prefix: # OPTIONAL add this command in group of command
    description: # OPTIONAL description  of command
    arg: # OPTIONAL argument passed to the command
      name: command # the name of the variable where one assign arg
      description: command exec in container # OPTIONAL argument description in cli
      default: ping google.com # OPTIONAL default value of arg
    options: # OPTIONAL option passed to the command
      - name: port # the name of the variable where one assign option value and option in cli to be use
        alias: p # OPTIONAL short cli option
        value: "9090" # OPTIONAL default option value
        description: port extern # OPTIONAL option description in cli
    register: # OPTIONAL variable create from an action
      - name: user # the name of the variable where one assign value return by command
        command: printenv USER # command executed to get the value
        pwd: "/" # OPTIONAL context for the execution of the command
    exec: # array of command executed
      - cmd: npm run build # command executed
        cwd: ./frontend # OPTIONAL context for the execution of the command
prefix: # OPTIONAL
  - name: api # group command name
    description: action on api container # OPTIONAL group description in cli
    alias: a # OPTIONAL group short command name
```

## todo

* vars add array or object
* add type boolean, number and ...


* option without value (-i)
```yaml
- name: tty
  alias: i
  description: tty interaction
  value: -it
  default: -it
```

in code
```javascript
for(option of options) {
  if (opts[option.name]) {
    if (option.value) {
      vars[option.name] = option.value
    } else {
      vars[option.name] = opts[option.name]
    }
  } else {
    if (option.default) {
      vars[option.name] = option.default
    }
  }
}
```
