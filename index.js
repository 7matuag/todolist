const express = require("express");
const mongoose = require("mongoose");
const _  = require("lodash");
const dotenv = require("dotenv");
const app = express();
require('dotenv').config();


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

main().catch(function(err){
  console.log(err)
});

async function main() {
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  await mongoose.connect('mongodb+srv://' + username + ':' + password + '@cluster0.jajikaw.mongodb.net/todolistDB');
}

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List!",
});

const item2 = new Item({
  name: "Click + Button to Add tasks.",
});

const item3 = new Item({
  name: "<-- Hit this to Delete the task.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = new mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Success");
          })
          .catch(function (err) {
            console.log(err);
          });
      }
      res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const listName = _.capitalize(req.body.list);
  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName,
  });
  
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkedItem;
  const checkedItemList = _.capitalize(req.body.listName);

  if(checkedItemList === "Today"){
    Item.deleteOne({ _id: checkedItemId })
    .then(function () {
      console.log("success");
    })
    .catch(function (err) {
      console.log(err);
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name : checkedItemList},{$pull : {items : {_id : checkedItemId}}})
    .then(function(){
      res.redirect("/" + checkedItemList);
    })
    .catch(function(err){
      console.log(err);
    })
  }
});

app.get("/:customList", function (req, res) {

  const customListName = _.capitalize(req.params.customList);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } 
      else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3001, function () {
  console.log("server is live at port 3000.");
});