import jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  generateToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async authenticate(request: FastifyRequest) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    return this.verifyToken(token);
  }
}