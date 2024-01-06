import express from 'express';

import { loginUserSanitizer, loginUserValidator, registerUserValidator } from '../Middleware/validation/user';
import { loginUser, registerUser } from '../Controllers/user.controllers';

const router = express.Router();

router.post('/register', registerUserValidator, registerUser);
router.post('/login', loginUserValidator, loginUserSanitizer, loginUser);

export default router;