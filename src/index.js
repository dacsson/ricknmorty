import express from 'express'
import fs from 'fs'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { conn } from './db.js'

import router_db from './routes/db.routes.js'
import router from './routes/char.routes.js'

const app = express()
const port = 3000

const _dirname = dirname(fileURLToPath(import.meta.url))
const swaggerFile = JSON.parse(fs.readFileSync(join(_dirname, '../swagger/output.json')))

app.use(express.json())

app.use(
  '/api-doc', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerFile)
)

app.use('/characters', router)
app.use('/db', router_db)

async function on_creation()
{
  var text = 
  `
  CREATE TABLE dacsson_origins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    url VARCHAR(100)
  );

  CREATE TABLE dacsson_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    url VARCHAR(100)
  );

  CREATE TABLE dacsson_characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    status VARCHAR(100),
    species VARCHAR(100),
    type VARCHAR(100),
    gender VARCHAR(100),
    origin int references dacsson_origins(id),
    location int references dacsson_locations(id),
    image VARCHAR(100),
    episode text[],
    url VARCHAR(100),
    created Date
  );
  `;
  await conn.query(text)
  .catch(
    err => console.log(err)
  )
  .then(
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
        console.log("\n VALUES \n", values)

        conn.query(text, values, (err, q) => {
          if(err) {
            console.log('Error creating character')
          }
          else {
            characters.push(element)
          }
        })
      });
    }
  )
  )
}

app.listen(port, () => {
  conn.connect(async (err) => {
    if (err) throw err;
    else {
      await conn.query('SELECT * from dacsson_characters') 
      // if tables dont exist create  and populate them
      .catch(
        async err => {
          on_creation()
        }
      )
      .then(
        q => console.log(q)
      )
    };
  });
  console.log(`Port ${port}`)
})