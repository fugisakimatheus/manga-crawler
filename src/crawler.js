const axios = require('axios')
const cheerio = require('cheerio')

const fetchPage = async link => {
  const { data } = await axios.get(link)
  return data
}

const waitAll = (items, fn) => {
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

const splitToChunks = (items, splitter = 40) => {
  const result = []
  for (let i = 0; i < items.length; i += splitter) {
    result.push(items.slice(i, i + splitter))
  }
  return result
}

const buildCharpter = async ({ number, link }) => {
  const chapterPage = await fetchPage(link)
  const c = cheerio.load(chapterPage)
  const pages = []
  c('div.manga-pages > center > img').each((_, pag) => {
    pages.push(c(pag).attr('src'))
  })

  return {
    number,
    pages,
  }
}

const getCharpter = (items, fn) => {
  let result = []
  const chunks = splitToChunks(items)
  return serialize(chunks, chunk =>
    waitAll(chunk, fn).then(res => result = result.concat(res))
  )
    .then(() => result)
}

const search = async link => {
  const page = await fetchPage(link)
  const m = cheerio.load(page)

  const title = m('div.manga-title h1').text()
  const cover_url = m('div.manga-cover img').attr('src')
  const synopsis = m('div.manga-synopsis').text()

  const items = []
  m('div.manga-chapters > div.single-chapter').each((_, char) => {
    const chapter = m(char).find('a')
    const number = chapter.text().split('#')[1]
    const link = chapter.attr('href')
    items.push({ number, link })
  })

  const charpters = await getCharpter(items, buildCharpter)

  return {
    title,
    cover_url,
    synopsis,
    charpters,
  }
}

module.exports = search
