const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port =process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.thkxg3l.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const foodCollection = client.db('shareplus').collection('foods')
const reqCollection = client.db('shareplus').collection('food-requests')

async function run() {

  try {
    // Get methods

    // get featured Foods
    app.get('/featured-foods',async(req,res)=>{
        const options = { FoodQuantity : -1 }
        const result =await foodCollection.find().limit(8).sort(options).toArray()
        res.send(result)
    })

    // get featured Foods
    app.get('/featured-foods-sidebar',async(req,res)=>{
        const options = { ExpiredDate : 1 }
        const result =await foodCollection.find().limit(1).sort(options).toArray()
        res.send(result)
    })

    // get all food
    app.get('/foods',async(req,res)=>{
      const searchtext =  req.query.search
      const sortingtext = req.query.sort 
      let search = {}
      if (searchtext) {
        search = {FoodName : {$regex: new RegExp(searchtext,'i')}}
      }
      let sorting = {}

       if (sortingtext === "sort") {
         sorting ={ExpiredDate: 1}
       }
      const result = await foodCollection.find(search).sort(sorting).toArray()
      res.send(result)
    })

    // Get Single Food 
    app.get('/food/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id : new ObjectId(id) }
      const result =await foodCollection.findOne(query)
      res.send(result)
    }) 

    // post methods
    app.post('/add-food',async(req,res)=>{
      const foodData = req.body
      const result = await foodCollection.insertOne(foodData)
      res.send(result)
    })
 
    app.post('/req-food',async(req,res)=>{
      const reqData = req.body
      const result = await reqCollection.insertOne(reqData)
      res.send(result)
    })
    
    await client.connect(); 
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pined your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  } 
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`shareplus server running on port ${port}`)
}) 