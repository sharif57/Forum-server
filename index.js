const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    // app.get('/post', async(req, res)=>{
    //   console.log(req.query.authorEmail);
    //   if(req.query?.authorEmail){
    //     query ={authorEmail: req.query.authorEmail}
    //   }
    //   const result = await postCollection.find(query).toArray()
    //   res.send(result)
    // })
    app.get('/post/:email', async (req, res) => {
      console.log(req.params.email);
      const result = await postCollection.find({ email: req.params.email }).toArray()
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