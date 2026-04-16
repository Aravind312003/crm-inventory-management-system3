import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await getSupabase()
      .from('users')
      .select('*')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newUser, error: insertError } = await getSupabase()
      .from('users')
      .insert([{ username, email, password: hashedPassword }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    const token = jwt.sign({ id: newUser.id, username, email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newUser.id, username, email } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email
    
    const { data: user, error } = await getSupabase()
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .single();

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { data: user, error } = await getSupabase()
      .from('users')
      .select('id, username, email')
      .eq('id', decoded.id)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
