# Task Management API Documentation

## Overview
This API provides endpoints for managing tasks in a task management system. It includes features for creating, reading, updating, and deleting tasks, as well as filtering, sorting, and searching tasks.

## Base URL
`http://localhost:5000/api`

## Authentication
All API endpoints require authentication. Include the JWT token in the `x-auth-token` header of your requests.

## Error Handling
All endpoints use a consistent error response format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Endpoints

### Authentication

#### Sign Up
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**: Status 200 OK
  ```json
  {
    "token": "JWT_TOKEN_HERE"
  }
  ```
- **Error Response**: Status 400 Bad Request or 500 Server Error

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "userpassword123"
  }
  ```
- **Success Response**: Status 200 OK
  ```json
  {
    "token": "JWT_TOKEN_HERE"
  }
  ```
- **Error Response**: Status 400 Bad Request or 500 Server Error

### Tasks

#### Create a Task
- **URL**: `/tasks`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "status": "To Do",
    "priority": "Medium",
    "dueDate": "2023-12-31T00:00:00.000Z",
    "categories": ["Work", "Important"]
  }
  ```
- **Success Response**: Status 201 Created
  ```json
  {
    "_id": "task_id_here",
    "title": "Task Title",
    "description": "Task Description",
    "status": "To Do",
    "priority": "Medium",
    "dueDate": "2023-12-31T00:00:00.000Z",
    "categories": ["Work", "Important"],
    "createdAt": "2023-05-20T10:30:00.000Z",
    "user": "user_id_here"
  }
  ```
- **Error Response**: Status 400 Bad Request or 500 Server Error

#### Get Tasks
- **URL**: `/tasks`
- **Method**: `GET`
- **Headers**: 
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Query Parameters**:
  - `status`: Filter by status ("To Do", "In Progress", "Done")
  - `priority`: Filter by priority ("Low", "Medium", "High")
  - `sortBy`: Sort tasks ("dueDate", "title", "priority", "createdAt")
  - `category`: Filter by category
  - `dueBefore`: Filter tasks due before this date (ISO format)
  - `dueAfter`: Filter tasks due after this date (ISO format)
  - `search`: Search in title and description
  - `page`: Page number for pagination (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `fields`: Comma-separated list of fields to return
- **Success Response**: Status 200 OK
  ```json
  {
    "success": true,
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 48
    },
    "data": [
      {
        "_id": "task_id_here",
        "title": "Task Title",
        "description": "Task Description",
        "status": "To Do",
        "priority": "Medium",
        "dueDate": "2023-12-31T00:00:00.000Z",
        "categories": ["Work", "Important"],
        "createdAt": "2023-05-20T10:30:00.000Z",
        "user": "user_id_here"
      },
      // ... more tasks
    ]
  }
  ```
- **Error Response**: Status 400 Bad Request or 500 Server Error

#### Update a Task
- **URL**: `/tasks/:id`
- **Method**: `PUT`
- **Headers**: 
  - `Content-Type: application/json`
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Body**: Same as Create a Task, all fields optional
- **Success Response**: Status 200 OK
  ```json
  {
    "_id": "task_id_here",
    "title": "Updated Task Title",
    "description": "Updated Task Description",
    "status": "In Progress",
    "priority": "High",
    "dueDate": "2023-12-31T00:00:00.000Z",
    "categories": ["Work", "Important", "Urgent"],
    "createdAt": "2023-05-20T10:30:00.000Z",
    "user": "user_id_here"
  }
  ```
- **Error Response**: Status 400 Bad Request, 404 Not Found, or 500 Server Error

#### Delete a Task
- **URL**: `/tasks/:id`
- **Method**: `DELETE`
- **Headers**: 
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Success Response**: Status 200 OK
  ```json
  {
    "msg": "Task removed",
    "task": {
      "_id": "task_id_here",
      "title": "Deleted Task Title"
    }
  }
  ```
- **Error Response**: Status 404 Not Found or 500 Server Error

#### Get Task Categories
- **URL**: `/tasks/categories`
- **Method**: `GET`
- **Headers**: 
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Success Response**: Status 200 OK
  ```json
  ["Work", "Personal", "Urgent", "Long-term", "Project A"]
  ```
- **Error Response**: Status 500 Server Error

#### Get Dashboard Summary
- **URL**: `/tasks/dashboard`
- **Method**: `GET`
- **Headers**: 
  - `x-auth-token: YOUR_JWT_TOKEN`
- **Success Response**: Status 200 OK
  ```json
  {
    "totalTasks": 48,
    "todoTasks": 20,
    "inProgressTasks": 15,
    "doneTasks": 13,
    "upcomingTasks": [
      {
        "_id": "task_id_here",
        "title": "Upcoming Task 1",
        "dueDate": "2023-06-01T00:00:00.000Z"
      },
      // ... more upcoming tasks
    ],
    "categoryCounts": [
      { "_id": "Work", "count": 25 },
      { "_id": "Personal", "count": 15 },
      // ... more category counts
    ]
  }
  ```
- **Error Response**: Status 500 Server Error

## Models

### User
- `username`: String (required, unique)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `createdAt`: Date (auto-generated)

### Task
- `title`: String (required)
- `description`: String
- `status`: String (enum: "To Do", "In Progress", "Done")
- `priority`: String (enum: "Low", "Medium", "High")
- `dueDate`: Date
- `categories`: Array of Strings
- `createdAt`: Date (auto-generated)
- `user`: ObjectId (reference to User model, auto-populated)

## Pagination
The GET tasks endpoint supports pagination:
- `page`: Specifies the page number (default: 1)
- `limit`: Specifies the number of items per page (default: 10)

Example: `/api/tasks?page=2&limit=20`

## Filtering and Sorting
- Filter tasks by status, priority, category, and date range
- Sort tasks by due date, title, priority, or creation date

Example: `/api/tasks?status=In Progress&priority=High&sortBy=dueDate`

## Search
Search for tasks by title or description using the `search` query parameter.

Example: `/api/tasks?search=project presentation`

---

This API documentation provides a comprehensive guide to using the Task Management API. For any additional information or support, please contact the API administrator.
