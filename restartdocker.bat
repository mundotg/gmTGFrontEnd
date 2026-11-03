# 1. Para o container atual
docker stop MustaInfo-front
docker rm MustaInfo-front

# 2. Reconstrói a imagem (o Docker vai usar cache para ser mais rápido)
docker build -t MustaInfo-vercel-clone .

# 3. Roda novamente
docker run -d -p 3000:3000 --name MustaInfo-front MustaInfo-vercel-clone