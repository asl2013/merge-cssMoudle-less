const fs = require('fs');
const path = require('path');
const getLocalIdentName = require('./getLocalIdentName');
const AddlocalIdentName = require('./AddlocalIdentName');
const replaceLess = require('./replaceLess');

const readLessFiles = (dirs,lessArray,options) => {
  if(typeof(dirs) == 'string'){
    dirs = [dirs];
  }
  dirs = dirs || [];
  const promiseList = [];
  dirs.forEach(dir => {
    const status = fs.lstatSync(dir);
    if(status.isDirectory()){
      let childPaths = fs.readdirSync(dir);
      childPaths = childPaths.map((childPath,index) => {
        return path.join(dir,childPath);
      });
      promiseList.push(readLessFiles(childPaths,lessArray,options));
    }else if (dir.indexOf('.less') > -1) {
      const fileContent = replaceLess(dir,options.alias);
      promiseList.push(
          AddlocalIdentName(dir, fileContent, getLocalIdentName(dir)).then(result => {
            lessArray.push(result);
            console.info(`merge less:${dir}`);
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
      alias : {
        'antd' : '../node_modules/antd'
      }
    };
    this.options = Object.assign(defaultOptions, options);
    this.generated = false;
  }

  apply(compiler) {
    const { options } = this;
    compiler.plugin('emit', (compilation, callback) => {
      const { outFile } = options;
      let lessArray = [];
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      } else if (!fs.existsSync(path.dirname(outFile))) {
        fs.mkdirSync(path.dirname(outFile));
      }
      readLessFiles(options.stylesDir,lessArray,options).then(() => {
          fs.writeFileSync(outFile, lessArray.join('\n'));
          console.info(`merge less done!`);
          callback();
      });
    });
  }
}

module.exports = mergeLessPlugin;
