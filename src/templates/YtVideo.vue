<template>
  <Layout>
    <h1 v-html="$page.video.snippet.title"></h1>
    <p>{{ $page.video.snippet.description }}</p>
    <p>{{ $page.video.snippet.publishedAt }}</p>
    <img :src="$page.video.snippet.thumbnails.high.url" :height="$page.video.snippet.thumbnails.high.height" :width="$page.video.snippet.thumbnails.high.width" />
  </Layout>
</template>

<page-query>
  query($id: ID!) {
    video: ytVideo(id: $id) {
      snippet {
        title
        description
        channelId
        channelTitle
        thumbnails {
          high {
            url
            width
            height
          }
        }
        publishedAt
      }
    }
  }
</page-query>

<script>
export default {
  metaInfo: {
    title: 'Video'
  }
}
</script>
