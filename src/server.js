import { createApp } from './app.js'

const app = createApp()
const port = 3000

app.listen(port, () => {
  console.log('API BricoLoop sur http://localhost:' + port)
})
