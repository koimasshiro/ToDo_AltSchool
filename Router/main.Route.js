const task = require("../model/task");
const user = require("../model/user");
const jwt = require('jsonwebtoken')

const router = require("express").Router();
const authGuard = async(req,res, next)=>{
    try {
    let token;
    token = req.cookies.token;
    if (!token) {
        res.redirect('/login')
      }
        const decoded = jwt.verify(token, 'idontlikebread');
        req.user = await user.findOne({_id:decoded.user_id})
        next()
    } catch (error) {
        console.log(req.cookies);
        res.redirect('/login')
    }
}

router.get("/login", (req, res, next) => {
  res.render("login");
});

router.get("/register", (req, res, next) => {
  res.render("register");
});

router.post("/login", async (req, res, next) => {
    const {username, password} = req.body
    try {
        const findUser = await user.findOne({username, password})
        const token = jwt.sign(
            {
              user_id: findUser._id
            },
            'idontlikebread'
          );
          console.log(token);
        const options = {
            expires: new Date(
              Date.now() + 1 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
          };
        res
        .status(200)
        .cookie('token', token, options).redirect('/home')
      } catch (error) {
        console.log(error);
        res.send('Error In Creation, Either Duplicate Or invalid input')
      }
});

router.post("/register",async (req, res, next) => {
  const {username, password} = req.body
  try {
    const newUser = await user.create({username, password})
    const token = jwt.sign(
        {
          user_id: newUser._id
        },
        'idontlikebread'
      );
    const options = {
        expires: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
      };
    res
    .status(201)
    .cookie('token', token, options).redirect('/home')
  } catch (error) {
    console.log(error);
    res.send('Error In Creation, Either Duplicate Or invalid input')
  }
});

router.get("/create", authGuard, (req, res, next) => {
  res.render("create");
});

router.post("/create", authGuard, async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.send("Not a valid Body");
    }
    await task.create({
      body,
      user: req.user._id,
      done: false,
    });
    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.send("An Error Occured");
  }
});

router.get("/read/:id", authGuard, async (req, res, next) => {
  try {
    const t = await task.findOne({ _id: req.params.id });
    t.done = true;
    await t.save();
    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.send("Crazy things are happening!!");
  }
});

router.get("/edit/:id", authGuard, async (req, res, next) => {
  try {
    const t = await task.findOne({ _id: req.params.id });
    res.render("edit", { t });
  } catch (error) {
    console.log(error);
    res.send("Crazy things are happening!!");
  }
});

router.post("/edit/:id", authGuard, async (req, res, next) => {
  try {
    const t = await task.findOne({ _id: req.params.id });
    t.body = req.body.body;
    await t.save();
    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.send("Crazy things are happening!!");
  }
});

router.get("/home", authGuard, async (req, res, next) => {
  try {
    const tasks = await task.find({ user: req.user._id });
    res.render("home", { tasks });
  } catch (error) {
    console.log(error);
    res.send("Crazy things are happening!!");
  }
});

module.exports = router;
