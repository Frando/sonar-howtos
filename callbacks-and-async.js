
async function addToIndex (text) {
  // does some IO, needs some time, and then resolves
}

// We start in callback land.
//
// How to call an async function from within a callback?
//
// 1) then/catch
// Calling an async function returns a Promise. 
// We can just use the "oldschool" then/catch functions on the result
function indexReadme (cb) {
  fs.readFile('README', (err, buf) => {
    if (err) return cb(err)
    const text = buf.toString()
    indexer.add(text)
      .then(result => cb(null, result))
      .catch(err => cb(err))
  })
}

// 2) async callback
//
// Now, we could also call our callback function with an async callback closure.
// However, this means that one extra promise is created and immediately returned from the closure.
// As functions expecting a callback (like fs.readFile) don't care for the return value in any way,
// this promise is dropped immediately. This means:
// If passing an async callback closure to a function, this async callback
// MAY NEVER THROW!
// Otherwise, the thrown error will be an "uncaught exception". This means: when using this pattern,
// ALWAYS wrap the whole body of the async callback in a try/catch block or be REALLY sure that it
// may NEVER throw.
// Generally, this pattern is discourged.
function indexReadme (cb) {
  fs.readFile('README', async (err, buf) => {
    try {
      const text = buf.toString()
      const result = await indexer.add(text)
      cb(null, result)
    } catch (err) {
      cb(err)
    }
  })
}

// Now we move sides into async/await API land.
// Let's say we want to write an async function that needs to await the result
// of a function that uses callback style. This means we have to "promisify"
// the function to which the callback is passed.
// Let's say this is the async API function we're writing, and we want to call
// fs.readFile within this function and await the result.
async function indexReadme () {
  const buf = await new Promise((resolve, reject) => {
    fs.readFile('README', (err, buf) => {
      if (err) reject(err)
      else resolve(buf)
    })
  const result = await indexer.add(buf.toString())
  return result
}

// There's also the util.promisify function in nodejs. This function can be used to convert
// any function which expects an (err, result) callback as its last parameter into a promise.
const { promisify } = require('util')
async function indexReadme () {
  const buf = await promisify(fs.readFile)('README')
  const result = await indexer.add(buf.toString())
  return result
}
