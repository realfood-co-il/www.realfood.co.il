"use strict"

const fs = require('fs')
const { google } = require('googleapis')

const google_key = JSON.parse(fs.readFileSync('secrets.json'))['google_key']
const client = google.youtube({ version: 'v3', auth: google_key })

async function cacheResponse(cacheFile, fetchFunc) {
  try {
    const cache = JSON.parse(await fs.promises.readFile(`youtube/${cacheFile}.json`))
    console.log(`Using cache file youtube/${cacheFile}.json`)
    return cache.data.items[0]
  } catch (e) {
    console.log(`Cache file youtube/${cacheFile}.json is not readable.`)
  }
  const response = await fetchFunc()
  await fs.promises.writeFile(cacheFile, JSON.stringify(response, null, 2))
  return response.data.items[0]
}

async function channelDetails(channel) {
  return cacheResponse(`channels/${channel.id}`, async () => {
    return client.channels.list({
      part: 'snippet,contentDetails',
      id: channel.id
    })
  })
}

async function userDetails(user) {
  return cacheResponse(`users/${user.id}`, async () => {
    return client.users.list({
      part: 'snippet,contentDetails',
      forUsername: user.id
    })
  })
}

async function playlistItem(item) {
  return cacheResponse(`playlists/${item.id}`, async () => {
    return client.playlistItems.list({
      part: 'snippet,contentDetails,status',
      playlistId: item.id,
      maxResults: 50
    })
  })
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
}

async function channels(list) {
  return Promise.all( list.map(channelDetails) )
}

async function users(list) {
  return Promise.all(list.map(userDetails))
}

async function playlistItems(list) {
  return Promise.all(list.map(playlistItem))
}

module.exports = {
  channels,
  users,
  playlistItems
}