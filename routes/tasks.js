const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @route   POST api/tasks
// @desc    Create a task
// @access  Private
// POST route
router.post('/', auth, async (req, res, next) => {
    try {
      const { title, description, status, priority, dueDate, categories } = req.body;
  
      if (!title) {
        return next(new AppError('Title is required', 400));
      }
  
      const newTask = new Task({
        user: req.user.id,
        title,
        description,
        status: status || 'To Do',
        priority: priority || 'Medium',
        dueDate,
        categories: categories || []
      });
  
      const task = await newTask.save();
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  });
  
  // PUT route
  router.put('/:id', auth, async (req, res, next) => {
    try {
      const { title, description, status, dueDate, categories, priority } = req.body;
  
      let task = await Task.findById(req.params.id);
  
      if (!task) {
        return next(new AppError('Task not found', 404));
      }
  
      if (task.user.toString() !== req.user.id) {
        return next(new AppError('User not authorized', 401));
      }
  
      task = await Task.findByIdAndUpdate(
        req.params.id, 
        { title, description, status, dueDate, categories, priority }, 
        { new: true, runValidators: true }
      );
  
      res.json(task);
    } catch (err) {
      next(err);
    }
  });

// @route   GET api/tasks
// @desc    Get all tasks for a user with optional filtering, sorting, and pagination
// @access  Private
router.get('/', auth, async (req, res, next) => {
    try {
      const { 
        status, 
        sortBy, 
        category, 
        priority,
        dueBefore,
        dueAfter,
        page = 1, 
        limit = 10,
        fields,
        search
      } = req.query;
  
      // Validate pagination parameters
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
  
      if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
        return next(new AppError('Invalid pagination parameters', 400));
      }
  
      // Build the query
      const query = { user: req.user.id };
      if (status && ['To Do', 'In Progress', 'Done'].includes(status)) {
        query.status = status;
      }
      if (category) {
        query.categories = category;
      }
      if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
        query.priority = priority;
      }
      if (dueBefore) {
        query.dueDate = { ...query.dueDate, $lte: new Date(dueBefore) };
      }
      if (dueAfter) {
        query.dueDate = { ...query.dueDate, $gte: new Date(dueAfter) };
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      // Build the sort object
      let sort = { createdAt: -1 }; // Default sort
      if (sortBy === 'dueDate') {
        sort = { dueDate: 1 };
      } else if (sortBy === 'title') {
        sort = { title: 1 };
      } else if (sortBy === 'priority') {
        sort = { priority: -1 }; // High to Low
      }
  
      // Select fields
      let select = '';
      if (fields) {
        select = fields.split(',').join(' ');
      }
  
      // Execute query with pagination
      const tasks = await Task.find(query)
        .sort(sort)
        .select(select)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .exec();
  
      // Get total documents
      const totalTasks = await Task.countDocuments(query);
  
      // Pagination result
      const pagination = {
        currentPage: pageNumber,
        pageSize: limitNumber,
        totalPages: Math.ceil(totalTasks / limitNumber),
        totalItems: totalTasks,
      };
  
      res.json({
        success: true,
        pagination,
        data: tasks
      });
    } catch (err) {
      next(err);
    }
  });



// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    if (task.user.toString() !== req.user.id) {
      return next(new AppError('User not authorized', 401));
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return next(new AppError('Task not found or user not authorized', 404));
    }

    res.json({ msg: 'Task removed', task });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    const todoTasks = await Task.countDocuments({ user: req.user.id, status: 'To Do' });
    const inProgressTasks = await Task.countDocuments({ user: req.user.id, status: 'In Progress' });
    const doneTasks = await Task.countDocuments({ user: req.user.id, status: 'Done' });
    
    const upcomingTasks = await Task.find({
      user: req.user.id,
      status: { $ne: 'Done' },
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).sort({ dueDate: 1 }).limit(5);

    const categoryCounts = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } }
    ]);

    res.json({
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      upcomingTasks,
      categoryCounts
    });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', auth, async (req, res, next) => {
  try {
    const categories = await Task.distinct('categories', { user: req.user.id });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;