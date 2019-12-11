const http = require('http')

const data = JSON.stringify({
  "ConversationID": "1234",
  "RegistrationID": "4321"
})

const options = {
  hostname: process.env.EHR_HOST,
  port: 80,
  path: '/url',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', (d) => {
    process.stdout.write(d)
  })
})

req.on('error', (error) => {
  console.error(error)
  process.exit(5);
})

req.write(data)
req.end()
