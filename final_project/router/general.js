const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Promise wrapper around the local book data (simulates an async data source)
const getBooks = () => new Promise((resolve) => resolve(books));

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop (async/await with Promise)
public_users.get('/', async function (req, res) {
  const allBooks = await getBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  getBooks()
    .then((allBooks) => {
      if (!allBooks[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
      }
      return res.status(200).send(JSON.stringify(allBooks[isbn], null, 4));
    });
 });

// Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author.toLowerCase();
  const allBooks = await getBooks();
  const result = Object.keys(allBooks)
    .filter((isbn) => allBooks[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, title: allBooks[isbn].title, reviews: allBooks[isbn].reviews }));
  if (result.length === 0) {
    return res.status(404).json({ message: `No books found by author ${req.params.author}` });
  }
  return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
});

// Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title.toLowerCase();
  const allBooks = await getBooks();
  const result = Object.keys(allBooks)
    .filter((isbn) => allBooks[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, author: allBooks[isbn].author, reviews: allBooks[isbn].reviews }));
  if (result.length === 0) {
    return res.status(404).json({ message: `No books found with title ${req.params.title}` });
  }
  return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

// ---------------------------------------------------------------------------
// Tasks 10-13: client functions that call the API above using Axios
// (async/await and Promise callbacks)
// ---------------------------------------------------------------------------
const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// Task 10: Get all books (async/await with Axios)
const getAllBooksAxios = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching all books: ${error.message}`);
  }
};

// Task 11: Get book details by ISBN (Promise callbacks with Axios)
const getBookByISBNAxios = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`);
    });
};

// Task 12: Get book details by author (async/await with Axios)
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books by author ${author}: ${error.message}`);
  }
};

// Task 13: Get book details by title (async/await with Axios)
const getBooksByTitleAxios = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books with title ${title}: ${error.message}`);
  }
};

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
