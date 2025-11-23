require('dotenv').config()
const express = require('express')
const Person = require('./models/person')
// const cors =require('cors')
// var morgan = require('morgan')
const app = express()

// morgan.token('data', (req) => {
//   return req.method === 'POST' ? JSON.stringify(req.body) : ''
// })

app.use(express.json())
// app.use(morgan('tiny'))
// app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))
// app.use(cors())
app.use(express.static('dist'))

// http://localhost:3001/
// 打印hello world
app.get('/', (request, response) => {
  response.send('<p>http://localhost:3001/api/persons</p>')
})

app.get('/info', (request, response) => {
  const date = new Date()
  Person.countDocuments({}).then(count => {
    const content = `<p>Phonebook has info for ${count} people</p><p>${date}</p>`
    response.send(content)
  })
})

// http://localhost:3001/api/persons
// 获取所有联系人
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

// http://localhost:3001/api/persons/1
// 获取单条联系人
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        return response.json(person)
      } else {
        return response.status(404).end()
      }
    })
    .catch(error => next(error))
})

// http://localhost:3001/api/persons/2
// 删除单条联系人
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// http://localhost:3001/api/persons
// 创建新联系人
app.post('/api/persons', (request, response, next) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number missing'
    })
  }
  Person.find({ name: body.name })
    .then(persons => {
      if (persons.length > 0) {
        Person.findById(persons[0]._id)
          .then(person => {
            if (!person) {
              return response.status(404).end()
            }
            person.number = body.number
            return person.save().then(updatedPerson => {
              response.json(updatedPerson)
            })
          })
          .catch(error => next(error))
      } else {
          const person = new Person({
          name: body.name,
          number: body.number,
        })
        person.save().then(savedPerson => {
          response.json(savedPerson)
        })
        .catch(error => next(error))
      }
    })
    .catch(error => next(error))
})

const handleError = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}
app.use(handleError)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})