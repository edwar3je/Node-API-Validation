/** Common config for bookstore. */


let DB_URI = '';

if (process.env.NODE_ENV === "test") {
  DB_URI = `books_test`;
} else {
  DB_URI = `books`;
}


module.exports = { DB_URI };