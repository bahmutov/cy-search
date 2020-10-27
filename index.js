const open = require('open')
const chalk = require('chalk')
const prompts = require('prompts')
const {initSearch} = require('./search')

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
  return (h.lvl4 && h.lvl4.value) ||
    (h.lvl3 && h.lvl3.value) ||
    (h.lvl2 && h.lvl2.value) ||
    (h.lvl1 && h.lvl1.value) ||
    (h.lvl0 && h.lvl0.value)
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
  return value.replace(/>>>(.+)<<</g,
    (match, text) => {
      // we might have several highlights, and the group above
      // grabs the outer one. So let's make sure the inside does not
      // have >>> or <<< tags
      text = text.replace(/>>>/g, '').replace(/<<</g, '')
      return chalk.yellow(text)
    })
}

const options = {
  type: 'autocomplete',
  name: 'value',
  message: 'cy 🔎',
  choices: [],
  suggest (input, choices) {
    choices.length = 0
    if (!input.length) {
      return Promise.resolve([])
    }

    return search(input).then((results) => {
      if (!results.nbHits) {
        return []
      }

      return results.hits.map(hit => {
        choices.push({
          title: hit.url
        })
        const highlight = getHighlight(hit)
        const title = highlight ? hit.url + ' ' + highlight : hit.url
        return {
          title,
          value: hit.url
        }
      })
    })
  }
}
const ask = async () => {
  const response = await prompts(options);

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
