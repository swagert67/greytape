// let str = "docker container exec -it {{ container }} /bin/bash"
//
// let vars = {
//   container: "api_container"
// }
//
// const regex = /{{\s*(\S*)\s*}}/gm;
//
// let res = regex.exec(str)
//
// console.log(res)
//
// console.log(str.substring(0, res.index));
//
// console.log(str.substring(res.index + res[0].length))
//
// console.log(`${str.substring(0, res.index)}${vars[res[1]]}${str.substring(res.index + res[0].length)}`);
//
//
// var strfun = "function myfun(arg) { return arg * 3; }";
//
// eval(strfun);
//
// function usefun(x)
// {
//   var res = myfun(x);
//   console.log(res);
// }
//
// usefun(5)
//
// // function replaceAt(string, index, replace) {
// //   return string.substring(0, index) + replace + string.substring(index + 1);
// // }
// //
// // console.log( replaceAt(str, ) )
//
//
//
//
// let truc = "`key: ${key} missing in action arg obj, command name: ${name}`"
//
// console.log(truc)
//
// let key = "merde1"
// let name = "merde2"
//
// console.log(eval(truc))



// let str = "je suis {{ container }} est j'ai {{ truc }}";
// let str = "je suis {{ container }}";
let str = "je suis";

let matchesVariables = (value) => {
  const regex = /{{\s*(\S*)\s*}}/gm;
  let matches = []
  while ((match = regex.exec(value)) !== null) {
    matches.push(match)
    if (match.index === regex.lastIndex) regex.lastIndex++
  }
  return matches.length ? matches : null
}

let test = matchesVariables(str)

console.log(test)
