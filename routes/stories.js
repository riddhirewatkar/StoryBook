const express = require('express')
const router = express.Router()
const { ensureAuth } = require('../middleware/auth')
const Story = require('../models/stories')

// Show add page
router.get('/add', ensureAuth, (req, res) => {
  res.render('stories/add')
})

// Add new story
router.post('/', ensureAuth, async (req, res) => {
  try {
    // Assign the user ID to the story
    req.body.user = req.user.id
    // Create the story in the database
    await Story.create(req.body)
    // Redirect to the dashboard
    res.redirect('/dashboard')
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// Show all public stories
router.get('/', ensureAuth, async (req, res) => {
  try {
    // Find all public stories, populate the user field with the corresponding user object, and sort by creation date
    const stories = await Story.find({ status: 'public' })
      .populate('user')
      .sort({ createdAt: 'desc' })
      .lean()

    // Render the index template with the stories as context
    res.render('stories/index', {
      stories,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc Show single story
//@route GET /stories/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try{
      let story = await Story.findById(req.params.id)
      .populate('user').lean()
      
      if(!story)
      {
        return res.render('error/404')
      }

      if(story.user._id != req.user.id && story.status == 'private'){
        res.render('error/404')
      }
      else{
        res.render('stories/show', {
          story,
        })
      }
    }
    catch(err){
      console.error(err)
      res.render('error/404')
    }
})

// Show edit page for a specific story
router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    // Find the story by ID
    const story = await Story.findOne({
      _id: req.params.id,
    }).lean()

    // If the story does not exist, render the 404 error page
    if (!story) {
      return res.render('error/404')
    }

    // If the user is not the owner of the story, redirect to the stories page
    if (story.user != req.user.id) {
      res.redirect('/stories')
    } else {
      // Otherwise, render the edit template with the story as context
      res.render('stories/edit', {
        story,
      })
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// Update a story
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    // Find the story by ID
    let story = await Story.findById(req.params.id).lean()

    // If the story does not exist, render the 404 error page
    if (!story) {
      return res.render('error/404')
    }

    // If the user is not the owner of the story, redirect to the stories page
    if (story.user != req.user.id) {
      res.redirect('/stories')
    } else {
      // Otherwise, update the story in the database with the new data
      story = await Story.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true,
      })

      // Redirect to the dashboard
      res.redirect('/dashboard')
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// Delete a story
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    // Find the story by ID
    let story = await Story.findById(req.params.id).lean()

    // If the story does not exist, render the 404 error page
    if (!story) {
      return res.render('error/404')
    }

    if (story.user != req.user.id) {
      res.redirect('/stories')
    } else {
      await Story.deleteOne({ _id: req.params.id })
      res.redirect('/dashboard')
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// Show add page
router.get('/user/:userId', ensureAuth, async (req, res) => {
  try{
    const stories = await Story.find({
      user: req.params.userId,
      status: 'public'
    })
    .populate('user')
    .lean()

    res.render('stories/index', {
      stories
    })
  }
  catch(err)
  {
    console.error(err)
    res.render('error/500')
  }
})

//@desc Search stories by title
//@route GET /stories/search/:query
router.get('/search/:query', ensureAuth, async (req, res) => {
  try{
      const stories = await Story.find({title: new RegExp(req.query.query,'i'), status: 'public'})
      .populate('user')
      .sort({ createdAt: 'desc'})
      .lean()
     res.render('stories/index', { stories })
  } catch(err){
      console.log(err)
      res.render('error/404')
  }
})

module.exports = router
