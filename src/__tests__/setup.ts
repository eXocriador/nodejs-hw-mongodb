import dotenv from 'dotenv';
import path from 'path';

// Завантажуємо тестове середовище
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Мокаємо глобальні залежності
jest.mock('../db/initMongoConnection', () => ({
  initMongoConnection: jest.fn().mockResolvedValue(undefined)
}));

// Очищаємо всі моки після кожного тесту
afterEach(() => {
  jest.clearAllMocks();
});
