/* eslint-disable no-dupe-keys */
// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'realfood.co.il',
  siteUrl: 'https://www.realfood.co.il',
  siteDescription: 'אוכל אמיתי מביא את מיטב ההרצאות מרופאים ומומחים המסבירים על ההשפעה של תזונה אמיתית על בריאות',
  titleTemplate: '%s - אוכל אמיתי',
  templates: {
    YtVideo: [{
      path: '/video/:id',
      component: './src/templates/YtVideo.vue',
      alias: '/video/:id/:snippet__title',
    }],
    // YtVideo: [{
    //   path: '/video/:id/:snippet__title',
    //   component: './src/templates/YouTubeVideo.vue'
    // }],
  },
  plugins: [],
  configureWebpack: {
  },
  chainWebpack(config) {
    config.mode('development')
    // config.plugins.delete('progress')
    // config.plugins.delete('no-emit-on-errors')
    // config.plugins.delete('hmr')
  }
}
