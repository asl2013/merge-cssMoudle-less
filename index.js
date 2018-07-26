const fs = require('fs');
const path = require('path');
const getLocalIdentName = require('./getLocalIdentName');
const AddlocalIdentName = require('./AddlocalIdentName');
const replaceDefaultLess = require('./replaceDefaultLess');

const readLessFiles = (dirs,lessArray) => {
  if(typeof(dirs) == 'string'){
    dirs = [dirs];
  }
  dirs = dirs || [];
  const promiseList = [];
  dirs.forEach(dir => {
    const status = fs.lstatSync(dir);
    if(status.isDirectory()){
      let childPaths = fs.readdirSync(dir);
      childPaths = childPaths.forEach(childPath => {
        return path.join(dir,childPath);
      });
      promiseList.push(readLessFiles(childPaths,lessArray));
    }else if (dir.indexOf('.less') > -1) {
      const fileContent = replaceDefaultLess(dir);
      promiseList.push(
          AddlocalIdentName(dir, fileContent, getLocalIdentName(dir)).then(result => {
            lessArray.push(result);
          })
      );
    }
  });
  return Promise.all(promiseList);
};

class mergeLessPlugin {
  constructor(options) {
    const defaultOptions = {
      stylesDir: path.join(__dirname, './src/'),
      outFile: path.join(__dirname, './tmp/merge-less.less'),
    };
    this.options = Object.assign(defaultOptions, options);
    this.generated = false;
  }

  apply(compiler) {
    const { options } = this;
    compiler.plugin('emit', (compilation, callback) => {
      const { outFile } = options;
      let lessArray = ['@import "../node_modules/antd/lib/style/themes/default.less";'];
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      } else if (!fs.existsSync(path.dirname(outFile))) {
        fs.mkdirSync(path.dirname(outFile));
      }
      readLessFiles(options.stylesDir,lessArray).then(() => {
          fs.writeFileSync(outFile, lessArray.join('\n'));
          callback();
      });
    });
  }
}

module.exports = mergeLessPlugin;
