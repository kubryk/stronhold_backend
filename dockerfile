# Використовуємо базовий образ Node.js для ARM
FROM node:18-alpine

# Встановлюємо робочу директорію в контейнері
WORKDIR /usr/src/app

# Копіюємо package.json і package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код в контейнер
COPY . .

# Експонуємо порт для доступу до сервера
EXPOSE 3001

# Вказуємо команду для запуску додатка
CMD ["node", "index.js"]