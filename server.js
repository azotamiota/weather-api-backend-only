const express = require('express')
const app = express()
let weather = require('./data')
const cors = require('cors')
const weatherJSON = require('./weather.json')
const {readFile, writeFile, appendFile} = require('fs')

// static assets
// app.use(express.static('./client'))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))  // uncomment when connected with frontend form

app.get('/', (req, res) => {
    readFile('./weather.json', 'utf-8', (err, jsonString) => {
        if(err){
            res.status(500).json({error: 'Internal server error, try again later'})
        }
        try {
            const data = JSON.parse(jsonString)
            res.status(200).send(data)
        } catch (error) {
            res.status(500).send('Error: ', error)
        }
    })
})

app.get('/cities/:city', (req, res) => {
    const city = req.params.city.toUpperCase()

    readFile('./weather.json', 'utf-8', (err, jsonString) => {
        if(err){
            res.status(500).json({error: 'Internal server error, try again later'})
        }
        try {
            const data = JSON.parse(jsonString)
            for (let i = 1; i < Object.entries(data).length; i++) {
                if (data[i]['city'] === city) {
                    res.status(200).send(data[i])
                }
            }

        } catch (error) {
            res.status(500).send('Error: ', error)
        }
    })
})

app.post('/', (req, res) => {
    
    readFile('./weather.json', 'utf-8', (err, jsonString) => {

        if(err) {res.status(500).json({error: 'Internal server error, try again later'})}

        try {
            const data = JSON.parse(jsonString)
            const jsonLength = Object.keys(data).length
            writeFile('./weather.json', JSON.stringify({...data, [jsonLength + 1] : {"city": req.body.city.toUpperCase(), 
                "Celsius": req.body.celsius, "Fahrenheit": req.body.fahrenheit,
                "wind": Boolean(req.body.wind), "rain" : Boolean(req.body.rain)}}, null, 2), (err, result) => {
                    if(err) console.log('Error while updating JSON: ', err);
                    console.log('result: ', result)
                    res.status(201).redirect('http://127.0.0.1:5501/index.html')
            })
        } catch (error) {
            console.log('Error while trying to write data: ', error)
            res.status(500).send('Error while trying to write data: ')
        }

        
    })
})

app.patch('/cities/:city', (req, res) => {
    const city = req.params.city.toUpperCase()
    const currentCity = weather.filter(c => {
        return Object.keys(c).includes(city)
    })
    weather = weather.filter(c => {
        return !Object.keys(c).includes(city)
    })
    if(currentCity.length < 1) {
        res.status(404).send(`<h1>404 Not found <br> ${req.params.city} is not in the database</h1>`)
    } else {
        currentCity[0][city][Object.keys(req.body)[0]] = Object.values(req.body)[0]
        weather.push(currentCity[0])
        res.status(202).send(currentCity[0])
    }
})

app.delete('/cities/:city', (req, res) => {
    const city = req.params.city.toUpperCase()
    const citiesInDB = weather.map(c => Object.keys(c)).map(entry => entry[1])

    if(citiesInDB.includes(city)) {
        weather = weather.filter(c => {
            return !Object.keys(c).includes(city)
        })
        res.status(201).send(`${req.params.city} has been deleted`)
    } else {
        res.status(404).send(String(`${req.params.city} is not in database`))
    }
})


module.exports = app
