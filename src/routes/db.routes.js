import { Router } from 'express'
import { conn } from './../db.js'

const router_db = Router()

router_db.get('/view/:name', async (req, res) => {
  // #swagger.description = 'Вывести все записи из таблицы'
  const tbl_name = req.params.name

  conn.query(`SELECT * from ${tbl_name}`, (err, q) => {
    if(err) {
      res.status(404)
      return res.json({message: `Table ${tbl_name} not found`})
    }
    else {
      res.status(200)
      return res.json(q.rows)
    }
  })
})

router_db.get('/check_conn', async (req, res, next) => {
  // #swagger.description = 'Проверить соединение с БД'

  conn.query("SELECT version()", (err, q) => {
    if (err) {
      res.status(500)
      .json({ message: err })
    }
    res.status(200)
    .json({ message: `Succesfull coonnection ${q.rows[0]}` })
  });
})

router_db.post('/drop_table/:name', async (req, res) => {
  // #swagger.description = 'Удалить таблицу'
  const tbl_name = req.params.name 

  conn.query(`DROP TABLE ${tbl_name}`, (err, q) => {
    if(err) {
      return res.status(500).json({message: err})
    }
    else {
      return res.status(200).json({message: `Succesfully deleted table ${tbl_name}`})
    }
  })
})

router_db.post('/truncate_table/:name', async (req, res) => {
  // #swagger.description = 'Очистить таблицу'
  const tbl_name = req.params.name 

  conn.query(`TRUNCATE TABLE ${tbl_name} CASCADE`, (err, q) => {
    if(err) {
      return res.status(500).json({message: err})
    }
    else {
      return res.status(200).json({message: `Succesfully cleared table ${tbl_name}`})
    }
  })
})

// router_db.get('/drop_all', async (req, res) => {
//   conn.query("DROP TABLE")
// })

router_db.get('/create', async (req, res) => {
  // #swagger.description = 'Создать таблицу персонажей'
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
  conn.query(text, (err, q) => {
    if (err) {
      console.log(err)
      res.status(500)
      res.json({ message: err })
    }
    else {
      res.status(200)
      res.json({ message: `Succesfully created tables` })
    }
  });
})

export default router_db