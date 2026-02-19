FROM node:22-bookworm

WORKDIR /app

# Copy package.json and tarballs first for layer caching
COPY package.json ./
COPY packages/ ./packages/

# Install dependencies: AG Charts from local tarballs, others from registry
RUN npm install

# Copy example sources and tsconfig (code-only changes skip install layer)
COPY examples/ ./examples/
COPY tsconfig.json ./

# Ensure output directory exists inside container
RUN mkdir -p output

EXPOSE 3000

CMD ["npx", "tsx", "examples/01-basic-render.ts"]
