"use strict"

import { readFileSync, promises } from 'fs'
import googleapis from 'googleapis'

const google_key = JSON.parse(readFileSync('secrets.json'))['google_key']
const client = googleapis.google.youtube({ version: 'v3', auth: google_key })

async function cacheResponse(cacheFile, fetchFunc) {
  try {
    const cache = JSON.parse(await promises.readFile(`youtube/${cacheFile}.json`))
    console.log(`Using cache file youtube/${cacheFile}.json`)
    return cache.data.items[0]
  } catch (e) {
    console.log(`Cache file youtube/${cacheFile}.json is not readable.`)
  }
  const response = await fetchFunc()
  await promises.writeFile(cacheFile, JSON.stringify(response, null, 2))
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

export async function channels(list) {
  return Promise.all( list.map(channelDetails) )
}

export async function users(list) {
  return Promise.all(list.map(userDetails))
}
