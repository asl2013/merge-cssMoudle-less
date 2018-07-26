const fs = require('fs-extra');

const replaceLess = (lessPath,aliasMap) => {
  const fileContent = fs.readFileSync(lessPath).toString();
  let lessString = fileContent;
  aliasMap = aliasMap || {};
  for(let aliasName in aliasMap){
      lessString = lessString.replace(new RegExp(`~${aliasName}`,'g'),aliasMap[aliasName]);
  }
  return lessString;
};
module.exports = replaceLess;
