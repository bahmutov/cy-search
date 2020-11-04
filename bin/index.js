#!/usr/bin/env node

// @ts-check

const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
})

const updateNotifier = require('update-notifier')
const pkg = require(path.join('..', 'package.json'))
updateNotifier({ pkg }).notify()

const open = require('open')
const chalk = require('chalk')
const prompts = require('prompts')
const { initSearch } = require('../src/search')

const search = initSearch()

// returns either content or level highlight
const getHighlightText = (hit) => {
  if (!hit._highlightResult) {
    return
  }
  if (hit._highlightResult.content) {
    return hit._highlightResult.content.value
  }
  if (!hit._highlightResult.hierarchy) {
    return
  }
  // lower level, more precise match wins
  const h = hit._highlightResult.hierarchy
  return (
    (h.lvl4 && h.lvl4.value) ||
    (h.lvl3 && h.lvl3.value) ||
    (h.lvl2 && h.lvl2.value) ||
    (h.lvl1 && h.lvl1.value) ||
    (h.lvl0 && h.lvl0.value)
  )
}

const getHighlight = (hit) => {
  const value = getHighlightText(hit)
  if (!value) {
    return
  }

  if (value.length > 40) {
    // too long of the snippet
    return
  }

  // takes a string like
  // Go to  >>>ab<<<out page
  // and outputs "Go to  " + chalk.yellow(ab) + "out page"
  // note: we send these custom pre and post tags when doing the search
  return value.replace(/>>>(.+)<<</g, (match, text) => {
    // we might have several highlights, and the group above
    // grabs the outer one. So let's make sure the inside does not
    // have >>> or <<< tags
    text = text.replace(/>>>/g, '').replace(/<<</g, '')
    return chalk.yellow(text)
  })
}

const getTitle = (hash) => {
  const result = decodeURI(hash).replace(/-/g, ' ').replace(/#/, '')
  return result
}

const options = {
  type: 'autocomplete',
  name: 'value',
  message: '🔍 Search Cypress Docs',
  choices: [],
  suggest(input, choices) {
    choices.length = 0
    if (!input.length) {
      return Promise.resolve([])
    }

    return search(input).then((results) => {
      if (!results.nbHits) {
        return []
      }

      return results.hits.map((hit) => {
        choices.push({
          title: hit.url,
        })
        const highlight = getHighlight(hit)
        const url = new URL(hit.url)
        const title = highlight ? highlight : getTitle(url.hash)
        return {
          title,
          value: encodeURI(hit.url),
          description: url.pathname,
        }
      })
    })
  },
}
const ask = async () => {
  const response = await prompts(options)

  if (!response) {
    return
  }
  if (!response.value) {
    return
  }
  console.log('opening %s', response.value)
  return open(response.value)
}
ask()
