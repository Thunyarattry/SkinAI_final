FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || echo "Build failed in Dockerfile stage; ensure your Next.js project has a build script."
EXPOSE 3000
CMD ["npm", "start"]
