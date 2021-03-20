const axios = require('axios')
const cheerio = require('cheerio')

const fetchPage = async link => {
  const { data } = await axios.get(link)
  return data
}

const all = (items, fn) => {
  const promises = items.map(item => fn(item))
  return Promise.all(promises)
}

const serialize = (items, fn) => {
  const result = []
  return items
    .reduce((acc, item) => {
      acc = acc.then(() =>
        fn(item).then(res => result.push(res))
      )
      return acc
    }, Promise.resolve())
    .then(() => result)
}

const splitToChunks = items => {
  const result = []
  for (let i = 0; i < items.length; i += 50) {
    result.push(items.slice(i, i + 50))
  }
  return result
}

const buildCharpter = (items, fn) => {
  let result = []
  const chunks = splitToChunks(items, 50)
  return serialize(chunks, chunk =>
    all(chunk, fn).then(res => result = result.concat(res))
  )
    .then(() => result)
}

const getCharpter = async ({ number, link }) => {
  const chapterPage = await fetchPage(link)
  const c = cheerio.load(chapterPage)
  const pages = []
  c('div.manga-pages > center > img').each((i, pag) => {
    pages.push(c(pag).attr('src'))
  })

  return {
    number,
    pages,
  }
}

const search = async link => {
  const page = await fetchPage(link)
  const m = cheerio.load(page)

  const title = m('div.manga-title h1').text()
  const cover_url = m('div.manga-cover img').attr('src')
  const synopsis = m('div.manga-synopsis').text()

  const items = []
  m('div.manga-chapters > div.single-chapter').each((i, char) => {
    const chapter = m(char).find('a')
    const number = chapter.text().split('#')[1]
    const link = chapter.attr('href')
    items.push({ number, link })
  })

  const charpters = await buildCharpter(items, getCharpter)

  return {
    title,
    cover_url,
    synopsis,
    charpters,
  }
}

module.exports = search
