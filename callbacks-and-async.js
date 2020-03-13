// In Javascript, there's two common ways to deal with async IO:
// Callbacks, and Promises
//
// Callbacks are older, quite simple and powerful, but can lead to
// "callback spaghetti", where it may be harder to follow the code flow.
// The convention is simple: Functions that perform async IO receive as their
// last argument a "callback" or "cb" function. This function is called when
// the async operation is done. By convention, the callback function is always
// called with `err` as the first argument, which is either an Error object
// or null or undefined if there was no error. The callback function may also
// receive one or more result arguments.
//
// Promises are newer, and together with the async/await syntactic sugar
// allow for a simpler, more "sync-like" codeflow. However, promises may
// induce a performance overhead (especially when creating very many promises).
// Due to them being newer, a lot of older NodeJS code is not based on promises
// but on callbacks. Also, some patterns are easier to express with callbacks
// than with promises or async/await.
//
// Whatever you do – this document is concerned with what you do if you have
// to mix both patterns, so either calling async functions
// (= function returning a Promise) from a callback, or invoke a function that
// expects a callback from code block that does async/await otherwise.


// We start in callback land.
//
// Lets say there's a foreigh async API function that does some async IO.
async function addToIndex (text) {
  // does some IO, needs some time, and then resolves
}

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
