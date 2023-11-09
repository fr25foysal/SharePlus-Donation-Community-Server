const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port =process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173','https://shareplus-25.web.app','https://shareplus-25.firebaseapp.com'],
  credentials: true
}))
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Midlewares
const verifyToken = (req,res,next) =>{
  const token = req?.cookies?.token
  if (!token) {
    return res.status(401).send({message: "Unauthorized Access"})
  }
  jwt.verify(token,process.env.SECRET,(err, decoded)=>{
    if (err) {
      return res.status(401).send({message: "Unauthorized Access"})
    }
    req.user = decoded
    next()
  })
} 

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

    // get requested food data
    app.get('/requested-foods', async(req,res)=>{
      const email = req.query.email
      const query = {'UserEmail': email}
      const result = await reqCollection.find(query).toArray()
      res.send(result)
    })

    // Get userwise added food
    app.get('/manage-foods',async(req,res)=>{
      const email = req.query.email
      const query= {'DonatorEmail': email}
      const result = await foodCollection.find(query).toArray()
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

    // Jwt
    app.post('/jwt',async(req,res)=>{
      const email = req.body
      const token =await jwt.sign(email,process.env.SECRET,{expiresIn: '1h'})
      res.cookie('token',token,{
        httpOnly: true,
        sameSite: 'none',
        secure: true
      })
      .send({success : true})
      console.log(token);
    })
// delete cookie
    app.delete('/logout',async(req,res)=>{
      res.clearCookie('token',{maxAge: 0,sameSite: 'none',secure: true}).send({success: true})
    
    })

    // Delete Api's
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await reqCollection.deleteOne(query);
      res.send(result);
      console.log(query);
    });

    // delete from manage
    app.delete('/manage/delete/:id',async(req,res)=>{
      const id = req.params.id 
      const filter = {
        _id: new ObjectId(id)}
      const result = await foodCollection.deleteOne(filter)
      res.send(result)
      console.log(filter);
    })

    // Put Api's
    // Update Food From mannage Food
    app.put('/update-food',async(req,res)=>{
      const id = req.query.id
      const data = req.body
      const query = {_id: new ObjectId(id)}
      const options = {upsert : true}
      const update = {
        $set: data
      }
      const result = await foodCollection.updateOne(query,update,options)
      res.send(result)
    })
    
    // await client.connect(); 
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  } 
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`shareplus server running on port ${port}`)
})  