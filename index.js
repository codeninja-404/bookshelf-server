const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "https://bookshelf-client-d412a.web.app",
      "https://bookshelf-client-d412a.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t9ue7dv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ message: "Access forbidden for this user." });
    }
    req.user = decoded;

    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const categoryCollection = client.db("bookShelfDB").collection("categorys");
    const booksCollection = client.db("bookShelfDB").collection("books");
    const borrowedCollection = client.db("bookShelfDB").collection("borrowed");

    app.get("/api/v1/categorys", async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection

    // jwt token

    app.post("/api/v1/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.get("/api/v1/books", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/v1/addbooks", verifyToken, async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });
    app.patch("/api/v1/books/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const updatedBookInfo = req.body;

      if (req.query.quantity) {
        update = {
          $set: {
            quantity: req.query.quantity,
          },
        };
      } else {
        update = {
          $set: {
            photoUrl: updatedBookInfo.photoUrl,
            name: updatedBookInfo.name,
            authorName: updatedBookInfo.authorName,
            category: updatedBookInfo.category,
            rating: updatedBookInfo.rating,
          },
        };
      }
      const result = await booksCollection.updateOne(filter, update);
      res.send(result);
    });

    app.post("/api/v1/borrowed", async (req, res) => {
      const borrowedBook = req.body;
      // const borrowed = await borrowedCollection.find().toArray();
      // const exiest = borrowed.find((book) => book._id === borrowedBook._id);
      // if (exiest) {
      //   return res.send("Book already borrowed");
      // }
      const result = await borrowedCollection.insertOne(borrowedBook);
      res.send(result);
    });

    app.get("/api/v1/borrowed", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await borrowedCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/api/v1/borrowed/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/api/v1/details/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(filter);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bookshelf server is Running");
});

app.listen(port, () => {
  console.log(`Bookshelf server listening on port ${port}`);
});
