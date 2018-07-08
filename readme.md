# GREYTAPE

## demo

1. `npm i`
2. `node src/greytape.js` : show greytape cli
3. `node src/greytape.js g` : generate client cli
4. `node dist/stu.js` : show client cli

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

* change run to array of run
* vars add array or object
* add type boolean and number
