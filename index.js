const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    // await client.connect();



    const postCollection = client.db('forum').collection('post')
    const userCollection = client.db('forum').collection('users')
    const commentCollection = client.db('forum').collection('comment')
    const announcementCollection = client.db('forum').collection('announcement')
    const reportedCollection = client.db('forum').collection('reported')



    // payment intent 
   
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, 'this amount');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.post('/users', async (req, res) => {
      const payment = req.body;
      const paymentsResult = await userCollection.insertOne(payment)
      console.log('payment info', payment);
      res.send(paymentsResult)

    })

    //jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token })
    })

    // admin related
    app.patch('/users/admin/:id',  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })



    // Reported related 
    app.post('/reported', async (req, res) => {
      const ReportPost = req.body;
      console.log(ReportPost)
      const result = await reportedCollection.insertOne(ReportPost)
      res.send(result)
    })

    app.get('/reported', async (req, res) => {
      const cursor = reportedCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.delete('/reported/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await reportedCollection.deleteOne(query)
      res.send(result)
    })

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

    app.get('/comments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { postId: id }
      const result = await commentCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/comment', async (req, res) => {
      const cursor = commentCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/comment/:email', async (req, res) => {
      console.log(req.params.email);
      const result = await commentCollection.find({ email: req.params.email }).toArray()
      res.send(result)
    })

    //middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        console.log(decoded);
        if (err) {
          return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
      })

    }

    //use verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }


    // update post items

    app.patch('/post/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          upVote: item.upVote,
          downVote: item.downVote
        }
      };
      const result = await postCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });



    // 
    // app.post('/post', async (req, res) => {
    //   const { body } = req;
    //   const user = await userCollection.findOne({ email: body.email })

    //   if (user.badge == 'golden') {
    //     const result = postCollection.insertOne(body)
    //     return res.send(result)
    //   }
    //   else{
    //     const userPosts =await userCollection.find({email: body.email}).toArray()

    //     if(userPosts.length >= 5){
    //       return  res.send({error: 'max post reached', status: 402})
    //     }
    //     else{
    //       const result = await postCollection.insertOne(body)
    //       return res.send(result)
    //     }
    //   }
    // })

    


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

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
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