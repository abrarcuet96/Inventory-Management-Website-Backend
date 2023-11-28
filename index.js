const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware:
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-g4cltbn-shard-00-00.xdos8fw.mongodb.net:27017,ac-g4cltbn-shard-00-01.xdos8fw.mongodb.net:27017,ac-g4cltbn-shard-00-02.xdos8fw.mongodb.net:27017/?ssl=true&replicaSet=atlas-136bys-shard-0&authSource=admin&retryWrites=true&w=majority`;

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
    // ---------------------------------------------------------------------------------------------------
    const usersCollection = client.db('inventoryDB').collection('users');
    const shopCollection = client.db('inventoryDB').collection('shops');
    const productCollection = client.db('inventoryDB').collection('products');
    // user info api
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const userExist = await usersCollection.findOne(query);
      if (userExist) {
        return res.send({ message: 'user already exist', insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // shop api
    app.get('/shops', async (req, res) => {
      const result = await shopCollection.find().toArray();
      res.send(result);
    });
    app.post('/shops/:email', async (req, res) => {
      const shop = req.body;
      const email = req.params.email;
      const query = { ownerEmail: shop.ownerEmail };
      const shopExist = await shopCollection.findOne(query);
      if (shopExist || shop.ownerEmail !== email) {
        return res.send({ message: `${shop.ownerName}'s shop already exist`, insertedId: null });
      }
      const result = await shopCollection.insertOne(shop);
      res.send(result);
    })
    // shop user become a manager
    app.patch('/users', async (req, res) => {
      const newInfo = req.body;
      const id = req.params.id;
      console.log(id);
      const query = { email: newInfo.email };
      const updatedInfo = {
        $set: {
          name: newInfo.name,
          email: newInfo.email,
          imageURL: newInfo.imageURL,
          role: newInfo.role,
          shopName: newInfo.shopName,
          shopLogo: newInfo.shopLogo,
        }
      };
      const result = await usersCollection.updateOne(query, updatedInfo);
      res.send(result);

    });
    // find user
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      console.log(email);
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    // products api
    // find products according to email
    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    app.get('/products/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email }
      console.log(email);
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    // save product to database according to email id
    app.post('/products', async (req, res) => {
      const product = req.body;
      const query= {userEmail: product.userEmail}
      const productCount = await productCollection.countDocuments(query);
      console.log(productCount);
      if (productCount >= 3) {
        return res.send({ message: 'you cannot add more product', insertedId: null });
      }
      const result = await productCollection.insertOne(product);
      res.send(result);
    });






    // ---------------------------------------------------------------------------------------------------
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
  res.send("inventory-management-system is running");
});
app.listen(port, () => {
  console.log(`inventory-management-system is running on port ${port}`);
});