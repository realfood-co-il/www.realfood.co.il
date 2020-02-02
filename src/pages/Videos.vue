<template>
  <Layout>
    Videos ({{ $page.videos.totalCount }}):
    <ul v-for="video in $page.videos.edges" :key="video.node.id">
      <li>
        <img :src="video.node.snippet.thumbnails.medium.url" width="160" /><br />
        <g-link :to="video.node.path"><i v-html="video.node.snippet.title"></i></g-link>
      </li>
    </ul>
    <Pager :info="$page.videos.pageInfo"/>
  </Layout>
</template>

<page-query>
  query Videos($page: Int) {
    videos: allYtVideo(perPage: 10, page: $page) @paginate {
      totalCount
      pageInfo {
        totalPages
        currentPage
        isFirst
        isLast
      }
      edges {
        node {
          id
          # path
          snippet {
            title
            thumbnails {
              medium {
                url
                width
                height
              }
            }
            publishedAt
          }
        }
      }
    }
  }
</page-query>

<script>
import { Pager } from "gridsome";

export default {
  metaInfo: {
    title: 'Videos'
  },
  components: { Pager }
}
</script>
