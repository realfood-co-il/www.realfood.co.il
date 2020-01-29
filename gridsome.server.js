'strict';
// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api/

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const fs = require('fs')
const { google } = require('googleapis')

const google_key = JSON.parse(fs.readFileSync('secrets.json'))['google_key']
const videos = JSON.parse(fs.readFileSync('videos.json'))

const youtube = google.youtube({ version: 'v3', auth: google_key })

module.exports = function (api) {
  api.loadSource(async ({ addCollection, store }) => {

    // youtube#channels
    const youtubeChannels = addCollection('YouTubeChannel')
    await videos['channels'].forEach(async (channel) => {
      let response = {}
      const cacheFile = `youtube/channels/${channel.id}.json`
      if (fs.existsSync(cacheFile)) {
        response = JSON.parse(fs.readFileSync(cacheFile))
      } else {
        response = await youtube.channels.list({
          part: 'snippet,contentDetails',
          id: channel.id
        })
        fs.writeFileSync(cacheFile, JSON.stringify(response))
      }
      youtubeChannels.addNode({
        ...response.data.items[0],
        id: response.data.items[0].id
      })
    })

    // youtube#users
    const youtubeUsers = addCollection('YouTubeUser')
    await videos['users'].forEach(async (user) => {
      let response = {}
      const cacheFile = `youtube/users/${user.id}.json`
      if (fs.existsSync(cacheFile)) {
        response = JSON.parse(fs.readFileSync(cacheFile))
      } else {
        response = await youtube.channels.list({
          part: 'snippet,contentDetails',
          forUsername: user.id
        })
        fs.writeFileSync(cacheFile, JSON.stringify(response))
      }
      youtubeUsers.addNode({
        ...response.data.items[0],
        id: response.data.items[0].id
      })
    })

    // youtube#playlistItemList from channels
    const youtubePlaylistItems = addCollection('YouTubePlaylistItem')
    youtubeChannels.data().forEach(async (channel) => {
      const playlistId = channel.contentDetails.relatedPlaylists.uploads
      let response = {}
      const cacheFile = `youtube/playlists/${playlistId}.json`
      if (fs.existsSync(cacheFile)) {
        response = JSON.parse(fs.readFileSync(cacheFile))
      } else {
        response = await youtube.playlistItems.list({
          part: "snippet,contentDetails,status",
          playlistId,
          maxResults: 50
        })
        fs.writeFileSync(cacheFile, JSON.stringify(response))
      }
      response.data.items.forEach(item => {
        youtubePlaylistItems.addNode({
          ...item,
          id: item.id
        })
      })
    })

    //
    // TODO: Add pagination to channel playlistitems
    // TODO: Add pagination to loading responses from cache files
    //

    // youtube#playlistItemList from users
    youtubeUsers.data().forEach(async (user) => {
      const playlistId = user.contentDetails.relatedPlaylists.uploads
      let response = {}
      let cacheFile = `youtube/playlists/${playlistId}.json`
      if (fs.existsSync(cacheFile)) {
        response = JSON.parse(fs.readFileSync(cacheFile))
      } else {
        let pageToken
        do {
          response = await youtube.playlistItems.list({
            part: "snippet,contentDetails",
            playlistId,
            maxResults: 50,
            pageToken
          })
          pageToken = undefined
          fs.writeFileSync(cacheFile, JSON.stringify(response))
          if (Object.keys(response.data).includes('nextPageToken')) {
            pageToken = response.data.nextPageToken
            cacheFile = `youtube/playlists/${playlistId}-${pageToken}.json`
          }
        } while (pageToken !== undefined)
      }
      response.data.items.forEach(item => {
        youtubePlaylistItems.addNode({
          ...item,
          id: item.id
        })
      })
    })

    const youtubeVideos = addCollection('YouTubeVideo')
    youtubePlaylistItems.data().forEach(async (playlistItem) => {
      const videoId = playlistItem.contentDetails.videoId
      let response = {}
      const cacheFile = `youtube/videos/${videoId}.json`
      if (fs.existsSync(cacheFile)) {
        response = JSON.parse(fs.readFileSync(cacheFile))
      } else {
        response = await youtube.videos.list({
          part: "snippet,contentDetails",
          id: videoId
        })
        fs.writeFileSync(cacheFile, JSON.stringify(response))
      }
    })

    // const youtubeSearchVideos = await youtube.search.list({
    //   part: 'snippet',
    //   maxResults: 50,
    //   // eventType: 'completed',
    //   type: 'video',
    //   // safeSearch: 'strict',
    //   // videoEmbeddable: true,
    //   channelId: videos['channels'][0].id,
    // })
    // fs.writeFileSync('channelVideos.json', JSON.stringify(youtubeSearchVideos, null, 2))

    const youtubeSearchVideos = JSON.parse(fs.readFileSync("channelVideos.json"))

    youtubeSearchVideos.data.items.forEach(video => {
      youtubeVideos.addNode({
        ...video,
        id: video.id.videoId,
        channel: store.createReference('YouTubeChannel', video.snippet.channelId)
      })
    })

    // .forEach(video => {
    //   youtubeVideo.addNode(video)
    // })

    // // Use the Data Store API here: https://gridsome.org/docs/data-store-api/
    // const youtubeChannels = await youtube.channels.list({
    //   forUsername: 'lowcarbdownunder',
    //   maxResults: 50,
    //   part: 'id,snippet'
    // })
    // const youtubeChannel = addCollection({
    //   typeName: 'YouTubeChannel'
    // })
    // youtubeChannels.data.items.forEach(channel => {
    //   youtubeChannel.addNode(channel)
    // })
  })

  // api.createPages(({ createPage }) => {
  //   // Use the Pages API here: https://gridsome.org/docs/pages-api/
  // })
}