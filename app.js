//set up
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//------------------------------

//connect to database

mongoose.connect("mongodb+srv://forEveryone:example123@cluster0.yic4qd3.mongodb.net/todolistDB");   //atlas database
                                                                                                           //link to "todolistDB" database on atlas
//mongoose.connect("mongodb://localhost:27017/todolistDB"); //local database

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema); //first param is singular version of collection name

const item1 = new Item({
  name: "Welcome"
})
const item2 = new Item({
  name: "Hit the + button to add a new item"
})
const item3 = new Item({
  name: "<-- Hit this to delete an item"
})
const defaultItems = [item1, item2, item3];



const ListSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", ListSchema);  //create other collection

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//-----------------------------

app.get("/", function(req, res) {

  const day = date.getDate();
  
  Item.find({}).then((items)=>{  //find all, items is returned as an array
    if(items.length === 0 ){  //only add the default items once, when there's nothing in list yet
      Item.insertMany(defaultItems);
      res.redirect("/");  //redirect to root when there're already default items in list
    } else {
      res.render("list", {listTitle: day, newListItems: items});

    }
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem; //in list.ejs, <input> has name "newItem"
  const listName = req.body.list; //in list.ejs, <button> has name "list"
  const day = date.getDate();

  const item = new Item({
    name: itemName
  })

  if(listName === day){
    item.save();
    res.redirect("/");
  } else {  //for dynamic url, listName is customeListName
    List.findOne({name: listName}).then((foundList)=>{
      // List.updateOne({name: foundList.name}, {$push: {Items: item}}).then(()=>{
      //   //foundList.save();
      // })
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res){   //in list.ejs, when the checkbox is checked, it'll submit a post request to /delete
  const checkedItemId = req.body.checkbox;  //req.body.checkbox is the id of the checked item
  const listName = req.body.listName; //in list.ejs, <input type="hidden"> has name="listName" 
  const day = date.getDate();

  if(listName === day){
    Item.findByIdAndRemove(checkedItemId).then(()=>{});
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(()=>{
      res.redirect("/" + listName);
    });
  }

  
})

//---------------------------

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req, res){ //dynamic url "/:params"
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then((foundList)=>{
    if (!foundList) {  //if foundList hasn't exist, create a new list collection
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else { 
      res.render("List", {listTitle: foundList.name, newListItems: foundList.items});
    }
  });
})

//-----------------------------

let port = process.env.PORT; //for heroku port
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully");
});
