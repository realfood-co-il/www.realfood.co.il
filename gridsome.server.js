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

    const ytChannels = addCollection('YtChannel')
    const channelsDetail = await youtube.channels(videos.channels)
    channelsDetail.forEach( channel => ytChannels.addNode(channel) )

    const ytUsers = addCollection('YtUser')
    const usersDetail = await youtube.users(videos.users)
    usersDetail.forEach( user => ytUsers.addNode(user) )

    const ytVideos = addCollection('YtVideo')

    async function addVideosFromPlaylist(playlistItems) {
      if (typeof playlistItems === 'undefined') {
        console.log(`Playlist was undefined!`)
        return
      }
      const playlistVideos = playlistItems.map(playlistItem => (
        { id: playlistItem.snippet.resourceId.videoId }
      ))
      const videosDetail = await youtube.videos(playlistVideos)
      videosDetail.forEach(video => ytVideos.addNode(video))
    }

    const channelUploadPlaylists = ytChannels.data().map(channel => ({ id: channel.contentDetails.relatedPlaylists.uploads }))
    const channelPlaylistItems = await youtube.playlistItems(channelUploadPlaylists)
    await Promise.all(channelPlaylistItems.map(addVideosFromPlaylist))

    const userUploadPlaylists = ytUsers.data().map(user => ({ id: user.contentDetails.relatedPlaylists.uploads }))
    const userPlaylistItems = await youtube.playlistItems(userUploadPlaylists)
    await Promise.all(userPlaylistItems.map(addVideosFromPlaylist))

    const videoIDs = ytVideos.data().map(video => ({ id: video.id }))
    const videoCaptions = await youtube.videoCaptions(videoIDs)

    // const ytCaptions = addCollection('YtCaption')
    // const captionIDs = videoCaptions.map( (caption) => {
    //   if (caption && caption.id) {
    //     return { id: caption.id }
    //   }
    //   console.log(`Caption id was not found in caption`, caption)
    // }).filter(x => x)
    // // TODO: Add caption downloads to collections
    // const captionDownloads = await youtube.captions(captionIDs)
  })

  // api.createPages(({ createPage }) => {
  //   // Use the Pages API here: https://gridsome.org/docs/pages-api/
  // })
}

module.exports = youtubeSource
