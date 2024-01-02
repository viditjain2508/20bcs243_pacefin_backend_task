const express = require('express');
const server = express();
const mysql = require('mysql');
const dotenv=require('dotenv');
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.toDo
});

connection.connect((err) => {
    if (err) {
        console.error("Error Connecting to MySQL:", err);
        return;
    }
    console.log("Connected Successfully");
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.toDo}`, (err, result) => {
        if (err) {
            console.error('Error Creating Database:', err);
            return;
        }
        // console.log(result);
        if (result.affectedRows > 0) {
            console.log('Database Created Successfully');
        }
        connection.query(`USE ${process.env.toDo}`, (err, result) => {
            if (err) {
                console.error('Error accessing Database:', err);
                return;
            }
            console.log('Using Database Successfully');
            connection.query(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(300) NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR(10) DEFAULT "ACTIVE" NOT NULL
                )
            `, (err, result) => {
                if (err) {
                    console.error('Error creating Table:', err);
                    return;
                }

                if (result.affectedRows > 0) {
                    console.log('Table created successfully');
                }
            });
        });
    });
});


server.post('/tasks', (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }
    connection.query(
        'INSERT INTO tasks (title, description) VALUES (?, ?)',
        [title, description],
        (err, result) => {
            if (err) {
                console.error("Error inserting task:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
            
            return res.status(201).json({ message: "Task inserted successfully" });
        }
    );
});



server.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    connection.query(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId],
        (err, result) => {
            if (err) {
                console.error("Error retrieving task:", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "Task not found" });
            }

            const task = result[0];
            res.status(200).json({ task });
        }
    );
});


server.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;

    if (!title || !description || !status) {
        return res.status(400).json({ error: "Title, description, and status are required" });
    }

    connection.query(
        'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
        [title, description, status, taskId],
        (err, result) => {
            if (err) {
                console.error("Error updating task:", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Task not found" });
            }

            res.status(200).json({ message: "Task updated successfully" });
        }
    );
});


server.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    connection.query(
        'DELETE FROM tasks WHERE id = ?',
        [taskId],
        (err, result) => {
            if (err) {
                console.error("Error deleting task:", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Task not found" });
            }

            res.status(200).json({ message: "Task deleted successfully" });
        }
    );
});



server.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

server.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
