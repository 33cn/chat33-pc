const TerserPlugin = require('terser-webpack-plugin');
const tsImportPluginFactory = require('ts-import-plugin')

const releaseNote = {
  isUnSkip: true,
  notes: [
    '@功能',
  ]
};

module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        'productName': 'Chat33',
        'appId': 'com.33.chat33pc',
        'nsis': {
          'oneClick': false,
          'allowToChangeInstallationDirectory': true
        },
        'releaseInfo': {
          'releaseNotes': JSON.stringify(releaseNote)
        },
        'publish': [
          {
            'provider': 'generic',
            'url': process.env.VUE_APP_UPDATE_ADDRESS
          }
        ],
        'mac': {
          'icon': './public/icon.icns'
        },
        'win': {//win相关配置
          'icon': './public/icon.ico',
          "target": [
            {
              "target": "nsis",
              "arch": [
                "x64",
                "ia32"
              ]
            }
          ]
        },
      }
    }
  },
  configureWebpack: {
    optimization: {
      minimizer: process.env.NODE_ENV === "production" ? [new TerserPlugin({ terserOptions: { compress: { drop_console: true } } })] : []
    }
  }
};
