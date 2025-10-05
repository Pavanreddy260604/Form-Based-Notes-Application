const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MAN, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.log('MongoDB connection error:', err);
  process.exit(1);
});

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Database Schemas & Models
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  authProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['register', 'reset'], 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });
otpSchema.index({ email: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);

const itemSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  intro: {
    type: String,
    trim: true
  },
  why: {
    title: { type: String, trim: true },
    points: [{ type: String, trim: true }]
  },
  examples: [{
    title: { type: String, trim: true },
    code: { type: String, trim: true }
  }],
  best: {
    title: { type: String, trim: true },
    points: [{ type: String, trim: true }],
    conclusion: { type: String, trim: true }
  },
  path: {
    type: String,
    trim: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Item = mongoose.model('Item', itemSchema);

// Helper Functions
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendOTPEmail = async (email, otp, purpose) => {
  const subject = purpose === 'register' 
    ? 'Verify Your Email - OTP Code'
    : 'Password Reset OTP';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">${subject}</h2>
      <p>Your OTP code is:</p>
      <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

// AUTHENTICATION ROUTES
app.post('/api/users/register-send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { 
        otp: otpCode, 
        expiresAt,
        purpose: 'register'
      },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otpCode, 'register');

    res.json({ 
      success: true, 
      message: 'OTP sent to your email' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending OTP' 
    });
  }
});

app.post('/api/users/register-verify-otp', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const otpRecord = await OTP.findOne({ email, purpose: 'register' });
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not found or expired' 
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    if (otpRecord.otp !== otp) {
      await OTP.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: true,
      authProvider: 'local'
    });

    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is registered with Google. Please use Google login.' 
      });
    }

    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid authentication method' 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incorrect password' 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please verify your email first' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

app.post('/api/users/google-auth', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;

    if (!name || !email || !googleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google authentication data is required' 
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.authProvider === 'local') {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already registered with email/password. Please use email login.' 
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        authProvider: 'google'
      });
      await user.save();
    }

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google account already linked to another email' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Google authentication failed' 
    });
  }
});

app.post('/api/users/forgot-password-send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email, authProvider: 'local' });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Local user account not found' 
      });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { 
        otp: otpCode, 
        expiresAt,
        purpose: 'reset'
      },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otpCode, 'reset');

    res.json({ 
      success: true, 
      message: 'Password reset OTP sent to your email' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending OTP' 
    });
  }
});

app.post('/api/users/reset-password-with-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const otpRecord = await OTP.findOne({ email, purpose: 'reset' });
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not found or expired' 
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    if (otpRecord.otp !== otp) {
      await OTP.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    const user = await User.findOne({ email, authProvider: 'local' });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Local user account not found' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed' 
    });
  }
});

// ITEMS ROUTES
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().populate('userId', 'name email');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/items/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const items = await Item.find({ userId });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('userId', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/items/search', async (req, res) => {
  try {
    const { q: query, userId } = req.query;

    if (!query || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query and user ID are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const userItems = await Item.find({ userId: userId });
    
    res.json({ 
      success: true, 
      data: userItems,
      count: userItems.length
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Search failed' 
    });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId || !title) return res.status(400).json({ success: false, message: 'userId and title are required' });

    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json({ success: true, data: savedItem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { title, path, intro, why, examples, best } = req.body;
    
    if (!title || !path) {
      return res.status(400).json({ success: false, message: 'Title and path are required' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { title, path, intro, why, examples, best },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    res.json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error while updating topic' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Topic not found' });

    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});