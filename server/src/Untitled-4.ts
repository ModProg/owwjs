import _ = require('underscore');

_.map(_.keys(new Map([["test1","lol"],["test2","lol2"]])),(e,k)=>(console.log(e+k)))