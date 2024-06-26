const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser")
const session = require('express-session');

const port = 2000;
const app = express();
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(session({
    secret: 'tahir-123',
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 6000000
    }
}));

const IsLoggedIn = (req, res, next) => {
    if (req.session.IsLogedIn) {
        next();
    } else {
        res.render('login', { message: "Your session expired :(.... and You are not authoriaed to perform this operation please login first" })
    }
}
app.use((req, res, next) => {
    res.locals.IsLogedIn = req.session.IsLogedIn || false;
    next();
});

const mongoURI = 'mongodb://localhost:27017/Address';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    phone: String,
    address: String,
    city: String,
    gender: String,
    skills: [String]
}, { collection: 'users' });

userSchema.post('validate', function (error, doc, next) {
    if (error) {
        console.error(error);
        next(error);
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('index', { IsLogedIn: req.session.IsLogedIn });
});

app.get('/login', (req, res) => {
    res.render('login', { message: null, IsLogedIn: req.session.IsLogedIn });
});

app.post('/login', (req, res) => {
    const { Email, Password } = req.body;
    if (Email === 'admin@example.com' && Password === 'admin123') {
        req.session.IsLogedIn = true;
        res.redirect('/home');
    } else {
        req.session.IsLogedIn = false
        console.log("Username not found.");
        const mess = "Username not found or Incorrect password :( "
        res.render('login', { message: mess, IsLogedIn: req.session.IsLogedIn })
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("could not destroy session");
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    })
})

app.get('/home', async (req, res) => {
    try {
        const users = await User.find({}, 'id name phone address city gender skills');
        // console.log(users); // Log fetched users to console
        res.render('Home', { users: users, IsLogedIn: req.session.IsLogedIn});
        // res.send(users);
    } catch (err) {
        console.error(err); // Log error to console
        res.status(500).send('Error fetching data');
    }
});

app.get('/update', async (req, res) => {
    const userID = req.query.id;
    try {
        const user = await User.findOne({ id: userID });
        if (!user) {
            res.send("User not Found");
        }
        res.render('updateForm', { user: user, IsLogedIn: req.session.IsLogedIn });
    } catch (err) {
        res.status(500).send("User not found")
    }
});

app.post('/update', async (req, res) => {
    const userID = req.body.id;
    const { name, phone , gender, skills, address, city} = req.body;
    // console.log(userID);
    try {
        const updateUser = await User.findOneAndUpdate({id: userID}, {
            name,
            phone,
            address,
            city,
            gender,
            skills
        }, { new: true });

        if (!updateUser) {
            return res.status(404).send("User not found");
        }

        res.redirect('/home');

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send("Error updating user");
    }
});

app.post('/delete', async (req, res)=>{
    const userId = req.body.id;
    try {
        const usertodel = await User.findOneAndDelete({id: userId})
        if(!usertodel){
            return res.status(404).send("User not found")
        }
        res.redirect('/home');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send("Error deleting user");
    }
})

app.get('/add', (req, res) => {
    res.render('Addform', {errorMessage: null, IsLogedIn: req.session.IsLogedIn});
})

app.post('/add', async (req, res) => {
    const {id, name, phone, gender, skills, address, city} = req.body;
    try {
        const existingUser = await User.findOne({id: id});
        if(existingUser){
            return res.render('Addform', {errorMessage: "User with this ID already exists. Please use another ID.", IsLogedIn: req.session.IsLogedIn});
        }

        const newUser = new User({
            id: id,
            name: name,
            phone: phone,
            gender: gender,
            skills: skills,
            address: address,
            city: city
        })
        await newUser.save();
        res.redirect('/home');
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send("Error adding user");
    }
});

app.get('/show', async (req, res) => {
    const UserId = req.query.id;
    // console.log(UserId);
    try {
        const usertoashow = await User.findOne({id: UserId});
        if(!usertoashow){
            return res.status(404).send('User not Found :(....');
        }
        // console.log(usertoashow);
        // console.log(usertoashow._id);
        res.render('showUser', {user: usertoashow, IsLogedIn: req.session.IsLogedIn});
    } catch (error) {
        console.error('Error finding user:', error);
        res.status(500).send("Error finding user");
    }
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
