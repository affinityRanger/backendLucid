// backend/controllers/authController.js

const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const dotenv = require('dotenv'); 


dotenv.config(); 

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body; 

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // 3. Create new user instance
        user = new User({
            name,
            email,
            password: hashedPassword,
            phone, 
        });

        // 4. Save user to database
        await user.save();

        // 5. Generate JWT
        const payload = {
            user: {
                id: user.id, 
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, 
            { expiresIn: '4d' }, 
            (err, token) => {
                if (err) {
                    console.error('JWT Sign Error (register):', err); 
                    return res.status(500).send('Server Error: Failed to generate token during registration');
                }
                res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone, 
                    },
                });
            }
        );
    } catch (err) {

        console.error('Error during user registration:', err);
    
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(500).send('Server Error during registration');
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' }); // User not found
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Password mismatch
        }

        // 3. Generate JWT
        const payload = {
            user: {
                id: user.id 
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, 
            { expiresIn: '4d' }, 
            (err, token) => {
                if (err) {
                    console.error('JWT Sign Error (login):', err); 
                    return res.status(500).send('Server Error: Failed to generate token during login');
                }
                res.json({
                    message: 'Logged in successfully',
                    token,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone, 
                    },
                });
            }
        );

    } catch (err) {
    
        console.error('Error during user login:', err);
        res.status(500).send('Server error during login');
    }
};

exports.getMe = async (req, res) => {
    try {
        
    
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone, 
        });
    } catch (err) {

        console.error('Error fetching user data:', err);
        res.status(500).send('Server Error fetching user data');
    }
};