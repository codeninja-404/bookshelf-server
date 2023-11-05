const express = require('express')
const app = express()
const port = 5000

app.get('/', (req, res) => {
  res.send('Bookshelf server is Running')
})

app.listen(port, () => {
  console.log(`Bookshelf server listening on port ${port}`)
})