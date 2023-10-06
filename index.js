const express = require('express')
require('dotenv').config()
const cors = require("cors");
const app = express()
const port = process.env.PORT || 5000



app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.3f1y3cg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const AllRoomsCollection = client.db("airbnbDB").collection("rooms");


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    app.get('/all-rooms', async (req, res) => {
      const result = await AllRoomsCollection.find().toArray();
      res.send(result);
    })

    app.get('/search', async (req, res) => {
      const { location, dateRange, guests, infants, pets } = req.query;
    
      const startDate = dateRange.split(' - ')[0];
      const endDate = dateRange.split(' - ')[1];
      const query = {};
    
      if (location) {
        query.location = location;
      }
    
      if (dateRange) {
        query.dateRange = { $gte: startDate, $lte: endDate };
      }
    
      if (guests) {
        query['holdingCapacity.guests'] = { $gte: parseInt(guests) };
      }
    
      if (infants) {
        query['holdingCapacity.infants'] = { $gte: parseInt(infants) };
      }
    
      if (pets) {
        query['holdingCapacity.pets'] = { $gte: parseInt(pets) };
      }
        const results = await AllRoomsCollection.find({location: { $regex: location, $options: "i" }||  {dateRange: { $regex: dateRange, $options: "i" }}}).toArray();
        res.send(results);
     
    });

    app.get("/filter", async (req, res) => {
      const {
        activePlaceType,
        minValue,
        maxValue,
        beds,
        bathrooms,
        homeProperty,
        apartmentProperty,
        guestHouseProperty,
      } = req.query;
    
     
    
      const pipeline = [];
    
      if (activePlaceType) {
        pipeline.push({
          $match: {
            $or: [
              { category: activePlaceType },
              { propertyType: activePlaceType },
            ],
          },
        });
      }
      if (minValue && maxValue) {
        pipeline.push({
          $match: {
            price: {
              $gte: parseFloat(minValue),
              $lte: parseFloat(maxValue),
            },
          },
        });
      }
    
      if (beds && parseInt(beds) !== 0) {
        pipeline.push({ $match: { beds: parseInt(beds) } });
      }
    
      if (bathrooms && parseInt(bathrooms) !== 0) {
        pipeline.push({ $match: { bedrooms: parseInt(bathrooms) } });
      }
      if (homeProperty ||apartmentProperty ||guestHouseProperty ) {
        pipeline.push({ $match:{
          $or: [
            { propertyType: homeProperty },
            { propertyType: apartmentProperty },
            { propertyType: guestHouseProperty },
          ],
        }  });
      }
      const filteredData = await AllRoomsCollection.aggregate(pipeline).toArray();
      res.send(filteredData);
    });



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Airbnb server is running')
})

app.listen(port, () => {
  console.log(`airbnb server is running on port:  ${port}`)
})