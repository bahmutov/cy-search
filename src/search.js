// @ts-check

const algolia = require('algoliasearch')

const doSearch = async ({ appId, apiKey, indexName }, query) => {
  const searchParams = {
    // use custom highlight tags we can easily find later on
    highlightPreTag: '>>>',
    highlightPostTag: '<<<',
    hitsPerPage: 12,
  }

  const client = algolia(appId, apiKey)
  const index = client.initIndex(indexName)
  const results = await index.search(query, searchParams)
  // console.log('%o', results)
  return results
}

const initSearch = () => {
  const appId = process.env.APPLICATION_ID
  const apiKey = process.env.API_KEY
  const indexName = process.env.INDEX_NAME

  const clientOptions = {
    appId,
    apiKey,
    indexName,
  }

  return function searchByQuery(query) {
    return doSearch(clientOptions, query)
  }
}

module.exports = {
  initSearch,
}
