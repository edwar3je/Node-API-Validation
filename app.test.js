process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('./app');
const db = require('./db');

beforeEach(async () => {
    await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES ('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)`)
});

afterEach(async () => {
    await db.query(`DELETE FROM books`);
});

describe('GET /books', function() {
    test('Get a list of all books', async function() {
        const resp = await request(app).get('/books');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "books": [
                {
                    "isbn": "0691161518",
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Matthew Lane",
                    "language": "english",
                    "pages": 264,
                    "publisher": "Princeton University Press",
                    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                    "year": 2017
                }
            ]
        });
    })
});

describe('POST /books', function() {
    test('Create a new book if all valid info is provided', async function() {
        const resp = await request(app).post('/books').send({
            "isbn": "1749129578",
            "amazon_url": "http://a_url",
            "author": "James Edwards",
            "language": "english",
            "pages": 300,
            "publisher": "Penguin Books",
            "title": "Finding a Coding Job (As a Non-Coder)",
            "year": 2023
        });
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            "book": {
                "isbn": "1749129578",
                "amazon_url": "http://a_url",
                "author": "James Edwards",
                "language": "english",
                "pages": 300,
                "publisher": "Penguin Books",
                "title": "Finding a Coding Job (As a Non-Coder)",
                "year": 2023
            }
        })
    });
    
    test('An error should pop up if only some of the information is provided', async function() {
        const resp = await request(app).post('/books').send({
            "isbn": "1749129578",
            "author": "James Edwards",
            "language": "english",
            "pages": 300,
            "publisher": "Penguin Books",
            "title": "Finding a Coding Job (As a Non-Coder)",
            "year": 2023
        });
        expect(resp.statusCode).toEqual(400);
    });
    
    test('An error should pop up if different data types are provided than expected', async function() {
        const resp = await request(app).post('/books').send({
            "isbn": "1749129578",
            "amazon_url": "http://a_url",
            "author": "James Edwards",
            "language": "english",
            "pages": -1,
            "publisher": 42,
            "title": "Finding a Coding Job (As a Non-Coder)",
            "year": "not a number"
        });
        expect(resp.statusCode).toEqual(400);
    });
    test('An error should pop up if you attempt to use an isbn that is already in the database', async function() {
        const resp = await request(app).post('/books').send({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })
        expect(resp.statusCode).toEqual(500);
    })
});

describe('GET /books/:isbn', function() {
    test('Get information on a single book', async function() {
        const resp = await request(app).get('/books/0691161518');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "book": {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            }
        })
    });

    test('An error should pop up if you attempt to look for an isbn that is not in the database', async function() {
        const resp = await request(app).get('/books/1234');
        expect(resp.statusCode).toEqual(404);
    })
});

describe('PUT /books/:isbn', function() {
    test('Providing a full set of data for a given book in the database will update information on said book', async function() {
        const resp = await request(app).put('/books/0691161518').send({
            "amazon_url": "http://a.co/eobPtX2",
	        "author": "Matthew Lane",
	        "language": "english",
	        "pages": 264,
	        "publisher": "Princeton University Press",
	        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
	        "year": 2018
        });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "book": {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
	            "author": "Matthew Lane",
	            "language": "english",
	            "pages": 264,
	            "publisher": "Princeton University Press",
	            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
	            "year": 2018
            }
        })
    });

    test('Providing partial sets of data with correct data types for an existing book will only update fields from the data provided', async function() {
        const resp = await request(app).put('/books/0691161518').send({
	        "author": "Some Guy",
	        "pages": 150,
	        "title": "Some Book"
        });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "book": {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
	            "author": "Some Guy",
	            "language": "english",
	            "pages": 150,
	            "publisher": "Princeton University Press",
	            "title": "Some Book",
	            "year": 2017
            }
        })
    });

    test('Providing any incorrect data types or violating constraints will result in an error', async function() {
        const resp = await request(app).put('/books/0691161518').send({
            "author": "Some Guy",
	        "pages": -1,
	        "title": 42
        });
        expect(resp.statusCode).toEqual(400);
    });

    test('Providing any additional fields not specified in the schema will result in an error', async function() {
        const resp = await request(app).put('/books/0691161518').send({
            "isbn": "0691161518",
            "author": "Some Guy",
	        "pages": 150,
	        "title": "Some Book"
        });
        expect(resp.statusCode).toEqual(400);
    })

    test('Trying to send a PUT request to a non-existent book will result in a 404 error', async function() {
        const resp = await request(app).put('/books/1234').send({
            "author": "Some Guy",
	        "pages": 150,
	        "title": "Some Book"
        });
        expect(resp.statusCode).toEqual(404)
    })
});

describe('DELETE /books/:isbn', function() {
    test('If the book exists, it will return with a message indicating the book has been deleted', async function() {
        const resp = await request(app).delete('/books/0691161518');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ "message": "Book deleted" })
    });
    test('If the book does not exist, it will return a 404 error', async function() {
        const resp = await request(app).delete('/books/1234');
        expect(resp.statusCode).toEqual(404);
    })
});