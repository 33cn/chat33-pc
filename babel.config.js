
module.exports = {
  presets =["@babel/preset-env","@vue/babel-preset-app","@babel/preset-typescript"],
  plugins: [
    ['import', { libraryName: "vant", libraryDirectory: "es", style: 'css' }, 'vant']
  ],
  //  exclude: /node_modules/
}