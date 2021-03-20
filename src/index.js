const express = require('express')
const search = require('./crawler')

const server = express()

server.get('/', async (request, response) => {
  const { query } = request

  if (!query.link) {
    response.status(404).send('enter mangayabu link!!')
    return
  }

  const data = await search(query.link)
  response.send(data)
})

server.listen('3333', () => console.log('server listening on port 3333'))
