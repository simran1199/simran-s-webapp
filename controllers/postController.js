const Post= require("../models/Post")
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.viewCreateScreen= function(req, res){
    res.render("create-post")
}

exports.create= function(req, res ){
    let post = new Post(req.body, req.session.user._id, req.session.user.email)
    post.create().then(function(newId){
        sendgrid.send({
            to: `${post.email}`,
            from: 'fromgeeksroom@gmail.com',
            subject: 'Congrats on creating your new post!!',
            text: 'You made a great contribution to GeeksRoom by creating a post about a new hack or any knowledgeable thing which will help GeeksRoom to grow and is an another step for every GeeksRoom user toward learning something new.',
            html: '<h2>GeeksRoom Congratulates you !!</h2><p>Dear GeeksRoom User,</p><p>You made a great contribution to GeeksRoom by creating a new post about a new hack or any knowledgeable thing which will help GeeksRoom to grow and is an another step for every GeeksRoom user toward learning something new.</p><p>Thank You</p>'
        })
        req.flash("success", "New post successfully created.")
        req.session.save(()=>res.redirect(`/post/${newId}`))
    }).catch(function(errors){
        errors.forEach(error=>req.flash("errors",error))
        req.session.save(()=> res.redirect("/create-post"))
    })
}

exports.apiCreate= function(req, res ){
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function(newId){
        res.json("congo")
    }).catch(function(errors){
        res.json(errors)
    })
}

exports.viewSingle= async function(req, res){
    try{

        let post= await Post.findSingleById(req.params.id,req.visitorId)
        res.render("single-post-screen",{post:post, title: post.title})
    }catch{
        res.render("404")
    }
}

    exports.viewEditScreen = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render("edit-post", {post: post})
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect("/"))
    }
  } catch {
    res.render("404")
  }
}

exports.edit=function(req, res){
    let post= new Post(req.body,req.visitorId,req.params.id)
    post.update().then((status)=>{
        //the post was successfully updated in the db
        //or user did have permission but met a validation error
        if(status=="success"){
            //post was upadated in db
            req.flash("success","Post successfully Updated")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }else{
            post.errors.forEach(function(error){
                req.flash("errors",error)
            })
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(()=>{
        //a post with requested id doesnt exit
        //or if the curent visitor is aint the owner
        req.flash("errors","You do not have the permission to perform that action.")
        req.session.save(function(){
            res.redirect("/")
        })
    })
}

exports.delete=function(req, res){
    Post.delete(req.params.id, req.visitorId).then(()=>{
        req.flash("success","Post has been Successfully deleted!!")
        req.session.save(()=>res.redirect(`/profile/${req.session.user.username}`))
    }).catch(()=>{
        req.flash("errors","You donot have the permission to do that!!")
        req.session.save(()=>res.redirect("/"))

    })
}

exports.apiDelete=function(req, res){
    Post.delete(req.params.id, req.apiUser._id).then(()=>{
        res.json("success")
    }).catch(()=>{
        res.json("you dont have permission to perform that action")
    })
}

exports.search= function(req, res){
    Post.search(req.body.searchTerm).then((posts)=>{
        res.json(posts)
    }).catch(()=>{
        res.json([])
    })
}
