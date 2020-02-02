"use strict"

const fs = require('fs')
const path = require('path')

// https://googleapis.dev/nodejs/googleapis/latest/
// https://googleapis.dev/nodejs/googleapis/latest/youtube/
const { google } = require('googleapis')

const auth = new google.auth.GoogleAuth({ scopes: [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
] });

const client = google.youtube({ version: 'v3', auth })

const cacheOnly = process.env.CACHE_ONLY === 'true'

// TODO: Add `etag` verification download, especially useful for playlists that change.
// See example at https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/youtube/playlist.js

async function cacheResponse(cacheFile, fetchFunc) {
  const cacheFileFullname = `youtube/${cacheFile}.json`
  const cacheDir = path.dirname(cacheFileFullname)
  try {
    await fs.promises.stat(cacheDir)
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`Cache dir ${cacheDir} does not exist`)
      await fs.promises.mkdir(cacheDir, { recursive: true })
      console.log(`Successfully created ${cacheDir}`)
    } else {
      throw (e)
    }
  }
  try {
    const cache = JSON.parse(await fs.promises.readFile(cacheFileFullname))
    // console.log(`Using cache file ${cacheFileFullname}`)
    return cache
  } catch (e) {
    // console.log(`Cache file ${cacheFileFullname} is not available`)
  }
  // if (!cacheFile.startsWith('captiondownload/')) {
  //   return { data: { items: [] } }
  // }
  if (cacheOnly) {
    return { data: { items: [] } }
  }
  try {
    const response = await fetchFunc()
    fs.promises.writeFile(cacheFileFullname, JSON.stringify(response, null, 2))
      .then(() => console.log(`Wrote cache file ${cacheFileFullname}`))
      .catch(() => console.log(`Failed to write cache file ${cacheFileFullname}`))
    return response
  } catch (e) {
    console.log('Google returned an error: ', e.code, e.message)
    return { data: { items: [] } }
  }
}

async function channelDetails(channel) {
  const res = await cacheResponse(`channels/${channel.id}`, async () => {
    return client.channels.list({
      part: 'snippet,contentDetails', // must have contentDetails, it includes the playlist
      id: channel.id
    })
  })
  return res.data.items[0]
}

async function userDetails(user) {
  const res =  await cacheResponse(`users/${user.id}`, async () => {
    return client.channels.list({
      part: 'snippet,contentDetails', // contentDetails includes the playlist
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
  return [ resEN.data || '', resHE.data || '' ]
}

async function playlistItem(item) {
  let pageToken, items = []
  do {
    const pageSuffix = pageToken ? `-${pageToken}` : ''
    const res = await cacheResponse(`playlists/${item.id}${pageSuffix}`, async () => {
      return client.playlistItems.list({
        part: 'snippet', // 'snippet,contentDetails,status',
        playlistId: item.id,
        maxResults: 50,
        pageToken
      })
    })
    pageToken = Object.keys(res.data).includes('nextPageToken') ? res.data.nextPageToken : undefined
    items = items.concat(res.data.items)
  } while (pageToken !== undefined)
  return items
}

async function channels(list) {
  const res = []
  for (let item of list) {
    res.push(await channelDetails(item))
  }
  return res
  // all at once!
  // return Promise.all( list.map(channelDetails) )
}

async function users(list) {
  const res = []
  for (let item of list) {
    res.push(await userDetails(item))
  }
  return res
  // all at once!
  // return Promise.all(list.map(userDetails))
}

async function videos(list) {
  const res = []
  for (let item of list) {
    res.push(await videoDetails(item))
  }
  return res
  // all at once!
  // return Promise.all(list.map(videoDetails))
}

async function videoCaptions(list) {
  const res = []
  for (let item of list) {
    res.push(await captionDetails(item))
  }
  return res
  // all at once!
  // return Promise.all(list.map(captionDetails))
}

async function captions(list) {
  const res = []
  for (let item of list) {
    res.push(await captionDownload(item))
  }
  return res
  // all at once!
  // return Promise.all(list.map(captionDownload))
}

async function playlistItems(list) {
  const res = []
  for (let item of list) {
    res.push(await playlistItem(item))
  }
  return res
  // all at once!
  // return Promise.all(list.map(playlistItem))
}

module.exports = {
  channels,
  users,
  playlistItems,
  videos,
  videoCaptions,
  captions,
}
