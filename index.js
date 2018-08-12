const r = function() { return require(arguments[0][0]) }
const [os, fs, path] = [r`os`, r`fs`, r`path`]
const pathFor = (...args) => path.join(...args)
const JS   = jsObject => JSON.stringify(jsObject)
const JP   = jsonString => JSON.parse(jsonString)
const puts = (...args) => console.log(...args)

const mtokm = miles => miles / 0.62137
const kmtom = kilom => kilom * 1.60934

const home = os.homedir()

let natdas = { zipcode: '72212', miles: 10 }

const saveConfig = natdasData => {
  fs.writeFile(pathFor(home, '.natdas.json'), JS(natdasData), err => {
    if (err) { puts('cannot write to home directory') }
  })
}

fs.readFile(pathFor(home, '.natdas.json'), 'utf8', (err, data) => {
  if (err) {
    puts('could not read .natdas.json')
    saveConfig(natdas)
  } else { natdas = JP(data) }
})

const https = r`https`

const express = r`express`
const app = express()

const bodyParser = r`body-parser`

// argv 0 is node and argv 1 is our program name
const port = process.argv[2] || 3000

const notifier = r`node-notifier`

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('pages/index', { config: natdas })
})

app.post('/', bodyParser.urlencoded({ extended: false }), (req, res) => {
  natdas.zipcode = req.body.zipcode
  natdas.miles = parseInt(req.body.miles, 10)
  saveConfig(natdas)
  res.render('pages/index', { config: natdas })
})

setInterval(_ => {
  https.get(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02&latitude=45.518333&longitude=-122.677261&maxradiuskm=${mtokm(natdas.miles)}`, resp => {
    let data = ''

    resp.on('data', chunk => { data += chunk })
    resp.on('end', _ => {
      const firstFinding = JSON.parse(data).features[0].properties

      notifier.notify({
        title: firstFinding.place,
        message: 'Yellow alert!'
      })

    })

  }).on('error', err => puts('Error: ' + err.message))
}, 30000)

app.listen(port, function() { puts(`server running on port ${port}`) })
