import { Router } from 'express'
import { Character } from '../models/character.js'
import { conn } from './../db.js'

const router = Router()

router.get('/:id', async (req, res) => {
  // #swagger.description = 'Найти персонажа по ID'\
  const id = req.params.id 

  var character;

  await conn.query(`SELECT * from dacsson_characters WHERE id = ${id}`) 
  .catch(
    err => {
      res.status(500)
      return res.json({message: `Error connecting to table characters`})
    }
  )
  .then(
    q => {
      if(q.rowCount == 0) {
        res.status(404)
        return res.json({message: `No character with id ${id}`})
      }
      else {
        character = new Character(q.rows[0])
      }
    }
  )

  // find chars location
  await conn.query(`SELECT name, url FROM dacsson_locations WHERE id = ${character.location}`)
  .catch(
    err => {
      res.status(500)
      return res.json({message: `Error finding ${id}s location`})
    }
  )
  .then(
    q => {
      var name = q.rows[0].name
      var url = q.rows[0].url
      character.location = { name: name, url: url}
    }
  )

  // find chars orgign
  await conn.query(`SELECT name, url FROM dacsson_origins WHERE id = ${character.origin}`)
  .catch(
    err => {
      res.status(500)
      return res.json({message: `Error finding ${id}s origin`})
    }
  )
  .then(
    q => {
      var name = q.rows[0].name
      var url = q.rows[0].url
      character.origin = { name: name, url: url}
    }
  )

  res.status(200)
  return res.json(character)
})

router.get('/', async (req, res) => {
  // #swagger.description = 'Показать всех персонажей'\
  conn.query('SELECT * from dacsson_characters', (err, q) => {
    if(err) {
      return res.json({message: 'Error loading characters table'})
    }

    return res.json(q.rows)
  })

})

router.post('/load', async (req, res, next) => {
  // #swagger.description = 'Загрузить персонажей в базу данных'

  fetch('https://rickandmortyapi.com/api/character')
  .then(
    res => res.json()
  )
  .then(
    data => { 
      var characters = []
      data.results.forEach(async element => {
        var locations = (await conn.query("SELECT name, url from dacsson_locations")).rows
        var origins = (await conn.query("SELECT name, url from dacsson_origins")).rows
        
        element.location.name = element.location.name.replace(/'/g, ' ')
        element.origin.name = element.origin.name.replace(/'/g, ' ')

        // check if location already exists
        if(!locations.includes(element.location)) {
          // add new location
          const text = 'INSERT INTO dacsson_locations(name, url) VALUES($1, $2) RETURNING *'
          const values = [element.location.name, element.location.url]
          conn.query(text, values, (err, q) => {
            if(err) {
              console.log(err)
            }
            // else console.log(q.rows)
          })
        }

        // check if origin already exists
        if(!origins.includes(element.origin)) {
          // add new location
          const text = 'INSERT INTO dacsson_origins(name, url) VALUES($1, $2) RETURNING *'
          const values = [element.origin.name, element.origin.url]
          conn.query(text, values, (err, q) => {
            if(err) {
              console.log(err)
            }
          })
        }
        
        var location = "'" + element.location.name + "'";
        var origin = "'" + element.origin.name + "'";

        await conn.query(`SELECT id FROM dacsson_locations WHERE name = ${location}`)
        .then(
          res => { 
            element.location = res.rows[0].id
          }
        )
        .catch(
          err => {
            console.log(" loc err: ", err, `SELECT id FROM dacsson_locations WHERE name = ${location}`)
          }
        )

        await conn.query(`SELECT id FROM dacsson_origins WHERE name = ${origin}`)
        .then(
          res => {
            // console.log(res.rows[0].id)
            element.origin = res.rows[0].id
          }
        )
        .catch(
          err => {
            console.log(" og err: ", err, `SELECT id FROM dacsson_origins WHERE name = ${origin}`)
          }
        )
        
        // add new character
        const text = 'INSERT INTO dacsson_characters(name, status, species, type, gender, origin, location, image, episode, url, created) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *'
        var values = Object.values(element)
        values.shift()
        // console.log("\n VALUES \n", values)

        conn.query(text, values, (err, q) => {
          if(err) {
            res.status(500)
            return res.json('Error creating character')
          }
          else {
            characters.push(element)
          }
        })
      });

      return res.json()
    }
  )
})

export default router