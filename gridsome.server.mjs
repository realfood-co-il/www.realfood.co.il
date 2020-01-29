"use strict"

// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api/

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

import fs from 'fs'
import youtube from './lib/youtube.mjs'

const videos = JSON.parse(await fs.promises.readFile('videos.json'))

export default function (api) {
  api.loadSource(async ({ addCollection, store }) => {

    const youtubeChannels = addCollection('YouTubeChannel')
    youtube.channels(videos.channels).forEach(channel => youtubeChannels.addNode(channel))

    const youtubeUsers = addCollection('YouTubeUser')
    youtube.users(videos.users).forEach(user => youtubeUsers.addNode(user))

    // youtube#playlistItemList from channels
    const youtubePlaylistItems = addCollection('YouTubePlaylistItem')
    youtubeChannels.data().forEach(async (channel) => {
      const playlistId = channel.contentDetails.relatedPlaylists.uploads
      let response = {}
      const cacheFile = `youtube/playlists/${playlistId}.json`
      if (existsSync(cacheFile)) {
        response = JSON.parse(readFileSync(cacheFile))
      } else {
        response = await youtube.playlistItems.list({
          part: "snippet,contentDetails,status",
          playlistId,
          maxResults: 50
        })
        writeFileSync(cacheFile, JSON.stringify(response))
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
      if (existsSync(cacheFile)) {
        response = JSON.parse(readFileSync(cacheFile))
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
          writeFileSync(cacheFile, JSON.stringify(response))
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
      if (existsSync(cacheFile)) {
        response = JSON.parse(readFileSync(cacheFile))
      } else {
        response = await youtube.videos.list({
          part: "snippet,contentDetails",
          id: videoId
        })
        writeFileSync(cacheFile, JSON.stringify(response))
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

    const youtubeSearchVideos = JSON.parse(readFileSync("channelVideos.json"))

    youtubeSearchVideos.data.items.forEach(video => {
      youtubeVideos.addNode({
        ...video,
        id: video.id.videoId,
        channel: store.createReference('YouTubeChannel', video.snippet.channelId)
      })
    })

  })

  // api.createPages(({ createPage }) => {
  //   // Use the Pages API here: https://gridsome.org/docs/pages-api/
  // })
}