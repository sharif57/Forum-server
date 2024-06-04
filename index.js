const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cwjeixv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



    const postCollection = client.db('forum').collection('post')
    const userCollection = client.db('forum').collection('users')
    const commentCollection = client.db('forum').collection('comment')
    const announcementCollection = client.db('forum').collection('announcement')




    //announcement related
    app.post('/announcement', async (req, res) => {
      const newPost = req.body;
      console.log(newPost)
      const result = await announcementCollection.insertOne(newPost)
      res.send(result)
    })
    app.get('/announcement', async (req, res) => {
      const cursor = announcementCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })


    //comment related
    app.post('/comment', async (req, res) => {
      const newUser = req.body;
      console.log(newUser)
      const result = await commentCollection.insertOne(newUser)
      res.send(result)
    })

    // app.get('/comment/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await commentCollection.findOne(query);
    //   res.send(result)
    // })

    // app.get('/comment', async (req, res) => {
    //   const cursor = commentCollection.find()
    //   const result = await cursor.toArray()
    //   res.send(result)
    // })

    app.get('/comment/:email', async (req, res) => {
      console.log(req.params.email);
      const result = await commentCollection.find({ email: req.params.email }).toArray()
      res.send(result)
    })


    //user related api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exits', insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users', async (req, res) => {
      const cursor = userCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })


// post relate data
    app.get('/post', async (req, res) => {
      const cursor = postCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.post('/post', async (req, res) => {
      const newUsers = req.body;
      console.log(newUsers)
      const result = await postCollection.insertOne(newUsers)
      res.send(result)
    })

    app.get('/post/:email', async (req, res) => {
      console.log(req.params.email);
      const result = await postCollection.find({ email: req.params.email }).toArray()
      res.send(result)
    })

    app.get('/posts/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(re);
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.findOne(query);
      res.send(result)
    })

    app.delete('/post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.deleteOne(query)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('forum is running')
})

app.listen(port, () => {
  console.log(`Forum server is running on port ${port}`)
})