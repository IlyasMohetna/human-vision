FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install Angular CLI globally before switching to non-root user
RUN npm install -g @angular/cli

# Copy package files
COPY package*.json ./

# Copy the custom entrypoint script and set permissions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use the built-in 'node' user (or you can specify a custom user via build args if needed)
USER node

# Use the entrypoint script to ensure dependencies are installed
ENTRYPOINT ["docker-entrypoint.sh"]

# The default command starts the Angular app
CMD ["npm", "start"]
