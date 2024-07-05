import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import swaggerAutogen from 'swagger-autogen'

import { Character } from '../src/models/character.js'

const _dirname = dirname(fileURLToPath(import.meta.url))

const doc = {
  info: {
    title: 'Rickmorty API',
    description: 'Wowzers'
  },
  definitions: {
    // модель задачи
    Character: {
      id: '1',
      name: "Rick",
      status: "Alive",
      species: "Human" ,
      type: "",
      gender: "Male",
      origin: {
        name: "Earth (C-137)",
        url: ""
      },
      location: {
        name: "Citadel of Ricks",
        url: ""
      },
      image : "",
      episode: [],
      url: "",
      created: ""
    },
    Characters: [{
      $ref: '#/definitions/Character'
    }]
  },
  host: 'localhost:3000',
  schemes: ['http']
}

// путь и название генерируемого файла
const outputFile = join(_dirname, 'output.json')
// массив путей к роутерам
const endpointsFiles = [join(_dirname, '../src/index.js')]

swaggerAutogen(/*options*/)(outputFile, endpointsFiles, doc).then(({ success }) => {
 console.log(`Generated: ${success}`)
})