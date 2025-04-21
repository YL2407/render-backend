require('dotenv').config()
const express = require('express')
const Note = require('./models/note')

const app = express()

app.use(express.json())
app.use(express.static('dist'))

let notes = [
    {
      id: "1",
      content: "HTML is easy",
      important: true
    },
    {
      id: "2",
      content: "Browser can execute only JavaScript",
      important: false
    },
    {
      id: "3",
      content: "GET and POST are the most important methods of HTTP protocol",
      important: true
    }
  ]

  const requestLogger = (req, res, next) => {
    console.log('Method:', req.method)
    console.log('Path: ', req.path)
    console.log('Body: ', req.body)
    console.log('---')
    next();
  }
  
  app.use(requestLogger);
  

  app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
  })
  
  app.get('/api/notes', (request, response) => {
    Note.find({}).then(notes=>{
      response.json(notes);
    })
  })

  app.get('/api/notes/:id', (request, response, next) => {
    Note.findById(request.params.id).then(note=>{
      if(note){
        response.json(note)
      }else{
        response.status(404).end()
      }
    }).catch(error=>next(error))
  })

  app.delete('/api/notes/:id', (request, response) => {
    const id = request.params.id;
    notes = notes.filter(n=>n.id!==id);
    response.status(204).end()
  })


  const generateId = () => {
    const maxId = notes.length > 0
    ? Math.max(...notes.map(n => Number(n.id)))
    : 0
    return String(maxId + 1)
  }

  app.post('/api/notes', (request, response) => {

    const body = request.body;

    const note = new Note({
        content: body.content,
        important: body.important || false,
    })

    note.save().then(savedNote=>{
      response.json(savedNote)
    }).catch(error=>next(error))
  })

  app.delete('/api/notes/:id', (request, response, next) => {
    Note.findByIdAndDelete(request.params.id).then(result=>{
      response.status(204).end()
    }).catch(error=>next(error))
  })

  app.put('/api/notes/:id', (request, response, next) => {
    const {content, important} = request.body
    Note.findById(request.params.id).then(note=>{
      if(!note){
        return response.status(404).end()
      }
      note.content = content;
      note.important=important;

      return note.save().then((updatedNote)=>{
        response.json(updatedNote)
      })
    }).catch(error=>next(error))
  })

  const unknownEndpoint = (req, res) => {
    res.status(404).send({error: 'unknown endpoint'})
  }
  
  app.use(unknownEndpoint);

  const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if(error.name==='CastError'){
      return res.status(400).send({error: 'malformatted id'})
    }else if(error.name==='ValidationError'){
      return response.status(400).json({error: error.message})
    }

    next(errorHandler)
  }
  
  
  const PORT = process.env.PORT
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
