"use strict"

// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api/

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const fs = require('fs')
const youtube = require('./lib/youtube')

const youtubeSource = function (api) {
  api.loadSource(async ({ addCollection, store }) => {
    const videos = JSON.parse(await fs.promises.readFile('videos.json'))

    const ytChannels = addCollection('ytChannel')
    ;(await youtube.channels(videos.channels)).forEach(
      channel => ytChannels.addNode(channel)
    )

    const ytUsers = addCollection('ytUser')
    ;(await youtube.users(videos.users)).forEach(
      user => ytUsers.addNode(user)
    )

    const ytPlaylistItems = addCollection('ytPlaylistItem')
    const channelPlaylistItems = ytChannels.data().map(channel => ({ id: channel.contentDetails.relatedPlaylists.uploads }))
    ;(await youtube.playlistItems(channelPlaylistItems)).forEach(playlistItem => {
      if (typeof playlistItem === 'undefined') {
        console.log(`Playlist item was undefined!`)
        return
      }
      ytPlaylistItems.addNode(playlistItem)
    })

    const userPlaylistItems = ytUsers.data().map(user => ({ id: user.contentDetails.relatedPlaylists.uploads }))
    ;(await youtube.playlistItems(userPlaylistItems)).forEach(playlistItem => {
      if (typeof playlistItem === 'undefined') {
        console.log(`Playlist item was undefined!`)
        return
      }
      ytPlaylistItems.addNode(playlistItem)
    })

    const ytVideos = addCollection('ytVideo')
    const playlistItems = ytPlaylistItems.data().map(pli => ({ id: pli.contentDetails.videoId }))
    console.dir(playlistItems, { depth: null })

    // const youtubeVideos = addCollection('YouTubeVideo')
    // youtubePlaylistItems.data().forEach(async (playlistItem) => {
    //   const videoId = playlistItem.contentDetails.videoId
    //   let response = {}
    //   const cacheFile = `youtube/videos/${videoId}.json`
    //   if (existsSync(cacheFile)) {
    //     response = JSON.parse(readFileSync(cacheFile))
    //   } else {
    //     response = await youtube.videos.list({
    //       part: "snippet,contentDetails",
    //       id: videoId
    //     })
    //     writeFileSync(cacheFile, JSON.stringify(response))
    //   }
    // })

    // // const youtubeSearchVideos = await youtube.search.list({
    // //   part: 'snippet',
    // //   maxResults: 50,
    // //   // eventType: 'completed',
    // //   type: 'video',
    // //   // safeSearch: 'strict',
    // //   // videoEmbeddable: true,
    // //   channelId: videos['channels'][0].id,
    // // })
    // // fs.writeFileSync('channelVideos.json', JSON.stringify(youtubeSearchVideos, null, 2))

    // const youtubeSearchVideos = JSON.parse(readFileSync("channelVideos.json"))

    // youtubeSearchVideos.data.items.forEach(video => {
    //   youtubeVideos.addNode({
    //     ...video,
    //     id: video.id.videoId,
    //     channel: store.createReference('YouTubeChannel', video.snippet.channelId)
    //   })
    // })

  })

  // api.createPages(({ createPage }) => {
  //   // Use the Pages API here: https://gridsome.org/docs/pages-api/
  // })
}

module.exports = youtubeSource