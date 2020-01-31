"use strict"

const fs = require('fs')
const { google } = require('googleapis')

const google_key = JSON.parse(fs.readFileSync('secrets.json'))['google_key']
const client = google.youtube({ version: 'v3', auth: google_key })

async function cacheResponse(cacheFile, fetchFunc) {
  const cacheFileFullname = `youtube/${cacheFile}.json`
  try {
    const cache = JSON.parse(await fs.promises.readFile(cacheFileFullname))
    console.log(`Using cache file ${cacheFileFullname}`)
    return cache
  } catch (e) {
    console.log(`Cache file ${cacheFileFullname} is not readable.`)
  }
  const response = await fetchFunc()
  try {
    await fs.promises.writeFile(cacheFileFullname, JSON.stringify(response, null, 2))
  } catch (e) {
    console.log(`Failed to write response to cache file ${cacheFileFullname}`)
    throw e
  }
  return response
}

async function channelDetails(channel) {
  const res = await cacheResponse(`channels/${channel.id}`, async () => {
    return client.channels.list({
      part: 'snippet', // 'snippet,contentDetails',
      id: channel.id
    })
  })
  return res.data.items[0]
}

async function userDetails(user) {
  const res =  await cacheResponse(`users/${user.id}`, async () => {
    return client.users.list({
      part: 'snippet', // 'snippet,contentDetails',
      forUsername: user.id
    })
  })
  return res.data.items[0]
}

async function videoDetails(video) {
  const res = await cacheResponse(`videos/${video.id}`, async () => {
    return client.videos.list({
      part: 'snippet', // 'snippet,contentDetails',
      id: video.id
    })
  })
  return res.data.items[0]
}

async function captionDetails(video) {
  const res = await cacheResponse(`captionlist/${video.id}`, async () => {
    return client.captions.list({
      part: 'snippet',
      videoId: video.id
    })
  })
  return res.data.items[0]
}

async function captionDownload(caption) {
  const resEN = await cacheResponse(`captiondownload/en-${caption.id}`, async () => {
    return client.captions.download({
      id: caption.id,
      tlang: 'en'
    })
  })
  const resHE = await cacheResponse(`captiondownload/he-${caption.id}`, async () => {
    return client.captions.download({
      id: caption.id,
      tlang: 'he'
    })
  })
  return [ resEN.data.items[0], resHE.data.items[0] ]
}

async function playlistItem(item) {
  const res = await cacheResponse(`playlists/${item.id}`, async () => {
    return client.playlistItems.list({
      part: 'snippet', // 'snippet,contentDetails,status',
      playlistId: item.id,
      maxResults: 50
    })
  })
  return res.data.items

  //     let pageToken
  //     do {
  //       response = await youtube.playlistItems.list({
  //         part: "snippet,contentDetails",
  //         playlistId,
  //         maxResults: 50,
  //         pageToken
  //       })
  //       pageToken = undefined
  //       writeFileSync(cacheFile, JSON.stringify(response))
  //       if (Object.keys(response.data).includes('nextPageToken')) {
  //         pageToken = response.data.nextPageToken
  //         cacheFile = `youtube/playlists/${playlistId}-${pageToken}.json`
  //       }
  //     } while (pageToken !== undefined)

  // playlistItem =
  // "data": {
  //     "kind": "youtube#playlistItemListResponse",
  //     "etag": "\"p4VTdlkQv3HQeTEaXgvLePAydmU/zoshwB-AP0hnZ0rueso02SujL-M\"",
  //     "nextPageToken": "CAUQAA",
  //     "pageInfo": {
  //         "totalResults": 219,
  //         "resultsPerPage": 5
  //     },
  //     "items": [
}

async function channels(list) {
  return Promise.all( list.map(channelDetails) )
}

async function users(list) {
  return Promise.all(list.map(userDetails))
}

async function videos(list) {
  return Promise.all(list.map(videoDetails))
}

async function videoCaptions(list) {
  return Promise.all(list.map(captionDetails))
}

async function captions(list) {
  return Promise.all(list.map(captionDownload))
}

async function playlistItems(list) {
  return Promise.all(list.map(playlistItem))
}

module.exports = {
  channels,
  users,
  playlistItems,
  videos,
  videoCaptions,
  captions,
}
