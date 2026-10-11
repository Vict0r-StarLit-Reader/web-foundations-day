# Library REST API Design

Documentation for managing the `books` resource in the Library API.

---

## Base URL
`https://api.library.example.com/v1`

---

## Endpoints

### 1. List All Books
* **Method:** `GET`
* **Path:** `/books`
* **Description:** Retrieves a list of all available books in the library.
* **Success Status Code:** `200 OK`

---

### 2. Get One Book
* **Method:** `GET`
* **Path:** `/books/:id`
* **Description:** Retrieves full details for a single book specified by its ID.
* **Success Status Code:** `200 OK`

---

### 3. Create a Book
* **Method:** `POST`
* **Path:** `/books`
* **Description:** Adds a new book entry to the library collection.
* **Request Body Example:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publishedYear": 1925,
  "genre": "Fiction"
}