const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const defaultTasks = [
  {
    title: "Submit ID Proof",
    description: "Upload Aadhaar or Passport"
  },
  {
    title: "Complete Orientation",
    description: "Watch company onboarding video"
  },
  {
    title: "Setup Development Environment",
    description: "Install required tools"
  }
];



// REGISTER USER
const registerUser = async (req, res) => {
    try {

        const { name, email, password, role } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        // AUTO ASSIGN DEFAULT TASKS FOR INTERN
if (role === "intern") {

  const tasks = defaultTasks.map(task => ({
    title: task.title,
    description: task.description,
    taskType: "admin",

    assignments: [
      {
        user: user._id,
        status: "pending"
      }
    ],

    totalAssigned: 1,
    completedCount: 0,
    createdBy: user._id
  }));

  await Task.insertMany(tasks);
}

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};



// LOGIN USER
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        // check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

module.exports = {
    registerUser,
    loginUser
};