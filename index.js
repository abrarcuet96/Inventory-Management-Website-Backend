const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware:
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const cartCollection = client.db('inventoryDB').collection('carts');
    const salesCollection = client.db('inventoryDB').collection('sales');
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
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    // products api

    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    // find products according to id
    app.get('/products/:email/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });
    // find products according to email
    app.get('/products/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email }
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    // save product to database according to email id
    app.post('/products', async (req, res) => {
      const product = req.body;
      const query = { userEmail: product.userEmail }
      const productCount = await productCollection.countDocuments(query);
      if (productCount >= 3) {
        return res.send({ message: 'you cannot add more product', insertedId: null });
      }
      const result = await productCollection.insertOne(product);
      res.send(result);
    });
    // product update operation
    app.patch('/products/:id', async (req, res) => {
      const productItemDet = req.body;
      console.log(productItemDet);
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateProduct = {
        $set: {
          productName: productItemDet.productName,
          productImage: productItemDet.productImage,
          productDescription: productItemDet.productDescription,
          productLocation: productItemDet.productLocation,
          productionCost: productItemDet.productionCost,
          productionQuantity: productItemDet.productionQuantity,
          profitMargin: productItemDet.profitMargin,
          productDiscount: productItemDet.productDiscount,
          productAddedDate: productItemDet.productAddedDate,
          shopName: productItemDet.shopName,
          userEmail: productItemDet.userEmail,
          sellingPrice: productItemDet.sellingPrice,
          saleCount: productItemDet.saleCount,
        }
      }
      const result = await productCollection.updateOne(filter, updateProduct);
      res.send(result);
    })
    // product delete operation
    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    })

    // cart product 
    app.get('/cart', async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    })
    app.post('/cart', async (req, res) => {
      const cartProduct = req.body;
      const result = await cartCollection.insertOne(cartProduct);
      res.send(result);
    })

    app.get('/cart/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email }
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // sales collection api
    app.get('/sales', async (req, res) => {
      const result = await salesCollection.find().toArray();
      res.send(result);
    })
    app.post('/sales', async (req, res) => {
      const soldProduct = req.body;
      const result = await salesCollection.insertOne(soldProduct);
      res.send(result);
    })
    app.delete('/cart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
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