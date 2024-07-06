const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 8000;

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://api.imgbb.com/1/upload?key=19c9072b07556f7849d6dea75b7e834d"
        ],
        credentials: true
    })
);

app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://tonmoyahamed2009:Tonmoytoma22@cluster0.w5cwfw4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        console.log("Connected to MongoDB");

        const usersCollection = client.db('Mirkamary_Adarsa_High_School').collection('users');


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        });


        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users); 
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });

        app.patch('/users/:email', async (req, res) => {
            const { email } = req.params;
            const { role } = req.body;

            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role,
                },
            };

            try {
                const result = await usersCollection.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: 'User not found' });
                }

                if (result.modifiedCount === 0) {
                    return res.status(400).send({ message: 'No changes made to the user' });
                }

                res.send({ message: 'User updated successfully', result });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update user' });
            }
        });

        app.put('/user', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email, name: user.displayName };
            const isExist = await usersCollection.findOne(query);
            if (isExist) {
                if (user.status === 'Requested') {
                    const result = await usersCollection.updateOne(query, {
                        $set: { status: user?.status },
                    });
                    return res.send(result);
                } else {
                    return res.send(isExist);
                }
            }

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...user,
                    timestamp: Date.now(),
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });


        app.get('/logout', async (req, res) => {
            try {
                res.clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                }).send({ success: true });
            } catch (err) {
                res.status(500).send(err);
            }
        });


        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } finally {

        process.on('SIGINT', async () => {

        });
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Mirekamary Adarsa High School is sitting On this Server');
});
